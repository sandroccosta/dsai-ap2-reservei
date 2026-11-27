/**
 * Seção "Termos, Regras e Perguntas Frequentes" da landing.
 * Spec: SPEC/2026-11-27-faq-gerenciado-admin.md
 *
 * Sanfona com <details>/<summary> nativos. Pergunta e resposta são texto puro,
 * nunca HTML: o React escapa o conteúdo.
 */

"use client";

import { ChevronDown } from "lucide-react";
import { useFaqService } from "@/hooks/useFaqService";
import { SECAO_IDS } from "@/lib/landingPage/secoes";
import { getSecaoPorId } from "@/lib/landingPage/navegacao";
import { SecaoLanding } from "./SecaoLanding";

export function SecaoFaq() {
  const secao = getSecaoPorId(SECAO_IDS.FAQ);
  const { ativos } = useFaqService("landing");
  if (!secao || ativos.length === 0) return null;

  return (
    <SecaoLanding secao={secao} destaque>
      <div className="flex max-w-3xl flex-col gap-3">
        {ativos.map((item) => (
          <details
            key={item.id}
            className="group rounded-2xl border border-slate-800 bg-slate-900/60 open:border-emerald-500/40"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-4 text-sm font-semibold text-white md:text-base [&::-webkit-details-marker]:hidden">
              {item.pergunta}
              <ChevronDown
                className="h-4 w-4 shrink-0 text-emerald-400 transition-transform group-open:rotate-180"
                aria-hidden="true"
              />
            </summary>
            <p className="whitespace-pre-line px-4 pb-4 text-sm text-slate-300">{item.resposta}</p>
          </details>
        ))}
      </div>
    </SecaoLanding>
  );
}
