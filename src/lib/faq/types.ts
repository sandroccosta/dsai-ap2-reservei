/**
 * Tipos do FAQ gerenciado pelo admin.
 * Spec: SPEC/2026-11-27-faq-gerenciado-admin.md
 */

export const CATEGORIAS_FAQ = {
  reservas: "Reservas",
  pagamentos: "Pagamentos",
  regras: "Regras de uso",
  geral: "Geral",
} as const;

export type CategoriaFaq = keyof typeof CATEGORIAS_FAQ;

/** Campos que o admin edita no formulário. */
export interface DadosItemFaq {
  pergunta: string;
  resposta: string;
  categoria: CategoriaFaq;
}

export interface ItemFaq extends DadosItemFaq {
  id: string;
  ordem: number;
  ativo: boolean;
  criadoEm: string;
}

export type ErrosItemFaq = Partial<Record<keyof DadosItemFaq, string>>;

export type DirecaoMovimento = "cima" | "baixo";
