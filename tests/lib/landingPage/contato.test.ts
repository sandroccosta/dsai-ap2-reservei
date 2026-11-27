/**
 * Links da seção Contato: mapa incorporado, "Como chegar" e telefone.
 * Spec: SPEC/2026-11-27-secao-contato-landing.md
 */
import { describe, expect, it } from "vitest";
import {
  montarLinkTelefone,
  montarUrlComoChegar,
  montarUrlMapaIncorporado,
} from "@/lib/landingPage/contato";

const ENDERECO = "Rua São João, 123 #2 - Centro";
const CODIFICADO = "Rua%20S%C3%A3o%20Jo%C3%A3o%2C%20123%20%232%20-%20Centro";

describe("montarUrlMapaIncorporado", () => {
  it("codifica acentos, vírgulas e # e usa o modo embed sem chave", () => {
    expect(montarUrlMapaIncorporado(ENDERECO)).toBe(
      `https://www.google.com/maps?q=${CODIFICADO}&output=embed`
    );
  });

  it("apara espaços nas pontas", () => {
    expect(montarUrlMapaIncorporado(`  ${ENDERECO}  `)).toContain(`q=${CODIFICADO}&`);
  });

  it.each(["", "   "])("devolve null para endereço vazio (%j)", (endereco) => {
    expect(montarUrlMapaIncorporado(endereco)).toBeNull();
  });
});

describe("montarUrlComoChegar", () => {
  it("abre a busca do Google Maps com o endereço codificado", () => {
    expect(montarUrlComoChegar(ENDERECO)).toBe(
      `https://www.google.com/maps/search/?api=1&query=${CODIFICADO}`
    );
  });

  it("devolve null para endereço vazio", () => {
    expect(montarUrlComoChegar(" ")).toBeNull();
  });
});

describe("montarLinkTelefone", () => {
  it("acrescenta o DDI 55 a número com máscara e DDD", () => {
    expect(montarLinkTelefone("(11) 4000-1234")).toBe("tel:+551140001234");
    expect(montarLinkTelefone("11 99999-8888")).toBe("tel:+5511999998888");
  });

  it("mantém o número que já tem DDI", () => {
    expect(montarLinkTelefone("+55 11 99999-8888")).toBe("tel:+5511999998888");
  });

  it.each(["", "4000-1234", "abc"])("devolve null para número inválido (%j)", (telefone) => {
    expect(montarLinkTelefone(telefone)).toBeNull();
  });
});
