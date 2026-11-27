-- ==============================================================================
-- Perguntas frequentes da landing, gerenciadas pelo admin
-- Spec: SPEC/2026-11-27-faq-gerenciado-admin.md
--
-- Leitura pública só das perguntas ativas; o admin lê todas e é o único que grava.
-- Os limites dos CHECK são os mesmos de src/lib/faq/regrasFaq.ts.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.faq_itens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pergunta TEXT NOT NULL CHECK (char_length(btrim(pergunta)) BETWEEN 5 AND 200),
  resposta TEXT NOT NULL CHECK (char_length(btrim(resposta)) BETWEEN 10 AND 2000),
  categoria TEXT NOT NULL DEFAULT 'geral' CHECK (categoria IN ('reservas', 'pagamentos', 'regras', 'geral')),
  ordem INTEGER NOT NULL DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Perguntas iniciais, iguais a src/lib/faq/faqPadrao.ts. O admin pode editar ou apagar.
INSERT INTO public.faq_itens (id, pergunta, resposta, categoria, ordem, criado_em) VALUES
  ('00000000-0000-4000-8000-00000000fa01',
   'O que acontece se chover no horário da minha reserva?',
   'As quadras têm drenagem rápida e o jogo normalmente continua. Se a chuva impedir o uso, fale com o complexo pelo WhatsApp antes do horário para remarcar.',
   'regras', 1, '2026-11-27T00:00:00Z'),
  ('00000000-0000-4000-8000-00000000fa02',
   'Posso cancelar minha reserva?',
   'Sim, pela Minha Conta, com pelo menos 24 horas de antecedência. Com menos tempo, fale com o complexo pelo WhatsApp.',
   'reservas', 2, '2026-11-27T00:00:00Z'),
  ('00000000-0000-4000-8000-00000000fa03',
   'Qual roupa e calçado posso usar nas quadras?',
   'Use roupa esportiva e tênis ou chuteira society. Chuteiras de trava alta ou de alumínio não são permitidas, para preservar o piso.',
   'regras', 3, '2026-11-27T00:00:00Z'),
  ('00000000-0000-4000-8000-00000000fa04',
   'Com quanto tempo de antecedência devo chegar?',
   'Chegue de 10 a 15 minutos antes para se trocar e aquecer. O horário termina no fim da reserva, mesmo que o jogo tenha começado atrasado.',
   'geral', 4, '2026-11-27T00:00:00Z')
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.faq_itens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "FAQ: leitura das ativas" ON public.faq_itens;
CREATE POLICY "FAQ: leitura das ativas"
  ON public.faq_itens FOR SELECT USING (ativo OR public.is_admin());

DROP POLICY IF EXISTS "FAQ: admin gerencia" ON public.faq_itens;
CREATE POLICY "FAQ: admin gerencia"
  ON public.faq_itens FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());
