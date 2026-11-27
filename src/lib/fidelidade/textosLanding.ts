/**
 * Textos da seção Fidelidade da landing, montados a partir da campanha.
 * Spec: SPEC/2026-11-27-secao-fidelidade-landing.md
 */
import type { CampanhaFidelidade } from "./types";

export interface PassoFidelidade {
  titulo: string;
  texto: string;
}

function quantidade(n: number, singular: string, plural: string): string {
  return `${n} ${n === 1 ? singular : plural}`;
}

const inteiroPositivo = (n: number) => Number.isInteger(n) && n > 0;

/** Só campanha ativa e com números válidos aparece (nunca "junte 0 horas"). */
export function campanhaExibivel(campanha: CampanhaFidelidade | null): campanha is CampanhaFidelidade {
  return (
    !!campanha &&
    campanha.ativo &&
    inteiroPositivo(campanha.horasNecessarias) &&
    inteiroPositivo(campanha.mesesValidade) &&
    inteiroPositivo(campanha.diasValidadeVoucher)
  );
}

export function montarPassosFidelidade(campanha: CampanhaFidelidade): PassoFidelidade[] {
  const horas = quantidade(campanha.horasNecessarias, "hora", "horas");
  return [
    { titulo: "Jogue", texto: "Cada hora de quadra concluída vira 1 selo na sua cartela." },
    {
      titulo: `Junte ${horas}`,
      texto: `Complete ${horas} em até ${quantidade(campanha.mesesValidade, "mês", "meses")}.`,
    },
    {
      titulo: "Ganhe um voucher",
      texto: `Use o voucher em uma nova reserva em até ${quantidade(campanha.diasValidadeVoucher, "dia", "dias")}.`,
    },
  ];
}
