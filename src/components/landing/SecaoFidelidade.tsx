/**
 * Seção "Programa de Fidelidade" da landing: como funciona, com os números da campanha.
 * Spec: SPEC/2026-11-27-secao-fidelidade-landing.md
 */

"use client";

import Link from "next/link";
import { Gift, Stamp, Ticket, Trophy } from "lucide-react";
import { useCampanhaFidelidadeLanding } from "@/hooks/useCampanhaFidelidadeLanding";
import { useUserAuth } from "@/hooks/useUserAuth";
import { campanhaExibivel, montarPassosFidelidade } from "@/lib/fidelidade/textosLanding";
import { SECAO_IDS } from "@/lib/landingPage/secoes";
import { getSecaoPorId } from "@/lib/landingPage/navegacao";
import { SecaoLanding } from "./SecaoLanding";

const ICONES_PASSOS = [Trophy, Stamp, Ticket];
const CLASSE_BOTAO =
  "inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-bold text-slate-950 transition-colors hover:bg-emerald-400";

export function SecaoFidelidade() {
  const secao = getSecaoPorId(SECAO_IDS.FIDELIDADE);
  const { campanha } = useCampanhaFidelidadeLanding();
  const { isAutenticado, hasHydrated } = useUserAuth();
  if (!secao || !campanhaExibivel(campanha)) return null;

  return (
    <SecaoLanding secao={secao} destaque>
      <ol className="grid gap-4 md:grid-cols-3">
        {montarPassosFidelidade(campanha).map((passo, indice) => {
          const Icone = ICONES_PASSOS[indice];
          return (
            <li key={passo.titulo} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/10 text-sm font-black text-emerald-400">
                  {indice + 1}
                </span>
                <Icone className="h-5 w-5 text-emerald-400" aria-hidden="true" />
              </div>
              <h3 className="mt-4 text-lg font-bold text-white">{passo.titulo}</h3>
              <p className="mt-1 text-sm text-slate-300">{passo.texto}</p>
            </li>
          );
        })}
      </ol>

      {hasHydrated && (
        <div className="mt-8">
          {isAutenticado ? (
            <Link href="/minha-conta" className={CLASSE_BOTAO}>
              <Gift className="h-4 w-4" aria-hidden="true" /> Ver minha cartela
            </Link>
          ) : (
            <Link href="/cadastro" className={CLASSE_BOTAO}>
              <Gift className="h-4 w-4" aria-hidden="true" /> Criar conta
            </Link>
          )}
        </div>
      )}
    </SecaoLanding>
  );
}
