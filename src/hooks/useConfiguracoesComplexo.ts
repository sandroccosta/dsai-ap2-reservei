"use client";

/**
 * Configurações do complexo compartilhadas por todo o site.
 * Spec: SPEC/2026-11-27-configuracoes-complexo.md
 *
 * Carrega uma vez por sessão do navegador (store Zustand): vários componentes
 * podem usar o hook sem repetir a consulta ao banco.
 */
import { useCallback, useEffect } from "react";
import { create } from "zustand";
import {
  CONFIGURACOES_PADRAO,
  type ConfiguracoesComplexo,
} from "@/lib/configuracoes/configuracoesComplexo";
import {
  obterConfiguracoes,
  salvarConfiguracoes,
  type ResultadoSalvarConfiguracoes,
} from "@/lib/supabase/configuracoesRepository";

interface EstadoConfiguracoes {
  configuracoes: ConfiguracoesComplexo;
  carregado: boolean;
}

const useConfiguracoesStore = create<EstadoConfiguracoes>(() => ({
  configuracoes: CONFIGURACOES_PADRAO,
  carregado: false,
}));

let carregamento: Promise<void> | null = null;

function carregarUmaVez(): Promise<void> {
  carregamento ??= obterConfiguracoes().then((configuracoes) => {
    useConfiguracoesStore.setState({ configuracoes, carregado: true });
  });
  return carregamento;
}

/** Volta ao estado inicial (usado pelos testes). */
export function redefinirConfiguracoesComplexo(): void {
  carregamento = null;
  useConfiguracoesStore.setState({ configuracoes: CONFIGURACOES_PADRAO, carregado: false });
}

/**
 * @example
 * const { configuracoes } = useConfiguracoesComplexo();
 * montarLinkWhatsApp(configuracoes.whatsapp, "Olá!");
 */
export function useConfiguracoesComplexo() {
  const configuracoes = useConfiguracoesStore((s) => s.configuracoes);
  const carregado = useConfiguracoesStore((s) => s.carregado);

  useEffect(() => {
    void carregarUmaVez();
  }, []);

  /** Grava e, só se o banco aceitar, atualiza todos os componentes. */
  const salvar = useCallback(async (dados: ConfiguracoesComplexo): Promise<ResultadoSalvarConfiguracoes> => {
    const resultado = await salvarConfiguracoes(dados);
    if (resultado.ok) {
      useConfiguracoesStore.setState({ configuracoes: resultado.configuracoes, carregado: true });
    }
    return resultado;
  }, []);

  return { configuracoes, carregando: !carregado, salvar };
}
