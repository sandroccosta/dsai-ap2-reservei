/**
 * Regras puras do FAQ: validação, ordem de exibição e reordenação.
 * Spec: SPEC/2026-11-27-faq-gerenciado-admin.md
 */
import {
  CATEGORIAS_FAQ,
  type DadosItemFaq,
  type DirecaoMovimento,
  type ErrosItemFaq,
  type ItemFaq,
} from "./types";

/** Limites iguais aos CHECK da tabela `faq_itens`. */
export const LIMITES_FAQ = {
  pergunta: { min: 5, max: 200 },
  resposta: { min: 10, max: 2000 },
} as const;

function erroTamanho(rotulo: string, texto: string, limite: { min: number; max: number }): string | undefined {
  const tamanho = texto.trim().length;
  if (tamanho < limite.min) return `${rotulo} precisa ter pelo menos ${limite.min} caracteres.`;
  if (tamanho > limite.max) return `${rotulo} pode ter no máximo ${limite.max} caracteres.`;
  return undefined;
}

export function validarItemFaq(dados: DadosItemFaq): ErrosItemFaq {
  const erros: ErrosItemFaq = {};
  const pergunta = erroTamanho("A pergunta", dados.pergunta ?? "", LIMITES_FAQ.pergunta);
  const resposta = erroTamanho("A resposta", dados.resposta ?? "", LIMITES_FAQ.resposta);
  if (pergunta) erros.pergunta = pergunta;
  if (resposta) erros.resposta = resposta;
  if (!Object.hasOwn(CATEGORIAS_FAQ, dados.categoria)) erros.categoria = "Escolha uma categoria.";
  return erros;
}

/** Por `ordem`; empate por data de criação e depois id, para a ordem não variar entre cargas. */
export function ordenarItensFaq(itens: readonly ItemFaq[]): ItemFaq[] {
  return [...itens].sort(
    (a, b) =>
      a.ordem - b.ordem ||
      a.criadoEm.localeCompare(b.criadoEm) ||
      a.id.localeCompare(b.id)
  );
}

/**
 * Troca o item com o vizinho na lista ordenada e renumera `ordem` de 1 a N.
 * O primeiro não sobe, o último não desce; id desconhecido não muda nada.
 */
export function moverItem(itens: readonly ItemFaq[], id: string, direcao: DirecaoMovimento): ItemFaq[] {
  const lista = ordenarItensFaq(itens);
  const indice = lista.findIndex((i) => i.id === id);
  const alvo = direcao === "cima" ? indice - 1 : indice + 1;
  if (indice === -1 || alvo < 0 || alvo >= lista.length) return lista;
  [lista[indice], lista[alvo]] = [lista[alvo], lista[indice]];
  return lista.map((i, posicao) => ({ ...i, ordem: posicao + 1 }));
}

export function filtrarAtivos(itens: readonly ItemFaq[]): ItemFaq[] {
  return ordenarItensFaq(itens.filter((i) => i.ativo));
}

export function proximaOrdem(itens: readonly ItemFaq[]): number {
  return itens.reduce((maior, i) => Math.max(maior, i.ordem), 0) + 1;
}
