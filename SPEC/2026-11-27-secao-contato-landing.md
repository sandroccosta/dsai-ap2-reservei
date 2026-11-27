# Especificação: Seção Contato na landing, com mapa (JN-05)

## Objetivo
A seção "Localização e Contato" da landing deixa de ser placeholder e mostra endereço, horário de funcionamento, telefone, e-mail, um mapa incorporado e atalhos para o WhatsApp e para o Google Maps, tudo vindo das configurações do complexo (JN-04).

## Problema comprovado
O documento dos autores promete "Localização e Informações de Contato: Mapa interativo, horários de funcionamento". No código, Contato é placeholder: está em `PLACEHOLDERS_SECOES` (`src/lib/landingPage/secoes.ts`) com os itens "Mapa interativo do Google Maps", "Horários de funcionamento sincronizados com o sistema" e "Atalhos para WhatsApp, telefone e e-mail".

## Depende de
JN-04 (`SPEC/2026-11-27-configuracoes-complexo.md`): `useConfiguracoesComplexo` e os campos `endereco`, `horarioFuncionamento`, `telefone`, `whatsapp` e `email`.

## Decisões
1. **Regras puras** em `src/lib/landingPage/contato.ts`:
   - `montarUrlMapaIncorporado(endereco)`: `https://www.google.com/maps?q=<endereço codificado>&output=embed`, sem chave de API. Endereço vazio ou só com espaços devolve `null`.
   - `montarUrlComoChegar(endereco)`: `https://www.google.com/maps/search/?api=1&query=<endereço codificado>`. Endereço vazio devolve `null`.
   - `montarLinkTelefone(telefone)`: `tel:+<dígitos>` (acrescenta `55` quando o número tem 10 ou 11 dígitos); menos de 10 dígitos devolve `null`.
   - O endereço é aparado (`trim`) e codificado com `encodeURIComponent` (acentos, vírgulas, `#` e `&`).
   - O link do WhatsApp reutiliza `montarLinkWhatsApp` (`src/lib/landingPage/navegacao.ts`), com uma mensagem padrão citando o nome do complexo.
2. **Componente** `src/components/landing/SecaoContato.tsx`, com `SecaoLanding` e `id={SECAO_IDS.CONTATO}`, lendo `useConfiguracoesComplexo` (enquanto carrega, mostra os valores padrão, como o restante do site).
   - Bloco de informações: endereço, horário de funcionamento, telefone (link `tel:`) e e-mail (link `mailto:`).
   - Botões "Chamar no WhatsApp" e "Como chegar", em nova aba (`target="_blank"` e `rel="noopener noreferrer"`).
   - Mapa: `<iframe title="Mapa de localização do complexo" loading="lazy" referrerPolicy="no-referrer-when-downgrade">` com a URL do mapa.
   - Cada informação ou botão cujo dado está vazio ou inválido não aparece (sem endereço: sem mapa e sem "Como chegar"; WhatsApp inválido: sem o botão; e-mail vazio: sem a linha do e-mail).
3. **Registro na landing**: remover Contato de `PLACEHOLDERS_SECOES` e passar `<SecaoContato />` pela prop `implementadas` de `<LandingSecoesPlaceholder />` em `PortalCliente.tsx`, como a de Eventos. Contato continua a última seção do catálogo, então aparece no fim da página, antes do rodapé.

## Casos de borda
- Endereço com acentos, vírgulas e `#` (ex.: "Rua São João, 123 #2 - Centro"): codificado na URL, sem quebrar o parâmetro.
- Endereço vazio ou só espaços: sem mapa e sem "Como chegar"; o resto da seção continua.
- WhatsApp vazio ou com menos de 10 dígitos: sem o botão "Chamar no WhatsApp".
- E-mail vazio (o padrão de `CONFIGURACOES_PADRAO`): sem a linha de e-mail.
- Telefone com máscara ("(11) 4000-1234"): link `tel:+551140001234`.
- Admin altera o endereço em Configurações: o mapa e os links da landing mudam na próxima carga, sem código novo.

## Banco
Nenhuma mudança: usa a tabela `configuracoes_complexo` da JN-04.

## Testes
- Vitest `tests/lib/landingPage/contato.test.ts`: URL do mapa e do "Como chegar" com acentos, vírgulas e `#` codificados; endereço vazio devolve `null`; link de telefone com máscara, com e sem DDI, e inválido.
- Vitest `tests/components/landing/SecaoContato.test.tsx` (hook simulado): mostra endereço, horário, telefone e e-mail da configuração; o link de WhatsApp usa o número da configuração; o iframe usa o endereço configurado; sem endereço não há mapa nem "Como chegar"; WhatsApp inválido esconde o botão; e-mail vazio esconde a linha.
- Vitest `tests/lib/landingPage/secoes.test.ts`: Contato não está mais em `PLACEHOLDERS_SECOES`.

## Critérios de aceitação
- A âncora `#contato` do menu leva à seção real, sem o selo "Em construção".
- O mapa mostra o endereço salvo pelo admin.
- `npm run lint`, `npm run typecheck` e `npm test` sem erros.

## Fora do escopo
- Mapa com chave de API, marcador personalizado ou rota calculada dentro do site.
- Formulário de contato que envia mensagem.
- Horário de funcionamento calculado a partir de `HORARIOS_DISPONIVEIS`: o texto vem da configuração, editado pelo admin.
