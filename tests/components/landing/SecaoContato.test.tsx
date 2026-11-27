/**
 * Seção Contato da landing, alimentada pelas configurações do complexo.
 * Spec: SPEC/2026-11-27-secao-contato-landing.md
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SecaoContato } from "@/components/landing/SecaoContato";
import {
  CONFIGURACOES_PADRAO,
  type ConfiguracoesComplexo,
} from "@/lib/configuracoes/configuracoesComplexo";

let configMock: ConfiguracoesComplexo;

vi.mock("@/hooks/useConfiguracoesComplexo", () => ({
  useConfiguracoesComplexo: () => ({ configuracoes: configMock, carregando: false, salvar: vi.fn() }),
}));

beforeEach(() => {
  configMock = {
    ...CONFIGURACOES_PADRAO,
    nomeComplexo: "Arena Teste",
    endereco: "Rua São João, 123 - Centro",
    horarioFuncionamento: "Seg a Sex, 08h às 22h",
    telefone: "(11) 4000-1234",
    whatsapp: "5511988887777",
    email: "contato@arena.test",
  };
});

describe("SecaoContato", () => {
  it("mostra as informações da configuração na âncora #contato", () => {
    const { container } = render(<SecaoContato />);
    expect(container.querySelector("section#contato")).not.toBeNull();
    expect(screen.getByText("Rua São João, 123 - Centro")).toBeInTheDocument();
    expect(screen.getByText("Seg a Sex, 08h às 22h")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "(11) 4000-1234" })).toHaveAttribute("href", "tel:+551140001234");
    expect(screen.getByRole("link", { name: "contato@arena.test" })).toHaveAttribute(
      "href",
      "mailto:contato@arena.test"
    );
  });

  it("o botão de WhatsApp usa o número da configuração e abre em nova aba", () => {
    render(<SecaoContato />);
    const link = screen.getByRole("link", { name: /Chamar no WhatsApp/ });
    expect(link.getAttribute("href")).toMatch(/^https:\/\/wa\.me\/5511988887777\?text=/);
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("o mapa e o 'Como chegar' usam o endereço configurado", () => {
    render(<SecaoContato />);
    const mapa = screen.getByTitle("Mapa de localização do complexo");
    expect(mapa.getAttribute("src")).toBe(
      "https://www.google.com/maps?q=Rua%20S%C3%A3o%20Jo%C3%A3o%2C%20123%20-%20Centro&output=embed"
    );
    expect(mapa).toHaveAttribute("loading", "lazy");
    expect(screen.getByRole("link", { name: /Como chegar/ }).getAttribute("href")).toContain(
      "query=Rua%20S%C3%A3o%20Jo%C3%A3o"
    );
  });

  it("sem endereço não mostra mapa nem 'Como chegar'", () => {
    configMock = { ...configMock, endereco: "  " };
    render(<SecaoContato />);
    expect(screen.queryByTitle("Mapa de localização do complexo")).toBeNull();
    expect(screen.queryByRole("link", { name: /Como chegar/ })).toBeNull();
    expect(screen.getByText("Seg a Sex, 08h às 22h")).toBeInTheDocument();
  });

  it("WhatsApp inválido esconde o botão e e-mail vazio esconde a linha", () => {
    configMock = { ...configMock, whatsapp: "123", email: "" };
    render(<SecaoContato />);
    expect(screen.queryByRole("link", { name: /Chamar no WhatsApp/ })).toBeNull();
    expect(screen.queryByText("E-mail")).toBeNull();
  });
});
