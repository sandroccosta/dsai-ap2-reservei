"use client";

/**
 * Tela "Configurações" do painel: dados do complexo exibidos no site.
 * Spec: SPEC/2026-11-27-configuracoes-complexo.md
 */
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Loader2, Save, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useConfiguracoesComplexo } from "@/hooks/useConfiguracoesComplexo";
import {
  validarConfiguracoes,
  type CampoConfiguracao,
  type ConfiguracoesComplexo,
  type ErrosConfiguracoes,
} from "@/lib/configuracoes/configuracoesComplexo";

interface DefinicaoCampo {
  campo: CampoConfiguracao;
  rotulo: string;
  placeholder: string;
  ajuda?: string;
  tipo?: "text" | "email" | "url" | "tel";
}

const GRUPOS: { titulo: string; campos: DefinicaoCampo[] }[] = [
  {
    titulo: "Identificação",
    campos: [
      { campo: "nomeComplexo", rotulo: "Nome do complexo", placeholder: "Complexo Esportivo Reservei" },
      { campo: "descricao", rotulo: "Descrição curta", placeholder: "Complexo Esportivo" },
      { campo: "slogan", rotulo: "Slogan do rodapé", placeholder: "Reserve sua quadra em segundos." },
    ],
  },
  {
    titulo: "Contato e localização",
    campos: [
      {
        campo: "whatsapp", rotulo: "WhatsApp", placeholder: "55 91 98888-7777", tipo: "tel",
        ajuda: "Com DDI 55 e DDD. É o número usado em todos os botões de WhatsApp do site.",
      },
      { campo: "telefone", rotulo: "Telefone para exibição", placeholder: "(91) 3333-4444", tipo: "tel" },
      { campo: "email", rotulo: "E-mail", placeholder: "contato@seucomplexo.com.br", tipo: "email" },
      { campo: "endereco", rotulo: "Endereço", placeholder: "Av. Nazaré, 100 – Belém/PA" },
      {
        campo: "horarioFuncionamento", rotulo: "Horário de funcionamento",
        placeholder: "Seg a Sex 08h-22h · Sáb e Dom 08h-18h",
      },
    ],
  },
  {
    titulo: "Redes sociais",
    campos: [
      { campo: "instagramUrl", rotulo: "Instagram", placeholder: "https://www.instagram.com/seucomplexo", tipo: "url" },
      { campo: "facebookUrl", rotulo: "Facebook", placeholder: "https://www.facebook.com/seucomplexo", tipo: "url" },
    ],
  },
];

function FormularioConfiguracoes({
  inicial,
  salvar,
}: {
  inicial: ConfiguracoesComplexo;
  salvar: ReturnType<typeof useConfiguracoesComplexo>["salvar"];
}) {
  const [dados, setDados] = useState(inicial);
  const [erros, setErros] = useState<ErrosConfiguracoes>({});
  const [salvando, setSalvando] = useState(false);

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    const errosValidacao = validarConfiguracoes(dados);
    setErros(errosValidacao);
    if (Object.keys(errosValidacao).length > 0) {
      toast.error("Corrija os campos destacados antes de salvar.");
      return;
    }

    setSalvando(true);
    try {
      const resultado = await salvar(dados);
      if (resultado.ok) {
        setDados(resultado.configuracoes);
        toast.success("Configurações salvas. O site já usa os novos dados.");
      } else {
        setErros(resultado.erros ?? {});
        toast.error(resultado.mensagem);
      }
    } finally {
      setSalvando(false);
    }
  }

  return (
    <form onSubmit={enviar} noValidate className="space-y-6">
      {GRUPOS.map((grupo) => (
        <fieldset key={grupo.titulo} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <legend className="text-sm font-semibold text-white px-1">{grupo.titulo}</legend>
          <div className="grid gap-4 md:grid-cols-2">
            {grupo.campos.map(({ campo, rotulo, placeholder, ajuda, tipo = "text" }) => {
              const idCampo = `config-${campo}`;
              const erro = erros[campo];
              return (
                <div key={campo} className="space-y-1.5">
                  <Label htmlFor={idCampo} className="text-slate-300">{rotulo}</Label>
                  <Input
                    id={idCampo}
                    type={tipo}
                    value={dados[campo]}
                    placeholder={placeholder}
                    aria-invalid={erro ? "true" : undefined}
                    aria-describedby={erro || ajuda ? `${idCampo}-info` : undefined}
                    onChange={(e) => setDados((atual) => ({ ...atual, [campo]: e.target.value }))}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                  {(erro || ajuda) && (
                    <p id={`${idCampo}-info`} className={`text-xs ${erro ? "text-red-400" : "text-slate-500"}`}>
                      {erro ?? ajuda}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </fieldset>
      ))}

      <div className="flex justify-end">
        <Button type="submit" disabled={salvando} className="bg-emerald-600 hover:bg-emerald-700 font-semibold">
          {salvando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {salvando ? "Salvando..." : "Salvar configurações"}
        </Button>
      </div>
    </form>
  );
}

export function AdminConfiguracoesPage() {
  const { configuracoes, carregando, salvar } = useConfiguracoesComplexo();

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
          <Settings className="w-6 h-6 text-emerald-400" />
          Configurações do complexo
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Nome, contato, endereço e redes sociais exibidos no site, no rodapé e nos botões de WhatsApp.
        </p>
      </div>

      {carregando ? (
        <p className="text-sm text-slate-400 flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Carregando configurações...
        </p>
      ) : (
        <FormularioConfiguracoes inicial={configuracoes} salvar={salvar} />
      )}
    </div>
  );
}
