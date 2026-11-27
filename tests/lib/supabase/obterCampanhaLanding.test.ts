/**
 * Leitura da campanha para a landing, sem filtrar por ativo.
 * Spec: SPEC/2026-11-27-secao-fidelidade-landing.md
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CAMPANHA_PADRAO } from "@/lib/fidelidade/fidelidadeService";

const estado = { configurado: true, leitura: { data: null as unknown, error: null as unknown } };
const eq = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: (...args: unknown[]) => {
          eq(...args);
          return { limit: () => ({ maybeSingle: () => Promise.resolve({ data: null, error: null }) }) };
        },
        order: () => ({ limit: () => ({ maybeSingle: () => Promise.resolve(estado.leitura) }) }),
      }),
    }),
  },
  isSupabaseConfigured: () => estado.configurado,
}));

import { obterCampanhaLanding } from "@/lib/supabase/fidelidadeService";

describe("obterCampanhaLanding", () => {
  beforeEach(() => {
    estado.configurado = true;
    estado.leitura = { data: null, error: null };
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("campanha desativada no banco volta com ativo false, sem cair no padrão", async () => {
    estado.leitura = {
      data: { id: "campanha_padrao", nome: "Fidelidade", horas_necessarias: 8, meses_validade: 2, dias_validade_voucher: 45, ativo: false },
      error: null,
    };
    const campanha = await obterCampanhaLanding();
    expect(campanha).toMatchObject({ ativo: false, horasNecessarias: 8, mesesValidade: 2, diasValidadeVoucher: 45 });
    expect(eq).not.toHaveBeenCalled();
  });

  it("tabela vazia devolve null", async () => {
    await expect(obterCampanhaLanding()).resolves.toBeNull();
  });

  it("erro do banco devolve a campanha local (padrão)", async () => {
    estado.leitura = { data: null, error: { message: "offline" } };
    await expect(obterCampanhaLanding()).resolves.toEqual(CAMPANHA_PADRAO);
  });

  it("sem Supabase usa a campanha local", async () => {
    estado.configurado = false;
    await expect(obterCampanhaLanding()).resolves.toEqual(CAMPANHA_PADRAO);
  });
});
