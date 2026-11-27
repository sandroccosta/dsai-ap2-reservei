"use client";

/**
 * Perguntas frequentes para a landing e para o painel admin.
 * Spec: SPEC/2026-11-27-faq-gerenciado-admin.md
 *
 * Na landing, falha de leitura mostra as perguntas padrão (o visitante nunca vê
 * erro). No admin, a falha aparece e a lista fica vazia, para ninguém editar
 * dados de demonstração achando que são os reais.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { FAQ_PADRAO } from "@/lib/faq/faqPadrao";
import { filtrarAtivos, moverItem, ordenarItensFaq } from "@/lib/faq/regrasFaq";
import type { DirecaoMovimento, ItemFaq } from "@/lib/faq/types";
import {
  excluirItemFaq,
  listarItensFaq,
  salvarItemFaq,
  salvarOrdemFaq,
  type ItemFaqParaSalvar,
  type ResultadoFaq,
} from "@/lib/supabase/faqRepository";

const OK: ResultadoFaq = { ok: true, dado: undefined };

export function useFaqService(modo: "landing" | "admin") {
  const [itens, setItens] = useState<ItemFaq[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;
    void listarItensFaq().then((resultado) => {
      if (!ativo) return;
      if (resultado.ok) setItens(resultado.dado);
      else if (modo === "landing") setItens([...FAQ_PADRAO]);
      else setErro(resultado.mensagem);
      setCarregando(false);
    });
    return () => {
      ativo = false;
    };
  }, [modo]);

  const ativos = useMemo(() => filtrarAtivos(itens), [itens]);

  const salvar = useCallback(async (entrada: ItemFaqParaSalvar): Promise<ResultadoFaq<ItemFaq>> => {
    const resultado = await salvarItemFaq(entrada);
    if (resultado.ok) {
      const salvo = resultado.dado;
      setItens((atual) => ordenarItensFaq([...atual.filter((i) => i.id !== salvo.id), salvo]));
    }
    return resultado;
  }, []);

  const alternarAtivo = useCallback(
    async (id: string): Promise<ResultadoFaq<ItemFaq> | null> => {
      const item = itens.find((i) => i.id === id);
      return item ? salvar({ ...item, ativo: !item.ativo }) : null;
    },
    [itens, salvar]
  );

  const excluir = useCallback(async (id: string): Promise<ResultadoFaq> => {
    const resultado = await excluirItemFaq(id);
    if (resultado.ok) setItens((atual) => atual.filter((i) => i.id !== id));
    return resultado;
  }, []);

  /** Mostra a nova ordem na hora; se o banco recusar, volta à anterior. */
  const mover = useCallback(
    async (id: string, direcao: DirecaoMovimento): Promise<ResultadoFaq> => {
      const anterior = itens;
      const nova = moverItem(anterior, id, direcao);
      const mudou = nova.some((item, i) => item.id !== ordenarItensFaq(anterior)[i]?.id);
      if (!mudou) return OK;
      setItens(nova);
      const resultado = await salvarOrdemFaq(nova);
      if (!resultado.ok) setItens(anterior);
      return resultado;
    },
    [itens]
  );

  return { itens, ativos, carregando, erro, salvar, alternarAtivo, excluir, mover };
}
