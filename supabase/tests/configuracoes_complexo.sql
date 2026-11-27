-- Testes da tabela configuracoes_complexo (uma linha, leitura pública, gravação
-- só pelo admin). Rodam no workflow de migrações, numa transação desfeita no final.
-- Spec: SPEC/2026-11-27-configuracoes-complexo.md

\set ON_ERROR_STOP on
BEGIN;

CREATE FUNCTION pg_temp.sessao(p_uid UUID) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  PERFORM set_config('request.jwt.claim.sub', COALESCE(p_uid::text, ''), true);
  PERFORM set_config('request.jwt.claims',
    CASE WHEN p_uid IS NULL THEN '{"role":"anon"}' ELSE json_build_object('sub', p_uid, 'role', 'authenticated')::text END,
    true);
END;
$$;

CREATE FUNCTION pg_temp.linhas(p_sql TEXT) RETURNS INTEGER LANGUAGE plpgsql AS $$
DECLARE n INTEGER;
BEGIN
  EXECUTE p_sql;
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END;
$$;

CREATE FUNCTION pg_temp.falha(p_sql TEXT) RETURNS BOOLEAN LANGUAGE plpgsql AS $$
BEGIN
  EXECUTE p_sql;
  RETURN FALSE;
EXCEPTION WHEN OTHERS THEN
  RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION pg_temp.sessao(UUID), pg_temp.linhas(TEXT), pg_temp.falha(TEXT)
  TO anon, authenticated;

INSERT INTO auth.users (id, email, raw_user_meta_data) VALUES
  ('00000000-0000-4000-8000-0000000000c1', 'cliente-config@teste.invalid', '{}'),
  ('00000000-0000-4000-8000-0000000000cd', 'admin-config@teste.invalid', '{}');
INSERT INTO public.administradores (user_id) VALUES ('00000000-0000-4000-8000-0000000000cd');

-- Dono da tabela: a migração criou a linha padrão e o CHECK impede outra.
DO $$
BEGIN
  ASSERT (SELECT count(*) FROM public.configuracoes_complexo) = 1, 'migração cria a linha principal';
  ASSERT pg_temp.falha($q$INSERT INTO public.configuracoes_complexo (id, nome_complexo) VALUES ('outra', 'X')$q$),
    'só a linha principal é aceita';
END $$;

-- ---------------------------------------------------------------- visitante
SET LOCAL ROLE anon;
SELECT pg_temp.sessao(NULL);
DO $$
BEGIN
  ASSERT (SELECT nome_complexo FROM public.configuracoes_complexo WHERE id = 'principal') <> '',
    'visitante lê as configurações';
  ASSERT pg_temp.linhas($q$UPDATE public.configuracoes_complexo SET whatsapp = '5591000000000'$q$) = 0,
    'visitante não altera';
  ASSERT pg_temp.linhas($q$DELETE FROM public.configuracoes_complexo$q$) = 0, 'visitante não apaga';
END $$;
RESET ROLE;

-- ---------------------------------------------------------------- cliente logado
SET LOCAL ROLE authenticated;
SELECT pg_temp.sessao('00000000-0000-4000-8000-0000000000c1');
DO $$
BEGIN
  ASSERT pg_temp.linhas($q$UPDATE public.configuracoes_complexo SET whatsapp = '5591000000000'$q$) = 0,
    'cliente não altera';
END $$;
RESET ROLE;

-- ---------------------------------------------------------------- admin
SET LOCAL ROLE authenticated;
SELECT pg_temp.sessao('00000000-0000-4000-8000-0000000000cd');
DO $$
BEGIN
  ASSERT pg_temp.linhas($q$UPDATE public.configuracoes_complexo SET whatsapp = '5591988887777'$q$) = 1,
    'admin altera';
  ASSERT (SELECT whatsapp FROM public.configuracoes_complexo) = '5591988887777';
END $$;
RESET ROLE;

DO $$ BEGIN RAISE NOTICE 'configuracoes_complexo: todos os testes passaram'; END $$;
ROLLBACK;
