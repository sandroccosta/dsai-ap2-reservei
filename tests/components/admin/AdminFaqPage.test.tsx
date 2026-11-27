/**
 * Tela "Perguntas Frequentes" do painel admin.
 * Spec: SPEC/2026-11-27-faq-gerenciado-admin.md
 */
import React from "react";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";
import { AdminFaqPage } from "@/components/admin/AdminFaqPage";
import type { ItemFaq } from "@/lib/faq/types";

const servico = {
  salvar: vi.fn(),
  excluir: vi.fn(),
  mover: vi.fn(),
  alternarAtivo: vi.fn(),
};
let itensMock: ItemFaq[] = [];
let erroMock: string | null = null;

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/hooks/useFaqService", () => ({
  useFaqService: () => ({ itens: itensMock, carregando: false, erro: erroMock, ...servico }),
}));

function item(id: string, ordem: number, ativo = true): ItemFaq {
  return { id, pergunta: `Pergunta ${id}?`, resposta: `Resposta da pergunta ${id}.`, categoria: "geral", ordem, ativo, criadoEm: "" };
}

function linha(id: string) {
  return screen.getByTestId(`faq-item-${id}`);
}

describe("AdminFaqPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    itensMock = [item("a", 1), item("b", 2, false)];
    erroMock = null;
    servico.salvar.mockResolvedValue({ ok: true, dado: item("novo", 3) });
    servico.excluir.mockResolvedValue({ ok: true, dado: undefined });
    servico.mover.mockResolvedValue({ ok: true, dado: undefined });
  });

  it("lista em ordem, marca a inativa e desabilita subir no primeiro e descer no último", () => {
    render(<AdminFaqPage />);
    expect(within(linha("b")).getByText("Inativa")).toBeInTheDocument();
    expect(within(linha("a")).getByRole("button", { name: /Subir/ })).toBeDisabled();
    expect(within(linha("a")).getByRole("button", { name: /Descer/ })).toBeEnabled();
    expect(within(linha("b")).getByRole("button", { name: /Descer/ })).toBeDisabled();
  });

  it("cria uma pergunta no fim da lista", async () => {
    render(<AdminFaqPage />);
    fireEvent.click(screen.getByRole("button", { name: /Nova pergunta/ }));
    fireEvent.change(screen.getByLabelText("Pergunta"), { target: { value: "Tem estacionamento?" } });
    fireEvent.change(screen.getByLabelText("Resposta"), { target: { value: "Sim, gratuito para clientes." } });
    fireEvent.click(screen.getByRole("button", { name: /Salvar pergunta/ }));

    await waitFor(() => expect(toast.success).toHaveBeenCalled());
    expect(servico.salvar).toHaveBeenCalledWith({
      pergunta: "Tem estacionamento?",
      resposta: "Sim, gratuito para clientes.",
      categoria: "geral",
      ordem: 3,
      ativo: true,
    });
  });

  it("dado inválido mostra o erro no campo e não salva", () => {
    render(<AdminFaqPage />);
    fireEvent.click(screen.getByRole("button", { name: /Nova pergunta/ }));
    fireEvent.change(screen.getByLabelText("Pergunta"), { target: { value: "Oi" } });
    fireEvent.click(screen.getByRole("button", { name: /Salvar pergunta/ }));

    expect(servico.salvar).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Pergunta")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText(/pelo menos 5 caracteres/)).toBeInTheDocument();
  });

  it("editar mantém o id e a posição do item", async () => {
    render(<AdminFaqPage />);
    fireEvent.click(within(linha("a")).getByRole("button", { name: /Editar/ }));
    fireEvent.change(screen.getByLabelText("Resposta"), { target: { value: "Resposta nova e completa." } });
    fireEvent.click(screen.getByRole("button", { name: /Salvar pergunta/ }));

    await waitFor(() => expect(servico.salvar).toHaveBeenCalled());
    expect(servico.salvar).toHaveBeenCalledWith(
      expect.objectContaining({ id: "a", ordem: 1, ativo: true, resposta: "Resposta nova e completa." })
    );
  });

  it("excluir só acontece depois da confirmação", async () => {
    const confirmar = vi.spyOn(window, "confirm").mockReturnValueOnce(false).mockReturnValueOnce(true);
    render(<AdminFaqPage />);

    fireEvent.click(within(linha("a")).getByRole("button", { name: /Excluir/ }));
    expect(servico.excluir).not.toHaveBeenCalled();

    fireEvent.click(within(linha("a")).getByRole("button", { name: /Excluir/ }));
    await waitFor(() => expect(servico.excluir).toHaveBeenCalledWith("a"));
    expect(confirmar).toHaveBeenCalledWith("Excluir esta pergunta? Esta ação não pode ser desfeita.");
  });

  it("erro do banco ao mover vira toast de erro", async () => {
    servico.mover.mockResolvedValue({ ok: false, mensagem: "Sem permissão para alterar as perguntas." });
    render(<AdminFaqPage />);
    fireEvent.click(within(linha("a")).getByRole("button", { name: /Descer/ }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Sem permissão para alterar as perguntas."));
    expect(servico.mover).toHaveBeenCalledWith("a", "baixo");
  });

  it("falha de leitura mostra a mensagem do serviço", () => {
    itensMock = [];
    erroMock = "Não foi possível carregar as perguntas frequentes.";
    render(<AdminFaqPage />);
    expect(screen.getByRole("alert")).toHaveTextContent(erroMock);
  });
});
