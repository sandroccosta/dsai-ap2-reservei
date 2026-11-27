/**
 * Acesso à tabela `configuracoes_complexo` (uma linha, id "principal").
 * Spec: SPEC/2026-11-27-configuracoes-complexo.md
 *
 * Sem Supabase configurado, lê e grava no `localStorage`. Qualquer falha de
 * leitura devolve os valores padrão, para o site nunca ficar sem contato.
 */
import { supabase, isSupabaseConfigured } from "./client";
import {
  CONFIGURACOES_PADRAO,
  normalizarConfiguracoes,
  validarConfiguracoes,
  type ConfiguracoesComplexo,
  type ErrosConfiguracoes,
} from "@/lib/configuracoes/configuracoesComplexo";

const TABELA = "configuracoes_complexo";
const ID_LINHA = "principal";
const CHAVE_LOCAL = "reservei_configuracoes_complexo";
/** Código do Postgres para recusa de permissão (RLS). */
const ERRO_PERMISSAO = "42501";

export type ResultadoSalvarConfiguracoes =
  | { ok: true; configuracoes: ConfiguracoesComplexo }
  | { ok: false; mensagem: string; erros?: ErrosConfiguracoes };

interface LinhaConfiguracoes {
  nome_complexo: string;
  descricao: string;
  slogan: string;
  endereco: string;
  telefone: string;
  whatsapp: string;
  email: string;
  instagram_url: string;
  facebook_url: string;
  horario_funcionamento: string;
}

function daLinha(linha: LinhaConfiguracoes): ConfiguracoesComplexo {
  return {
    nomeComplexo: linha.nome_complexo,
    descricao: linha.descricao,
    slogan: linha.slogan,
    endereco: linha.endereco,
    telefone: linha.telefone,
    whatsapp: linha.whatsapp,
    email: linha.email,
    instagramUrl: linha.instagram_url,
    facebookUrl: linha.facebook_url,
    horarioFuncionamento: linha.horario_funcionamento,
  };
}

function paraLinha(config: ConfiguracoesComplexo): LinhaConfiguracoes & { id: string; atualizado_em: string } {
  return {
    id: ID_LINHA,
    nome_complexo: config.nomeComplexo,
    descricao: config.descricao,
    slogan: config.slogan,
    endereco: config.endereco,
    telefone: config.telefone,
    whatsapp: config.whatsapp,
    email: config.email,
    instagram_url: config.instagramUrl,
    facebook_url: config.facebookUrl,
    horario_funcionamento: config.horarioFuncionamento,
    atualizado_em: new Date().toISOString(),
  };
}

function lerLocal(): ConfiguracoesComplexo {
  if (typeof window === "undefined") return CONFIGURACOES_PADRAO;
  try {
    const salvo = localStorage.getItem(CHAVE_LOCAL);
    return salvo ? { ...CONFIGURACOES_PADRAO, ...(JSON.parse(salvo) as Partial<ConfiguracoesComplexo>) } : CONFIGURACOES_PADRAO;
  } catch {
    return CONFIGURACOES_PADRAO;
  }
}

export async function obterConfiguracoes(): Promise<ConfiguracoesComplexo> {
  if (!isSupabaseConfigured()) return lerLocal();
  try {
    const { data, error } = await supabase.from(TABELA).select("*").eq("id", ID_LINHA).maybeSingle();
    if (error) {
      console.warn("[Configurações] Leitura falhou; usando os valores padrão.", error);
      return CONFIGURACOES_PADRAO;
    }
    return data ? { ...CONFIGURACOES_PADRAO, ...daLinha(data as LinhaConfiguracoes) } : CONFIGURACOES_PADRAO;
  } catch (erro) {
    console.warn("[Configurações] Leitura falhou; usando os valores padrão.", erro);
    return CONFIGURACOES_PADRAO;
  }
}

/** Normaliza, valida e grava. Dados inválidos não chegam ao banco. */
export async function salvarConfiguracoes(dados: ConfiguracoesComplexo): Promise<ResultadoSalvarConfiguracoes> {
  const configuracoes = normalizarConfiguracoes(dados);
  const erros = validarConfiguracoes(configuracoes);
  if (Object.keys(erros).length > 0) {
    return { ok: false, mensagem: "Corrija os campos destacados.", erros };
  }

  if (!isSupabaseConfigured()) {
    try {
      localStorage.setItem(CHAVE_LOCAL, JSON.stringify(configuracoes));
      return { ok: true, configuracoes };
    } catch {
      return { ok: false, mensagem: "Não foi possível salvar neste navegador." };
    }
  }

  try {
    const { error } = await supabase.from(TABELA).upsert(paraLinha(configuracoes));
    if (!error) return { ok: true, configuracoes };
    console.error("[Configurações] Gravação recusada:", error);
    return {
      ok: false,
      mensagem:
        error.code === ERRO_PERMISSAO
          ? "Sem permissão para salvar. Entre novamente no painel."
          : "Não foi possível salvar as configurações. Tente novamente.",
    };
  } catch (erro) {
    console.error("[Configurações] Falha ao gravar:", erro);
    return { ok: false, mensagem: "Não foi possível salvar as configurações. Tente novamente." };
  }
}
