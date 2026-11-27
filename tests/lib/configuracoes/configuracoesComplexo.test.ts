/**
 * Regras das configurações do complexo editadas pelo admin.
 * Spec: SPEC/2026-11-27-configuracoes-complexo.md
 */
import { describe, expect, it } from "vitest";
import {
  CONFIGURACOES_PADRAO,
  normalizarConfiguracoes,
  paraConfiguracaoSite,
  validarConfiguracoes,
  type ConfiguracoesComplexo,
} from "@/lib/configuracoes/configuracoesComplexo";
import { ENDERECO_COMPLEXO, NOME_COMPLEXO, TELEFONE_COMPLEXO } from "@/lib/constants";
import { SITE_CONFIG } from "@/lib/landingPage/siteConfig";

const validas: ConfiguracoesComplexo = {
  ...CONFIGURACOES_PADRAO,
  whatsapp: "5591988887777",
  email: "contato@reservei.com.br",
  instagramUrl: "https://www.instagram.com/reservei",
  facebookUrl: "",
};

function erros(parcial: Partial<ConfiguracoesComplexo>) {
  return validarConfiguracoes({ ...validas, ...parcial });
}

describe("CONFIGURACOES_PADRAO", () => {
  it("parte dos valores que o site já usava, para nada mudar antes da edição", () => {
    expect(CONFIGURACOES_PADRAO).toMatchObject({
      nomeComplexo: NOME_COMPLEXO,
      endereco: ENDERECO_COMPLEXO,
      telefone: TELEFONE_COMPLEXO,
      whatsapp: SITE_CONFIG.whatsappNumero,
      slogan: SITE_CONFIG.slogan,
      descricao: SITE_CONFIG.descricaoEstabelecimento,
    });
  });

  it("é válido", () => {
    expect(validarConfiguracoes(CONFIGURACOES_PADRAO)).toEqual({});
  });
});

describe("normalizarConfiguracoes", () => {
  it("tira espaços das pontas e deixa só os dígitos do WhatsApp", () => {
    const n = normalizarConfiguracoes({ ...validas, nomeComplexo: "  Arena  ", whatsapp: "+55 (91) 98888-7777" });
    expect(n.nomeComplexo).toBe("Arena");
    expect(n.whatsapp).toBe("5591988887777");
  });
});

describe("validarConfiguracoes", () => {
  it("aceita dados válidos", () => {
    expect(validarConfiguracoes(validas)).toEqual({});
  });

  it("exige o nome do complexo", () => {
    expect(erros({ nomeComplexo: "   " }).nomeComplexo).toMatch(/obrigatório/);
  });

  it("aceita WhatsApp com máscara e 12 ou 13 dígitos começando com 55", () => {
    expect(erros({ whatsapp: "+55 (91) 98888-7777" }).whatsapp).toBeUndefined();
    expect(erros({ whatsapp: "559133334444" }).whatsapp).toBeUndefined();
  });

  it.each([
    ["sem DDI", "91988887777"],
    ["DDI de outro país", "1415555012345"],
    ["curto demais", "55919888"],
    ["vazio", ""],
  ])("recusa WhatsApp %s", (_caso, whatsapp) => {
    expect(erros({ whatsapp }).whatsapp).toMatch(/55/);
  });

  it("aceita e-mail vazio e recusa e-mail mal formado", () => {
    expect(erros({ email: "" }).email).toBeUndefined();
    expect(erros({ email: "contato@reservei" }).email).toMatch(/e-mail/i);
  });

  it.each(["http://instagram.com/reservei", "javascript:alert(1)", "instagram.com/reservei"])(
    "recusa URL que não começa com https:// (%s)",
    (url) => {
      expect(erros({ instagramUrl: url }).instagramUrl).toMatch(/https:\/\//);
      expect(erros({ facebookUrl: url }).facebookUrl).toMatch(/https:\/\//);
    }
  );

  it.each([
    ["nomeComplexo", 80],
    ["descricao", 120],
    ["slogan", 160],
    ["endereco", 200],
    ["telefone", 30],
    ["horarioFuncionamento", 120],
  ] as const)("limita %s a %i caracteres", (campo, maximo) => {
    expect(erros({ [campo]: "a".repeat(maximo) })[campo]).toBeUndefined();
    expect(erros({ [campo]: "a".repeat(maximo + 1) })[campo]).toMatch(new RegExp(`${maximo}`));
  });
});

describe("paraConfiguracaoSite", () => {
  it("monta o rodapé com o WhatsApp e só as redes preenchidas, mantendo a marca", () => {
    const site = paraConfiguracaoSite(validas);
    expect(site.nomePlataforma).toBe(SITE_CONFIG.nomePlataforma);
    expect(site.whatsappNumero).toBe("5591988887777");
    expect(site.redesSociais.map((r) => r.rede)).toEqual(["instagram", "whatsapp"]);
    expect(site.redesSociais[0].url).toBe("https://www.instagram.com/reservei");
    expect(site.redesSociais[1].url).toBe("https://wa.me/5591988887777");
  });
});
