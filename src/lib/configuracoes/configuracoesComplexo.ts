/**
 * Configurações do complexo editadas pelo admin (contato, endereço e redes sociais).
 * Spec: SPEC/2026-11-27-configuracoes-complexo.md
 */
import { ENDERECO_COMPLEXO, NOME_COMPLEXO, TELEFONE_COMPLEXO } from "@/lib/constants";
import { montarLinkWhatsApp } from "@/lib/landingPage/navegacao";
import { SITE_CONFIG } from "@/lib/landingPage/siteConfig";
import type { ConfiguracaoSite, LinkRedeSocial } from "@/lib/landingPage/types";

export interface ConfiguracoesComplexo {
  nomeComplexo: string;
  descricao: string;
  slogan: string;
  endereco: string;
  /** Telefone para exibição, no formato que o admin preferir. */
  telefone: string;
  /** Só dígitos, com DDI 55 (ex.: "5591988887777"). */
  whatsapp: string;
  email: string;
  instagramUrl: string;
  facebookUrl: string;
  /** Texto livre (ex.: "Seg a Sex 08h-22h · Sáb e Dom 08h-18h"). */
  horarioFuncionamento: string;
}

export type CampoConfiguracao = keyof ConfiguracoesComplexo;
export type ErrosConfiguracoes = Partial<Record<CampoConfiguracao, string>>;

/** Valores usados até o admin editar (os mesmos que o código já exibia). */
export const CONFIGURACOES_PADRAO: ConfiguracoesComplexo = {
  nomeComplexo: NOME_COMPLEXO,
  descricao: SITE_CONFIG.descricaoEstabelecimento,
  slogan: SITE_CONFIG.slogan,
  endereco: ENDERECO_COMPLEXO,
  telefone: TELEFONE_COMPLEXO,
  whatsapp: SITE_CONFIG.whatsappNumero,
  email: "",
  instagramUrl: "https://www.instagram.com/",
  facebookUrl: "https://www.facebook.com/",
  horarioFuncionamento: "Todos os dias, das 08h às 22h",
};

const TAMANHO_MAXIMO: Record<CampoConfiguracao, number> = {
  nomeComplexo: 80,
  descricao: 120,
  slogan: 160,
  endereco: 200,
  telefone: 30,
  whatsapp: 13,
  email: 120,
  instagramUrl: 300,
  facebookUrl: 300,
  horarioFuncionamento: 120,
};

export function normalizarConfiguracoes(dados: ConfiguracoesComplexo): ConfiguracoesComplexo {
  const aparados = Object.fromEntries(
    Object.entries(dados).map(([campo, valor]) => [campo, String(valor ?? "").trim()])
  ) as unknown as ConfiguracoesComplexo;
  return { ...aparados, whatsapp: aparados.whatsapp.replace(/\D/g, "") };
}

/**
 * Valida os dados (já normalizados por dentro) e devolve só os campos inválidos.
 * Objeto vazio significa dados válidos.
 */
export function validarConfiguracoes(dados: ConfiguracoesComplexo): ErrosConfiguracoes {
  const d = normalizarConfiguracoes(dados);
  const erros: ErrosConfiguracoes = {};

  for (const campo of Object.keys(TAMANHO_MAXIMO) as CampoConfiguracao[]) {
    if (campo !== "whatsapp" && d[campo].length > TAMANHO_MAXIMO[campo]) {
      erros[campo] = `Use no máximo ${TAMANHO_MAXIMO[campo]} caracteres.`;
    }
  }

  if (!d.nomeComplexo) erros.nomeComplexo = "O nome do complexo é obrigatório.";

  if (!/^55[0-9]{10,11}$/.test(d.whatsapp)) {
    erros.whatsapp = "Informe o WhatsApp com DDI 55 e DDD (12 ou 13 dígitos, ex.: 55 91 98888-7777).";
  }

  if (d.email && !erros.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) {
    erros.email = "Informe um e-mail válido (ex.: contato@seucomplexo.com.br).";
  }

  for (const campo of ["instagramUrl", "facebookUrl"] as const) {
    if (d[campo] && !erros[campo] && !d[campo].startsWith("https://")) {
      erros[campo] = "O endereço precisa começar com https://.";
    }
  }

  return erros;
}

/** Converte para o formato que o rodapé da landing já recebe (`LandingFooter`). */
export function paraConfiguracaoSite(config: ConfiguracoesComplexo): ConfiguracaoSite {
  const redesSociais: LinkRedeSocial[] = [];
  if (config.instagramUrl) {
    redesSociais.push({ rede: "instagram", rotulo: "Instagram", url: config.instagramUrl });
  }
  if (config.facebookUrl) {
    redesSociais.push({ rede: "facebook", rotulo: "Facebook", url: config.facebookUrl });
  }
  const linkWhatsApp = montarLinkWhatsApp(config.whatsapp);
  if (linkWhatsApp) {
    redesSociais.push({ rede: "whatsapp", rotulo: "WhatsApp", url: linkWhatsApp });
  }

  return {
    nomePlataforma: SITE_CONFIG.nomePlataforma,
    descricaoEstabelecimento: config.descricao,
    slogan: config.slogan,
    whatsappNumero: config.whatsapp,
    redesSociais,
  };
}
