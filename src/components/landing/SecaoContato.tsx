/**
 * Seção "Localização e Contato" da landing, com dados das configurações do complexo.
 * Spec: SPEC/2026-11-27-secao-contato-landing.md
 */

"use client";

import type { ComponentType, ReactNode } from "react";
import { Clock, Mail, MapPin, MessageCircle, Navigation, Phone } from "lucide-react";
import { useConfiguracoesComplexo } from "@/hooks/useConfiguracoesComplexo";
import { SECAO_IDS } from "@/lib/landingPage/secoes";
import { getSecaoPorId, montarLinkWhatsApp } from "@/lib/landingPage/navegacao";
import {
  montarLinkTelefone,
  montarUrlComoChegar,
  montarUrlMapaIncorporado,
} from "@/lib/landingPage/contato";
import { SecaoLanding } from "./SecaoLanding";

const CLASSE_BOTAO =
  "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-colors";

export function SecaoContato() {
  const secao = getSecaoPorId(SECAO_IDS.CONTATO);
  const { configuracoes } = useConfiguracoesComplexo();
  if (!secao) return null;

  const { endereco, horarioFuncionamento, telefone, email, whatsapp, nomeComplexo } = configuracoes;
  const urlMapa = montarUrlMapaIncorporado(endereco);
  const urlComoChegar = montarUrlComoChegar(endereco);
  const linkTelefone = montarLinkTelefone(telefone);
  const linkWhatsApp = montarLinkWhatsApp(whatsapp, `Olá! Vim pelo site do ${nomeComplexo} e gostaria de informações.`);
  const emailLimpo = email.trim();

  return (
    <SecaoLanding secao={secao}>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-6">
          <dl className="grid gap-4">
            {endereco.trim() && <Info icone={MapPin} rotulo="Endereço">{endereco}</Info>}
            {horarioFuncionamento.trim() && (
              <Info icone={Clock} rotulo="Horário de funcionamento">{horarioFuncionamento}</Info>
            )}
            {linkTelefone && (
              <Info icone={Phone} rotulo="Telefone">
                <a href={linkTelefone} className="hover:text-emerald-400">{telefone}</a>
              </Info>
            )}
            {emailLimpo && (
              <Info icone={Mail} rotulo="E-mail">
                <a href={`mailto:${emailLimpo}`} className="hover:text-emerald-400">{emailLimpo}</a>
              </Info>
            )}
          </dl>

          <div className="flex flex-wrap gap-3">
            {linkWhatsApp && (
              <a
                href={linkWhatsApp}
                target="_blank"
                rel="noopener noreferrer"
                className={`${CLASSE_BOTAO} bg-emerald-500 text-slate-950 hover:bg-emerald-400`}
              >
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
                Chamar no WhatsApp
              </a>
            )}
            {urlComoChegar && (
              <a
                href={urlComoChegar}
                target="_blank"
                rel="noopener noreferrer"
                className={`${CLASSE_BOTAO} border border-slate-700 text-slate-200 hover:border-emerald-500`}
              >
                <Navigation className="h-4 w-4" aria-hidden="true" />
                Como chegar
              </a>
            )}
          </div>
        </div>

        {urlMapa && (
          <iframe
            src={urlMapa}
            title="Mapa de localização do complexo"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="h-72 w-full rounded-2xl border border-slate-800 lg:h-full lg:min-h-72"
          />
        )}
      </div>
    </SecaoLanding>
  );
}

function Info({
  icone: Icone,
  rotulo,
  children,
}: {
  icone: ComponentType<{ className?: string }>;
  rotulo: string;
  children: ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <Icone className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" aria-hidden="true" />
      <div>
        <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">{rotulo}</dt>
        <dd className="text-sm text-slate-200">{children}</dd>
      </div>
    </div>
  );
}
