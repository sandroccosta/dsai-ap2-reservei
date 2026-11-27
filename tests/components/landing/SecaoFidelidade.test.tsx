/**
 * Seção Fidelidade da landing: passos com os números da campanha e chamada por sessão.
 * Spec: SPEC/2026-11-27-secao-fidelidade-landing.md
 */
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CAMPANHA_PADRAO } from "@/lib/fidelidade/fidelidadeService";
import type { CampanhaFidelidade } from "@/lib/fidelidade/types";

const obterCampanhaLanding = vi.fn();
const sessao = { user: null as unknown, hasHydrated: true };

vi.mock("@/lib/supabase/fidelidadeService", () => ({
  obterCampanhaLanding: () => obterCampanhaLanding(),
}));
vi.mock("@/hooks/useUserAuth", () => ({
  useUserAuth: () => ({ ...sessao, isAutenticado: Boolean(sessao.user) }),
}));
vi.mock("next/link", () => ({
  default: ({ href, children, ...resto }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...resto}>{children}</a>
  ),
}));

import { SecaoFidelidade } from "@/components/landing/SecaoFidelidade";

const campanha: CampanhaFidelidade = { ...CAMPANHA_PADRAO, horasNecessarias: 10, mesesValidade: 4, diasValidadeVoucher: 30 };

describe("SecaoFidelidade", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessao.user = null;
    sessao.hasHydrated = true;
    obterCampanhaLanding.mockResolvedValue(campanha);
  });

  it("mostra os três passos com os números da campanha", async () => {
    const { container } = render(<SecaoFidelidade />);
    expect(await screen.findByText("Junte 10 horas")).toBeInTheDocument();
    expect(container.querySelector("section#fidelidade")).not.toBeNull();
    expect(screen.getByText("Complete 10 horas em até 4 meses.")).toBeInTheDocument();
    expect(screen.getByText("Use o voucher em uma nova reserva em até 30 dias.")).toBeInTheDocument();
  });

  it("visitante vê 'Criar conta' levando ao cadastro", async () => {
    render(<SecaoFidelidade />);
    expect(await screen.findByRole("link", { name: /Criar conta/ })).toHaveAttribute("href", "/cadastro");
    expect(screen.queryByRole("link", { name: /Ver minha cartela/ })).toBeNull();
  });

  it("cliente logado vê 'Ver minha cartela' levando à Minha Conta", async () => {
    sessao.user = { id: "u1" };
    render(<SecaoFidelidade />);
    expect(await screen.findByRole("link", { name: /Ver minha cartela/ })).toHaveAttribute("href", "/minha-conta");
    expect(screen.queryByRole("link", { name: /Criar conta/ })).toBeNull();
  });

  it("antes de ler a sessão não mostra nenhum botão", async () => {
    sessao.hasHydrated = false;
    render(<SecaoFidelidade />);
    await screen.findByText("Junte 10 horas");
    expect(screen.queryByRole("link")).toBeNull();
  });

  it("campanha desativada ou ausente não mostra a seção", async () => {
    obterCampanhaLanding.mockResolvedValue({ ...campanha, ativo: false });
    const { container, unmount } = render(<SecaoFidelidade />);
    await waitFor(() => expect(obterCampanhaLanding).toHaveBeenCalled());
    expect(container.querySelector("section")).toBeNull();
    unmount();

    obterCampanhaLanding.mockResolvedValue(null);
    const outro = render(<SecaoFidelidade />);
    await waitFor(() => expect(obterCampanhaLanding).toHaveBeenCalledTimes(2));
    expect(outro.container.querySelector("section")).toBeNull();
  });
});
