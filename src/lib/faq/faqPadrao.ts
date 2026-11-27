/**
 * Perguntas iniciais, iguais às inseridas pela migração `faq_itens`.
 * Usadas sem Supabase e quando a leitura falha na landing.
 * Spec: SPEC/2026-11-27-faq-gerenciado-admin.md
 */
import { TOLERANCIA_CANCELAMENTO_HORAS } from "@/lib/constants";
import type { ItemFaq } from "./types";

const CRIADO_EM = "2026-11-27T00:00:00Z";

export const FAQ_PADRAO: readonly ItemFaq[] = [
  {
    id: "00000000-0000-4000-8000-00000000fa01",
    pergunta: "O que acontece se chover no horário da minha reserva?",
    resposta:
      "As quadras têm drenagem rápida e o jogo normalmente continua. Se a chuva impedir o uso, fale com o complexo pelo WhatsApp antes do horário para remarcar.",
    categoria: "regras",
    ordem: 1,
    ativo: true,
    criadoEm: CRIADO_EM,
  },
  {
    id: "00000000-0000-4000-8000-00000000fa02",
    pergunta: "Posso cancelar minha reserva?",
    resposta: `Sim, pela Minha Conta, com pelo menos ${TOLERANCIA_CANCELAMENTO_HORAS} horas de antecedência. Com menos tempo, fale com o complexo pelo WhatsApp.`,
    categoria: "reservas",
    ordem: 2,
    ativo: true,
    criadoEm: CRIADO_EM,
  },
  {
    id: "00000000-0000-4000-8000-00000000fa03",
    pergunta: "Qual roupa e calçado posso usar nas quadras?",
    resposta:
      "Use roupa esportiva e tênis ou chuteira society. Chuteiras de trava alta ou de alumínio não são permitidas, para preservar o piso.",
    categoria: "regras",
    ordem: 3,
    ativo: true,
    criadoEm: CRIADO_EM,
  },
  {
    id: "00000000-0000-4000-8000-00000000fa04",
    pergunta: "Com quanto tempo de antecedência devo chegar?",
    resposta:
      "Chegue de 10 a 15 minutos antes para se trocar e aquecer. O horário termina no fim da reserva, mesmo que o jogo tenha começado atrasado.",
    categoria: "geral",
    ordem: 4,
    ativo: true,
    criadoEm: CRIADO_EM,
  },
];
