/**
 * Tela "Configurações" do painel admin.
 * Spec: SPEC/2026-11-27-configuracoes-complexo.md
 */
import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";
import { AdminConfiguracoesPage } from "@/components/admin/AdminConfiguracoesPage";
import { CONFIGURACOES_PADRAO } from "@/lib/configuracoes/configuracoesComplexo";

const salvar = vi.fn();

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/hooks/useConfiguracoesComplexo", () => ({
  useConfiguracoesComplexo: () => ({ configuracoes: CONFIGURACOES_PADRAO, carregando: false, salvar }),
}));

function preencher(rotulo: RegExp, valor: string) {
  fireEvent.change(screen.getByLabelText(rotulo), { target: { value: valor } });
}

describe("AdminConfiguracoesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    salvar.mockImplementation(async (dados) => ({ ok: true, configuracoes: dados }));
  });

  it("mostra os dados atuais e salva as alterações", async () => {
    render(<AdminConfiguracoesPage />);
    expect(screen.getByLabelText(/Nome do complexo/)).toHaveValue(CONFIGURACOES_PADRAO.nomeComplexo);

    preencher(/WhatsApp/, "+55 (91) 98888-7777");
    preencher(/Endereço/, "Av. Nazaré, 10 – Belém");
    fireEvent.click(screen.getByRole("button", { name: /Salvar/ }));

    await waitFor(() => expect(toast.success).toHaveBeenCalled());
    expect(salvar).toHaveBeenCalledWith(
      expect.objectContaining({ whatsapp: "+55 (91) 98888-7777", endereco: "Av. Nazaré, 10 – Belém" })
    );
  });

  it("mostra o erro no campo inválido e não salva", () => {
    render(<AdminConfiguracoesPage />);

    preencher(/WhatsApp/, "91988887777");
    preencher(/Instagram/, "http://instagram.com/x");
    fireEvent.click(screen.getByRole("button", { name: /Salvar/ }));

    expect(screen.getByText(/DDI 55/)).toBeInTheDocument();
    expect(screen.getByText(/começar com https:\/\//)).toBeInTheDocument();
    expect(screen.getByLabelText(/WhatsApp/)).toHaveAttribute("aria-invalid", "true");
    expect(salvar).not.toHaveBeenCalled();
  });

  it("avisa quando o banco recusa o salvamento", async () => {
    salvar.mockResolvedValue({ ok: false, mensagem: "Sem permissão para salvar. Entre novamente no painel." });
    render(<AdminConfiguracoesPage />);

    fireEvent.click(screen.getByRole("button", { name: /Salvar/ }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Sem permissão para salvar. Entre novamente no painel.")
    );
  });
});
