"use client";

/**
 * Campanha de fidelidade exibida na landing (inclusive quando desativada, para a seção sumir).
 * Spec: SPEC/2026-11-27-secao-fidelidade-landing.md
 */
import { useEffect, useState } from "react";
import { obterCampanhaLanding } from "@/lib/supabase/fidelidadeService";
import type { CampanhaFidelidade } from "@/lib/fidelidade/types";

export function useCampanhaFidelidadeLanding() {
  const [campanha, setCampanha] = useState<CampanhaFidelidade | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let montado = true;
    void obterCampanhaLanding().then((resultado) => {
      if (!montado) return;
      setCampanha(resultado);
      setCarregando(false);
    });
    return () => {
      montado = false;
    };
  }, []);

  return { campanha, carregando };
}
