/**
 * Regras puras do FAQ: validação, ordem e reordenação.
 * Spec: SPEC/2026-11-27-faq-gerenciado-admin.md
 */
import { describe, expect, it } from "vitest";
import {
  filtrarAtivos,
  moverItem,
  ordenarItensFaq,
  proximaOrdem,
  validarItemFaq,
} from "@/lib/faq/regrasFaq";
import { FAQ_PADRAO } from "@/lib/faq/faqPadrao";
import type { ItemFaq } from "@/lib/faq/types";

function item(id: string, ordem: number, extra: Partial<ItemFaq> = {}): ItemFaq {
  return {
    id,
    pergunta: `Pergunta ${id}?`,
    resposta: `Resposta da pergunta ${id}.`,
    categoria: "geral",
    ordem,
    ativo: true,
    criadoEm: "2026-11-27T10:00:00Z",
    ...extra,
  };
}

const ids = (lista: ItemFaq[]) => lista.map((i) => i.id);

describe("validarItemFaq", () => {
  const valido = { pergunta: "Pode jogar de chuteira?", resposta: "Só chuteira society.", categoria: "regras" as const };

  it("aceita dados dentro dos limites", () => {
    expect(validarItemFaq(valido)).toEqual({});
  });

  it("conta os limites depois de aparar os espaços", () => {
    expect(validarItemFaq({ ...valido, pergunta: "  abcd  " }).pergunta).toBeDefined();
    expect(validarItemFaq({ ...valido, pergunta: "  abcde  " }).pergunta).toBeUndefined();
    expect(validarItemFaq({ ...valido, resposta: " 123456789 " }).resposta).toBeDefined();
    expect(validarItemFaq({ ...valido, resposta: "1234567890" }).resposta).toBeUndefined();
  });

  it("recusa textos acima do máximo e categoria desconhecida", () => {
    const erros = validarItemFaq({
      pergunta: "p".repeat(201),
      resposta: "r".repeat(2001),
      categoria: "outra" as never,
    });
    expect(Object.keys(erros).sort()).toEqual(["categoria", "pergunta", "resposta"]);
  });
});

describe("ordenarItensFaq", () => {
  it("ordena por ordem, com empate por criação e depois id", () => {
    const lista = [
      item("c", 2),
      item("b", 1, { criadoEm: "2026-11-27T12:00:00Z" }),
      item("a", 1, { criadoEm: "2026-11-27T12:00:00Z" }),
      item("z", 1, { criadoEm: "2026-11-27T09:00:00Z" }),
    ];
    expect(ids(ordenarItensFaq(lista))).toEqual(["z", "a", "b", "c"]);
  });

  it("não altera a lista recebida", () => {
    const lista = [item("b", 2), item("a", 1)];
    ordenarItensFaq(lista);
    expect(ids(lista)).toEqual(["b", "a"]);
  });
});

describe("moverItem", () => {
  const lista = [item("a", 10), item("b", 20), item("c", 30)];

  it("troca com o vizinho e renumera de 1 a N", () => {
    const resultado = moverItem(lista, "b", "cima");
    expect(ids(resultado)).toEqual(["b", "a", "c"]);
    expect(resultado.map((i) => i.ordem)).toEqual([1, 2, 3]);
    expect(ids(moverItem(lista, "b", "baixo"))).toEqual(["a", "c", "b"]);
  });

  it("o primeiro não sobe e o último não desce", () => {
    expect(ids(moverItem(lista, "a", "cima"))).toEqual(["a", "b", "c"]);
    expect(ids(moverItem(lista, "c", "baixo"))).toEqual(["a", "b", "c"]);
  });

  it("id desconhecido devolve a lista sem mudança", () => {
    expect(moverItem(lista, "x", "cima")).toEqual(ordenarItensFaq(lista));
  });
});

describe("filtrarAtivos e proximaOrdem", () => {
  it("mantém só os ativos, em ordem", () => {
    const lista = [item("b", 2), item("x", 1, { ativo: false }), item("a", 1)];
    expect(ids(filtrarAtivos(lista))).toEqual(["a", "b"]);
  });

  it("próxima ordem é a maior + 1, e 1 para lista vazia", () => {
    expect(proximaOrdem([item("a", 3), item("b", 7)])).toBe(8);
    expect(proximaOrdem([])).toBe(1);
  });
});

describe("FAQ_PADRAO", () => {
  it("tem as quatro perguntas iniciais válidas, ativas e com ordem distinta", () => {
    expect(FAQ_PADRAO).toHaveLength(4);
    for (const i of FAQ_PADRAO) {
      expect(validarItemFaq(i)).toEqual({});
      expect(i.ativo).toBe(true);
    }
    expect(new Set(FAQ_PADRAO.map((i) => i.ordem)).size).toBe(4);
  });
});
