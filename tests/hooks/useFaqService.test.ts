/**
 * Hook do FAQ: fallback na landing, erro visível no admin e reordenação com volta atrás.
 * Spec: SPEC/2026-11-27-faq-gerenciado-admin.md
 */
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FAQ_PADRAO } from "@/lib/faq/faqPadrao";
import type { ItemFaq } from "@/lib/faq/types";

const listarItensFaq = vi.fn();
const salvarItemFaq = vi.fn();
const excluirItemFaq = vi.fn();
const salvarOrdemFaq = vi.fn();

vi.mock("@/lib/supabase/faqRepository", () => ({
  listarItensFaq: () => listarItensFaq(),
  salvarItemFaq: (item: unknown) => salvarItemFaq(item),
  excluirItemFaq: (id: string) => excluirItemFaq(id),
  salvarOrdemFaq: (itens: unknown) => salvarOrdemFaq(itens),
}));

import { useFaqService } from "@/hooks/useFaqService";

function item(id: string, ordem: number, ativo = true): ItemFaq {
  return { id, pergunta: `Pergunta ${id}?`, resposta: "Resposta longa o bastante.", categoria: "geral", ordem, ativo, criadoEm: "2026-11-27T10:00:00Z" };
}

const ids = (lista: ItemFaq[]) => lista.map((i) => i.id);
const FALHA = { ok: false, mensagem: "Não foi possível carregar as perguntas frequentes." };

describe("useFaqService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listarItensFaq.mockResolvedValue({ ok: true, dado: [item("a", 1), item("b", 2), item("x", 3, false)] });
    salvarOrdemFaq.mockResolvedValue({ ok: true, dado: undefined });
  });

  it("na landing expõe só os ativos, em ordem", async () => {
    const { result } = renderHook(() => useFaqService("landing"));
    await waitFor(() => expect(result.current.carregando).toBe(false));
    expect(ids(result.current.ativos)).toEqual(["a", "b"]);
  });

  it("na landing, falha de leitura usa as perguntas padrão sem mostrar erro", async () => {
    listarItensFaq.mockResolvedValue(FALHA);
    const { result } = renderHook(() => useFaqService("landing"));
    await waitFor(() => expect(result.current.carregando).toBe(false));
    expect(result.current.ativos).toHaveLength(FAQ_PADRAO.length);
    expect(result.current.erro).toBeNull();
  });

  it("no admin, falha de leitura mostra o erro e nenhuma pergunta", async () => {
    listarItensFaq.mockResolvedValue(FALHA);
    const { result } = renderHook(() => useFaqService("admin"));
    await waitFor(() => expect(result.current.carregando).toBe(false));
    expect(result.current.itens).toEqual([]);
    expect(result.current.erro).toBe(FALHA.mensagem);
  });

  it("mover grava a nova ordem e, se falhar, volta à anterior", async () => {
    const { result } = renderHook(() => useFaqService("admin"));
    await waitFor(() => expect(result.current.carregando).toBe(false));

    await act(async () => {
      await result.current.mover("b", "cima");
    });
    expect(ids(result.current.itens)).toEqual(["b", "a", "x"]);
    expect(salvarOrdemFaq).toHaveBeenCalledTimes(1);

    salvarOrdemFaq.mockResolvedValue({ ok: false, mensagem: "Sem permissão" });
    let resultado: unknown;
    await act(async () => {
      resultado = await result.current.mover("x", "cima");
    });
    expect(resultado).toEqual({ ok: false, mensagem: "Sem permissão" });
    expect(ids(result.current.itens)).toEqual(["b", "a", "x"]);
  });

  it("mover o primeiro para cima não grava nada", async () => {
    const { result } = renderHook(() => useFaqService("admin"));
    await waitFor(() => expect(result.current.carregando).toBe(false));
    await act(async () => {
      await result.current.mover("a", "cima");
    });
    expect(salvarOrdemFaq).not.toHaveBeenCalled();
  });

  it("salvar, alternar e excluir atualizam a lista só quando o banco aceita", async () => {
    const { result } = renderHook(() => useFaqService("admin"));
    await waitFor(() => expect(result.current.carregando).toBe(false));

    salvarItemFaq.mockImplementation((i: ItemFaq) => Promise.resolve({ ok: true, dado: { ...i, id: i.id ?? "novo" } }));
    await act(async () => {
      await result.current.salvar({ pergunta: "Nova pergunta?", resposta: "Resposta nova aqui.", categoria: "geral", ordem: 4, ativo: true });
    });
    expect(ids(result.current.itens)).toEqual(["a", "b", "x", "novo"]);

    await act(async () => {
      await result.current.alternarAtivo("x");
    });
    expect(result.current.itens.find((i) => i.id === "x")?.ativo).toBe(true);

    excluirItemFaq.mockResolvedValue({ ok: false, mensagem: "Sem permissão" });
    await act(async () => {
      await result.current.excluir("a");
    });
    expect(ids(result.current.itens)).toContain("a");

    excluirItemFaq.mockResolvedValue({ ok: true, dado: undefined });
    await act(async () => {
      await result.current.excluir("a");
    });
    expect(ids(result.current.itens)).not.toContain("a");
  });
});
