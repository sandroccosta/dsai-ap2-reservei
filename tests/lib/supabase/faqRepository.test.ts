/**
 * Repositório do FAQ com o cliente Supabase simulado.
 * Spec: SPEC/2026-11-27-faq-gerenciado-admin.md
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FAQ_PADRAO } from "@/lib/faq/faqPadrao";

const estado = {
  configurado: true,
  leitura: { data: [] as unknown, error: null as unknown },
  gravacao: { data: null as unknown, error: null as unknown },
  exclusao: { data: [{ id: "x" }] as unknown, error: null as unknown },
};
const upsert = vi.fn(() => ({ select: () => Promise.resolve(estado.gravacao) }));
const eqDelete = vi.fn(() => ({ select: () => Promise.resolve(estado.exclusao) }));

vi.mock("@/lib/supabase/client", () => ({
  supabase: {
    from: () => ({
      select: () => ({ order: () => Promise.resolve(estado.leitura) }),
      upsert,
      delete: () => ({ eq: eqDelete }),
    }),
  },
  isSupabaseConfigured: () => estado.configurado,
}));

import {
  excluirItemFaq,
  listarItensFaq,
  salvarItemFaq,
  salvarOrdemFaq,
} from "@/lib/supabase/faqRepository";

const linha = {
  id: "00000000-0000-4000-8000-000000000001",
  pergunta: "Tem estacionamento?",
  resposta: "Sim, gratuito para clientes.",
  categoria: "geral",
  ordem: 1,
  ativo: true,
  criado_em: "2026-11-27T10:00:00Z",
};

const novo = { pergunta: "  Tem vestiário?  ", resposta: "  Sim, com chuveiro.  ", categoria: "geral" as const, ordem: 5, ativo: true };

describe("faqRepository", () => {
  beforeEach(() => {
    estado.configurado = true;
    estado.leitura = { data: [], error: null };
    estado.gravacao = { data: [linha], error: null };
    estado.exclusao = { data: [{ id: linha.id }], error: null };
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe("listarItensFaq", () => {
    it("converte as linhas do banco", async () => {
      estado.leitura = { data: [linha], error: null };
      await expect(listarItensFaq()).resolves.toEqual({
        ok: true,
        dado: [
          {
            id: linha.id,
            pergunta: "Tem estacionamento?",
            resposta: "Sim, gratuito para clientes.",
            categoria: "geral",
            ordem: 1,
            ativo: true,
            criadoEm: "2026-11-27T10:00:00Z",
          },
        ],
      });
    });

    it("tabela vazia devolve lista vazia, sem cair no padrão", async () => {
      await expect(listarItensFaq()).resolves.toEqual({ ok: true, dado: [] });
    });

    it("erro de leitura devolve ok: false com mensagem", async () => {
      estado.leitura = { data: null, error: { code: "PGRST000", message: "offline" } };
      const resultado = await listarItensFaq();
      expect(resultado.ok).toBe(false);
    });

    it("sem Supabase começa pelas perguntas padrão do localStorage", async () => {
      estado.configurado = false;
      await expect(listarItensFaq()).resolves.toEqual({ ok: true, dado: [...FAQ_PADRAO] });
    });
  });

  describe("salvarItemFaq", () => {
    it("apara os textos e grava num único upsert", async () => {
      const resultado = await salvarItemFaq({ ...novo, id: linha.id });
      expect(resultado.ok).toBe(true);
      expect(upsert).toHaveBeenCalledWith(
        expect.objectContaining({ id: linha.id, pergunta: "Tem vestiário?", resposta: "Sim, com chuveiro." })
      );
    });

    it("item novo recebe um id gerado", async () => {
      await salvarItemFaq(novo);
      const enviado = (upsert.mock.calls[0] as unknown as [{ id: string }])[0];
      expect(enviado.id).toMatch(/^[0-9a-f-]{36}$/);
    });

    it("item inválido não chama o banco e devolve os erros", async () => {
      const resultado = await salvarItemFaq({ ...novo, pergunta: "Oi" });
      expect(upsert).not.toHaveBeenCalled();
      expect(resultado).toMatchObject({ ok: false, erros: { pergunta: expect.any(String) } });
    });

    it("recusa da RLS vira a mensagem de permissão", async () => {
      estado.gravacao = { data: null, error: { code: "42501", message: "rls" } };
      await expect(salvarItemFaq(novo)).resolves.toEqual({
        ok: false,
        mensagem: "Sem permissão para alterar as perguntas. Entre novamente no painel.",
      });
    });

    it("sem Supabase grava no localStorage", async () => {
      estado.configurado = false;
      const resultado = await salvarItemFaq(novo);
      expect(resultado.ok).toBe(true);
      const lista = await listarItensFaq();
      expect(lista.ok && lista.dado.some((i) => i.pergunta === "Tem vestiário?")).toBe(true);
    });
  });

  describe("excluirItemFaq e salvarOrdemFaq", () => {
    it("exclusão sem linha afetada (RLS) vira a mensagem de permissão", async () => {
      estado.exclusao = { data: [], error: null };
      await expect(excluirItemFaq(linha.id)).resolves.toMatchObject({ ok: false, mensagem: expect.stringContaining("permissão") });
    });

    it("exclui pelo id", async () => {
      await expect(excluirItemFaq(linha.id)).resolves.toEqual({ ok: true, dado: undefined });
      expect(eqDelete).toHaveBeenCalledWith("id", linha.id);
    });

    it("a nova ordem vai num único upsert", async () => {
      await salvarOrdemFaq([...FAQ_PADRAO]);
      expect(upsert).toHaveBeenCalledTimes(1);
      expect((upsert.mock.calls[0] as unknown as [unknown[]])[0]).toHaveLength(4);
    });
  });
});
