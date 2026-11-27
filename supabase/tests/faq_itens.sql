-- Testes da tabela faq_itens (leitura pública só das ativas, gestão só pelo admin).
-- Rodam no workflow de migrações, numa transação desfeita no final.
-- Spec: SPEC/2026-11-27-faq-gerenciado-admin.md

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
  ('00000000-0000-4000-8000-0000000000f1', 'cliente-faq@teste.invalid', '{}'),
  ('00000000-0000-4000-8000-0000000000fd', 'admin-faq@teste.invalid', '{}');
INSERT INTO public.administradores (user_id) VALUES ('00000000-0000-4000-8000-0000000000fd');

-- Dono da tabela: perguntas iniciais, uma inativa para os testes e os CHECK.
INSERT INTO public.faq_itens (id, pergunta, resposta, categoria, ordem, ativo) VALUES
  ('00000000-0000-4000-8000-00000000faff', 'Pergunta inativa?', 'Resposta da pergunta inativa.', 'geral', 99, FALSE);

DO $$
BEGIN
  ASSERT (SELECT count(*) FROM public.faq_itens WHERE ativo) = 4, 'migração cria as quatro perguntas iniciais';
  ASSERT pg_temp.falha($q$INSERT INTO public.faq_itens (pergunta, resposta) VALUES ('Curt', 'Resposta válida aqui.')$q$),
    'pergunta com menos de 5 caracteres é recusada';
  ASSERT pg_temp.falha($q$INSERT INTO public.faq_itens (pergunta, resposta) VALUES ('Pergunta?', '   curta   ')$q$),
    'resposta com menos de 10 caracteres (sem espaços) é recusada';
  ASSERT pg_temp.falha($q$INSERT INTO public.faq_itens (pergunta, resposta, categoria) VALUES ('Pergunta?', 'Resposta válida aqui.', 'outra')$q$),
    'categoria desconhecida é recusada';
END $$;

-- ---------------------------------------------------------------- visitante
SET LOCAL ROLE anon;
SELECT pg_temp.sessao(NULL);
DO $$
BEGIN
  ASSERT (SELECT count(*) FROM public.faq_itens) = 4, 'visitante lê só as ativas';
  ASSERT pg_temp.falha($q$INSERT INTO public.faq_itens (pergunta, resposta) VALUES ('Pergunta?', 'Resposta válida aqui.')$q$),
    'visitante não cria';
  ASSERT pg_temp.linhas($q$UPDATE public.faq_itens SET ativo = FALSE$q$) = 0, 'visitante não altera';
  ASSERT pg_temp.linhas($q$DELETE FROM public.faq_itens$q$) = 0, 'visitante não apaga';
END $$;
RESET ROLE;

-- ---------------------------------------------------------------- cliente logado
SET LOCAL ROLE authenticated;
SELECT pg_temp.sessao('00000000-0000-4000-8000-0000000000f1');
DO $$
BEGIN
  ASSERT (SELECT count(*) FROM public.faq_itens) = 4, 'cliente lê só as ativas';
  ASSERT pg_temp.falha($q$INSERT INTO public.faq_itens (pergunta, resposta) VALUES ('Pergunta?', 'Resposta válida aqui.')$q$),
    'cliente não cria';
  ASSERT pg_temp.linhas($q$UPDATE public.faq_itens SET resposta = 'Resposta alterada.'$q$) = 0, 'cliente não altera';
  ASSERT pg_temp.linhas($q$DELETE FROM public.faq_itens$q$) = 0, 'cliente não apaga';
END $$;
RESET ROLE;

-- ---------------------------------------------------------------- admin
SET LOCAL ROLE authenticated;
SELECT pg_temp.sessao('00000000-0000-4000-8000-0000000000fd');
DO $$
BEGIN
  ASSERT (SELECT count(*) FROM public.faq_itens) = 5, 'admin lê também as inativas';
  ASSERT pg_temp.linhas($q$INSERT INTO public.faq_itens (pergunta, resposta, categoria, ordem) VALUES ('Tem estacionamento?', 'Sim, gratuito para clientes.', 'geral', 5)$q$) = 1,
    'admin cria';
  ASSERT pg_temp.linhas($q$UPDATE public.faq_itens SET ativo = TRUE WHERE id = '00000000-0000-4000-8000-00000000faff'$q$) = 1,
    'admin altera';
  ASSERT pg_temp.linhas($q$DELETE FROM public.faq_itens WHERE pergunta = 'Tem estacionamento?'$q$) = 1,
    'admin apaga';
END $$;
RESET ROLE;

DO $$ BEGIN RAISE NOTICE 'faq_itens: todos os testes passaram'; END $$;
ROLLBACK;
