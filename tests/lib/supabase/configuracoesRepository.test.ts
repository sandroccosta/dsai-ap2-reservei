/**
 * Repositório das configurações do complexo, com o cliente Supabase simulado.
 * Spec: SPEC/2026-11-27-configuracoes-complexo.md
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CONFIGURACOES_PADRAO, type ConfiguracoesComplexo } from "@/lib/configuracoes/configuracoesComplexo";

const estado = {
  configurado: true,
  leitura: { data: null as unknown, error: null as unknown },
  gravacao: { error: null as unknown },
};
const upsert = vi.fn(() => Promise.resolve(estado.gravacao));
const from = vi.fn(() => ({
  select: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve(estado.leitura) }) }),
  upsert,
}));

vi.mock("@/lib/supabase/client", () => ({
  supabase: { from: (tabela: string) => from(tabela) },
  isSupabaseConfigured: () => estado.configurado,
}));

import { obterConfiguracoes, salvarConfiguracoes } from "@/lib/supabase/configuracoesRepository";

const linhaBanco = {
  id: "principal",
  nome_complexo: "Arena Belém",
  descricao: "Quadras cobertas",
  slogan: "Jogue mais",
  endereco: "Av. Nazaré, 10 – Belém",
  telefone: "(91) 3333-4444",
  whatsapp: "5591988887777",
  email: "contato@arena.com.br",
  instagram_url: "https://www.instagram.com/arena",
  facebook_url: "",
  horario_funcionamento: "Seg a Sex 08h-22h",
  atualizado_em: "2026-11-27T10:00:00Z",
};

const novas: ConfiguracoesComplexo = { ...CONFIGURACOES_PADRAO, nomeComplexo: "Arena Belém", whatsapp: "5591988887777" };

describe("configuracoesRepository", () => {
  beforeEach(() => {
    estado.configurado = true;
    estado.leitura = { data: null, error: null };
    estado.gravacao = { error: null };
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe("obterConfiguracoes", () => {
    it("converte a linha do banco para o formato do app", async () => {
      estado.leitura = { data: linhaBanco, error: null };
      await expect(obterConfiguracoes()).resolves.toEqual({
        nomeComplexo: "Arena Belém",
        descricao: "Quadras cobertas",
        slogan: "Jogue mais",
        endereco: "Av. Nazaré, 10 – Belém",
        telefone: "(91) 3333-4444",
        whatsapp: "5591988887777",
        email: "contato@arena.com.br",
        instagramUrl: "https://www.instagram.com/arena",
        facebookUrl: "",
        horarioFuncionamento: "Seg a Sex 08h-22h",
      });
      expect(from).toHaveBeenCalledWith("configuracoes_complexo");
    });

    it("devolve o padrão quando o Supabase falha (ex.: tabela ainda não criada)", async () => {
      estado.leitura = { data: null, error: { code: "42P01", message: "relation does not exist" } };
      await expect(obterConfiguracoes()).resolves.toEqual(CONFIGURACOES_PADRAO);
    });

    it("devolve o padrão quando a linha não existe", async () => {
      await expect(obterConfiguracoes()).resolves.toEqual(CONFIGURACOES_PADRAO);
    });

    it("sem Supabase, usa o que foi salvo no navegador ou o padrão se estiver corrompido", async () => {
      estado.configurado = false;
      localStorage.setItem("reservei_configuracoes_complexo", JSON.stringify({ nomeComplexo: "Local" }));
      await expect(obterConfiguracoes()).resolves.toMatchObject({ nomeComplexo: "Local", endereco: CONFIGURACOES_PADRAO.endereco });

      localStorage.setItem("reservei_configuracoes_complexo", "{quebrado");
      await expect(obterConfiguracoes()).resolves.toEqual(CONFIGURACOES_PADRAO);
      expect(from).not.toHaveBeenCalled();
    });
  });

  describe("salvarConfiguracoes", () => {
    it("normaliza e grava a linha principal", async () => {
      const r = await salvarConfiguracoes({ ...novas, nomeComplexo: "  Arena Belém ", whatsapp: "+55 91 98888-7777" });

      expect(r).toEqual({ ok: true, configuracoes: novas });
      expect(upsert).toHaveBeenCalledWith(
        expect.objectContaining({ id: "principal", nome_complexo: "Arena Belém", whatsapp: "5591988887777" })
      );
    });

    it("não chama o banco quando os dados são inválidos", async () => {
      const r = await salvarConfiguracoes({ ...novas, whatsapp: "91988887777" });

      expect(r.ok).toBe(false);
      expect(r.ok === false && r.erros?.whatsapp).toBeTruthy();
      expect(upsert).not.toHaveBeenCalled();
    });

    it("explica a recusa por permissão (admin sem sessão)", async () => {
      estado.gravacao = { error: { code: "42501", message: "new row violates row-level security policy" } };
      const r = await salvarConfiguracoes(novas);

      expect(r).toEqual({ ok: false, mensagem: "Sem permissão para salvar. Entre novamente no painel." });
    });

    it("dá uma mensagem genérica para outras falhas do banco", async () => {
      estado.gravacao = { error: { code: "08006", message: "connection failure" } };
      const r = await salvarConfiguracoes(novas);

      expect(r.ok === false && r.mensagem).toMatch(/Não foi possível salvar/);
    });

    it("sem Supabase, grava no navegador", async () => {
      estado.configurado = false;
      await salvarConfiguracoes(novas);

      expect(JSON.parse(localStorage.getItem("reservei_configuracoes_complexo") ?? "{}")).toEqual(novas);
      expect(upsert).not.toHaveBeenCalled();
    });
  });
});
