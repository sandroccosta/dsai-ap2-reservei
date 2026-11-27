/**
 * Seção FAQ da landing: sanfona nativa, só itens ativos, texto sem HTML.
 * Spec: SPEC/2026-11-27-faq-gerenciado-admin.md
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SecaoFaq } from "@/components/landing/SecaoFaq";
import type { ItemFaq } from "@/lib/faq/types";

let ativosMock: ItemFaq[] = [];

vi.mock("@/hooks/useFaqService", () => ({
  useFaqService: () => ({ ativos: ativosMock, carregando: false }),
}));

function item(id: string, pergunta: string, resposta = "Resposta longa o bastante."): ItemFaq {
  return { id, pergunta, resposta, categoria: "geral", ordem: 1, ativo: true, criadoEm: "" };
}

describe("SecaoFaq", () => {
  beforeEach(() => {
    ativosMock = [item("a", "Primeira pergunta?"), item("b", "Segunda pergunta?", "Linha 1\nLinha 2")];
  });

  it("mostra cada pergunta numa sanfona nativa, na ordem recebida", () => {
    const { container } = render(<SecaoFaq />);
    expect(container.querySelector("section#faq")).not.toBeNull();
    const perguntas = Array.from(container.querySelectorAll("details > summary")).map((s) => s.textContent);
    expect(perguntas).toEqual(["Primeira pergunta?", "Segunda pergunta?"]);
    expect(screen.getByText(/Linha 1/).className).toContain("whitespace-pre-line");
  });

  it("exibe HTML como texto, sem executar", () => {
    ativosMock = [item("x", "<script>alert(1)</script>", "<img src=x onerror=alert(1)>")];
    const { container } = render(<SecaoFaq />);
    expect(screen.getByText("<script>alert(1)</script>")).toBeInTheDocument();
    expect(container.querySelector("script")).toBeNull();
    expect(container.querySelector("img")).toBeNull();
  });

  it("sem itens ativos a seção não aparece", () => {
    ativosMock = [];
    const { container } = render(<SecaoFaq />);
    expect(container.querySelector("section")).toBeNull();
  });
});
