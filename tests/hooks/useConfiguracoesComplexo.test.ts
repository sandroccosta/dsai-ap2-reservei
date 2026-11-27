/**
 * Hook das configurações do complexo: um carregamento compartilhado e salvamento.
 * Spec: SPEC/2026-11-27-configuracoes-complexo.md
 */
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CONFIGURACOES_PADRAO } from "@/lib/configuracoes/configuracoesComplexo";

const obterConfiguracoes = vi.fn();
const salvarConfiguracoes = vi.fn();

vi.mock("@/lib/supabase/configuracoesRepository", () => ({
  obterConfiguracoes: () => obterConfiguracoes(),
  salvarConfiguracoes: (dados: unknown) => salvarConfiguracoes(dados),
}));

import {
  redefinirConfiguracoesComplexo,
  useConfiguracoesComplexo,
} from "@/hooks/useConfiguracoesComplexo";

const doBanco = { ...CONFIGURACOES_PADRAO, nomeComplexo: "Arena Belém", whatsapp: "5591988887777" };

describe("useConfiguracoesComplexo", () => {
  beforeEach(() => {
    redefinirConfiguracoesComplexo();
    vi.clearAllMocks();
    obterConfiguracoes.mockResolvedValue(doBanco);
  });

  it("mostra o padrão enquanto carrega e depois os dados do banco", async () => {
    const { result } = renderHook(() => useConfiguracoesComplexo());

    expect(result.current.configuracoes).toEqual(CONFIGURACOES_PADRAO);
    expect(result.current.carregando).toBe(true);
    await waitFor(() => expect(result.current.carregando).toBe(false));
    expect(result.current.configuracoes.nomeComplexo).toBe("Arena Belém");
  });

  it("carrega uma vez só para vários componentes", async () => {
    const a = renderHook(() => useConfiguracoesComplexo());
    const b = renderHook(() => useConfiguracoesComplexo());

    await waitFor(() => expect(b.result.current.carregando).toBe(false));
    expect(a.result.current.configuracoes.whatsapp).toBe("5591988887777");
    expect(obterConfiguracoes).toHaveBeenCalledTimes(1);
  });

  it("atualiza todos os componentes quando o admin salva com sucesso", async () => {
    const leitor = renderHook(() => useConfiguracoesComplexo());
    const admin = renderHook(() => useConfiguracoesComplexo());
    await waitFor(() => expect(leitor.result.current.carregando).toBe(false));
    const novas = { ...doBanco, whatsapp: "5591900001111" };
    salvarConfiguracoes.mockResolvedValue({ ok: true, configuracoes: novas });

    await act(async () => {
      await admin.result.current.salvar(novas);
    });

    expect(leitor.result.current.configuracoes.whatsapp).toBe("5591900001111");
  });

  it("mantém os dados atuais quando o salvamento falha", async () => {
    const { result } = renderHook(() => useConfiguracoesComplexo());
    await waitFor(() => expect(result.current.carregando).toBe(false));
    salvarConfiguracoes.mockResolvedValue({ ok: false, mensagem: "Sem permissão" });

    let resposta: unknown;
    await act(async () => {
      resposta = await result.current.salvar({ ...doBanco, whatsapp: "5591900001111" });
    });

    expect(resposta).toEqual({ ok: false, mensagem: "Sem permissão" });
    expect(result.current.configuracoes.whatsapp).toBe("5591988887777");
  });
});
