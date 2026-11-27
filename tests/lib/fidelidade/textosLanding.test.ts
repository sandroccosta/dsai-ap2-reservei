/**
 * Textos da seção Fidelidade montados a partir da campanha.
 * Spec: SPEC/2026-11-27-secao-fidelidade-landing.md
 */
import { describe, expect, it } from "vitest";
import { campanhaExibivel, montarPassosFidelidade } from "@/lib/fidelidade/textosLanding";
import { CAMPANHA_PADRAO } from "@/lib/fidelidade/fidelidadeService";

const campanha = { ...CAMPANHA_PADRAO, horasNecessarias: 10, mesesValidade: 4, diasValidadeVoucher: 30 };

describe("montarPassosFidelidade", () => {
  it("monta os três passos com os números da campanha", () => {
    expect(montarPassosFidelidade(campanha)).toEqual([
      { titulo: "Jogue", texto: "Cada hora de quadra concluída vira 1 selo na sua cartela." },
      { titulo: "Junte 10 horas", texto: "Complete 10 horas em até 4 meses." },
      { titulo: "Ganhe um voucher", texto: "Use o voucher em uma nova reserva em até 30 dias." },
    ]);
  });

  it("usa o singular quando o número é 1", () => {
    const [, junte, ganhe] = montarPassosFidelidade({
      ...campanha,
      horasNecessarias: 1,
      mesesValidade: 1,
      diasValidadeVoucher: 1,
    });
    expect(junte).toEqual({ titulo: "Junte 1 hora", texto: "Complete 1 hora em até 1 mês." });
    expect(ganhe.texto).toBe("Use o voucher em uma nova reserva em até 1 dia.");
  });
});

describe("campanhaExibivel", () => {
  it("aceita campanha ativa com números inteiros positivos", () => {
    expect(campanhaExibivel(campanha)).toBe(true);
  });

  it("recusa campanha ausente ou inativa", () => {
    expect(campanhaExibivel(null)).toBe(false);
    expect(campanhaExibivel({ ...campanha, ativo: false })).toBe(false);
  });

  it.each([
    ["horasNecessarias", 0],
    ["mesesValidade", -1],
    ["diasValidadeVoucher", 1.5],
    ["horasNecessarias", Number.NaN],
  ])("recusa %s = %s", (campo, valor) => {
    expect(campanhaExibivel({ ...campanha, [campo]: valor })).toBe(false);
  });
});
