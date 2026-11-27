/**
 * Links da seção Contato da landing.
 * Spec: SPEC/2026-11-27-secao-contato-landing.md
 */

function enderecoCodificado(endereco: string): string | null {
  const limpo = (endereco ?? "").trim();
  return limpo ? encodeURIComponent(limpo) : null;
}

/** Mapa do Google incorporável por iframe, sem chave de API. `null` sem endereço. */
export function montarUrlMapaIncorporado(endereco: string): string | null {
  const q = enderecoCodificado(endereco);
  return q ? `https://www.google.com/maps?q=${q}&output=embed` : null;
}

/** Busca do endereço no Google Maps (abre o app ou o site com a opção de rota). */
export function montarUrlComoChegar(endereco: string): string | null {
  const q = enderecoCodificado(endereco);
  return q ? `https://www.google.com/maps/search/?api=1&query=${q}` : null;
}

/** Link `tel:` com DDI; números brasileiros de 10 ou 11 dígitos ganham o 55. */
export function montarLinkTelefone(telefone: string): string | null {
  const digitos = (telefone ?? "").replace(/\D/g, "");
  if (digitos.length < 10) return null;
  const comDdi = digitos.length <= 11 ? `55${digitos}` : digitos;
  return `tel:+${comDdi}`;
}
