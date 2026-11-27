/**
 * Acesso à tabela `faq_itens`. A RLS deixa o visitante ler só as ativas e só o
 * admin gravar. Sem Supabase configurado, lê e grava no `localStorage`.
 * Spec: SPEC/2026-11-27-faq-gerenciado-admin.md
 */
import { supabase, isSupabaseConfigured } from "./client";
import { FAQ_PADRAO } from "@/lib/faq/faqPadrao";
import { ordenarItensFaq, validarItemFaq } from "@/lib/faq/regrasFaq";
import type { CategoriaFaq, DadosItemFaq, ErrosItemFaq, ItemFaq } from "@/lib/faq/types";

const TABELA = "faq_itens";
const CHAVE_LOCAL = "reservei_faq_itens";
/** Código do Postgres para recusa de permissão (RLS). */
const ERRO_PERMISSAO = "42501";
const MENSAGEM_PERMISSAO = "Sem permissão para alterar as perguntas. Entre novamente no painel.";

export type ResultadoFaq<T = undefined> =
  | { ok: true; dado: T }
  | { ok: false; mensagem: string; erros?: ErrosItemFaq };

/** O que o admin envia: os campos do formulário, a posição e o estado; `id` ausente cria um item. */
export type ItemFaqParaSalvar = DadosItemFaq & Pick<ItemFaq, "ordem" | "ativo"> & Partial<Pick<ItemFaq, "id" | "criadoEm">>;

interface LinhaFaq {
  id: string;
  pergunta: string;
  resposta: string;
  categoria: CategoriaFaq;
  ordem: number;
  ativo: boolean;
  criado_em?: string;
}

function daLinha(linha: LinhaFaq): ItemFaq {
  return {
    id: linha.id,
    pergunta: linha.pergunta,
    resposta: linha.resposta,
    categoria: linha.categoria,
    ordem: Number(linha.ordem) || 0,
    ativo: linha.ativo,
    criadoEm: linha.criado_em ?? "",
  };
}

function paraLinha(item: ItemFaq): LinhaFaq {
  return {
    id: item.id,
    pergunta: item.pergunta,
    resposta: item.resposta,
    categoria: item.categoria,
    ordem: item.ordem,
    ativo: item.ativo,
    ...(item.criadoEm ? { criado_em: item.criadoEm } : {}),
  };
}

function falhaGravacao(contexto: string, erro: unknown): ResultadoFaq<never> {
  console.error(`[FAQ] ${contexto}:`, erro);
  const codigo = (erro as { code?: string } | null)?.code;
  return {
    ok: false,
    mensagem: codigo === ERRO_PERMISSAO ? MENSAGEM_PERMISSAO : "Não foi possível salvar as perguntas. Tente novamente.",
  };
}

function lerLocal(): ItemFaq[] {
  try {
    const salvo = localStorage.getItem(CHAVE_LOCAL);
    return salvo ? (JSON.parse(salvo) as ItemFaq[]) : [...FAQ_PADRAO];
  } catch {
    return [...FAQ_PADRAO];
  }
}

function gravarLocal(itens: ItemFaq[]): ResultadoFaq {
  try {
    localStorage.setItem(CHAVE_LOCAL, JSON.stringify(itens));
    return { ok: true, dado: undefined };
  } catch {
    return { ok: false, mensagem: "Não foi possível salvar neste navegador." };
  }
}

export async function listarItensFaq(): Promise<ResultadoFaq<ItemFaq[]>> {
  if (!isSupabaseConfigured()) return { ok: true, dado: ordenarItensFaq(lerLocal()) };
  try {
    const { data, error } = await supabase.from(TABELA).select("*").order("ordem", { ascending: true });
    if (error) throw error;
    return { ok: true, dado: ordenarItensFaq(((data ?? []) as LinhaFaq[]).map(daLinha)) };
  } catch (erro) {
    console.warn("[FAQ] Leitura falhou:", erro);
    return { ok: false, mensagem: "Não foi possível carregar as perguntas frequentes." };
  }
}

/** Apara os textos, valida e grava (cria quando não há `id`). Dados inválidos não chegam ao banco. */
export async function salvarItemFaq(entrada: ItemFaqParaSalvar): Promise<ResultadoFaq<ItemFaq>> {
  const item: ItemFaq = {
    ...entrada,
    id: entrada.id ?? crypto.randomUUID(),
    pergunta: entrada.pergunta.trim(),
    resposta: entrada.resposta.trim(),
    criadoEm: entrada.criadoEm ?? new Date().toISOString(),
  };
  const erros = validarItemFaq(item);
  if (Object.keys(erros).length > 0) return { ok: false, mensagem: "Corrija os campos destacados.", erros };

  if (!isSupabaseConfigured()) {
    const resultado = gravarLocal([...lerLocal().filter((i) => i.id !== item.id), item]);
    return resultado.ok ? { ok: true, dado: item } : resultado;
  }

  try {
    const { data, error } = await supabase.from(TABELA).upsert(paraLinha(item)).select();
    if (error) return falhaGravacao("Gravação recusada", error);
    const gravado = (data as LinhaFaq[] | null)?.[0];
    return { ok: true, dado: gravado ? daLinha(gravado) : item };
  } catch (erro) {
    return falhaGravacao("Falha ao gravar", erro);
  }
}

export async function excluirItemFaq(id: string): Promise<ResultadoFaq> {
  if (!isSupabaseConfigured()) return gravarLocal(lerLocal().filter((i) => i.id !== id));
  try {
    const { data, error } = await supabase.from(TABELA).delete().eq("id", id).select("id");
    if (error) return falhaGravacao("Exclusão recusada", error);
    // A RLS não gera erro ao filtrar a exclusão: nenhuma linha afetada é falta de permissão.
    if (!data || (data as unknown[]).length === 0) return { ok: false, mensagem: MENSAGEM_PERMISSAO };
    return { ok: true, dado: undefined };
  } catch (erro) {
    return falhaGravacao("Falha ao excluir", erro);
  }
}

/** Grava a ordem de todos os itens num único `upsert`. */
export async function salvarOrdemFaq(itens: ItemFaq[]): Promise<ResultadoFaq> {
  if (!isSupabaseConfigured()) return gravarLocal(itens);
  try {
    const { error } = await supabase.from(TABELA).upsert(itens.map(paraLinha)).select();
    return error ? falhaGravacao("Ordem recusada", error) : { ok: true, dado: undefined };
  } catch (erro) {
    return falhaGravacao("Falha ao salvar a ordem", erro);
  }
}
