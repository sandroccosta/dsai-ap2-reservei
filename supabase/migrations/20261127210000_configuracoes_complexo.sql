-- ==============================================================================
-- Configurações do complexo (dados de contato exibidos no site)
-- Spec: SPEC/2026-11-27-configuracoes-complexo.md
--
-- Uma linha só (id 'principal'). Leitura pública; gravação só pelo admin.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.configuracoes_complexo (
  id TEXT PRIMARY KEY DEFAULT 'principal' CHECK (id = 'principal'),
  nome_complexo TEXT NOT NULL,
  descricao TEXT NOT NULL DEFAULT '',
  slogan TEXT NOT NULL DEFAULT '',
  endereco TEXT NOT NULL DEFAULT '',
  telefone TEXT NOT NULL DEFAULT '',
  whatsapp TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  instagram_url TEXT NOT NULL DEFAULT '',
  facebook_url TEXT NOT NULL DEFAULT '',
  horario_funcionamento TEXT NOT NULL DEFAULT '',
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Valores atuais do código, para nada mudar até o admin editar.
INSERT INTO public.configuracoes_complexo (
  id, nome_complexo, descricao, slogan, endereco, telefone, whatsapp,
  email, instagram_url, facebook_url, horario_funcionamento
) VALUES (
  'principal',
  'Complexo Esportivo Reservei',
  'Complexo Esportivo',
  'Reserve sua quadra em segundos, jogue e acumule recompensas.',
  'Rua das Quadras, 100 – Centro',
  '(11) 99999-0000',
  '5500000000000',
  '',
  'https://www.instagram.com/',
  'https://www.facebook.com/',
  'Todos os dias, das 08h às 22h'
) ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.configuracoes_complexo ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Configurações: leitura pública" ON public.configuracoes_complexo;
CREATE POLICY "Configurações: leitura pública"
  ON public.configuracoes_complexo FOR SELECT USING (true);

DROP POLICY IF EXISTS "Configurações: admin gerencia" ON public.configuracoes_complexo;
CREATE POLICY "Configurações: admin gerencia"
  ON public.configuracoes_complexo FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());
