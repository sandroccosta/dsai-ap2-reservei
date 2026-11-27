# Especificação: Seção Fidelidade na landing (JN-10)

## Objetivo
A seção "Programa de Fidelidade" da landing deixa de ser placeholder e explica o programa em três passos, com os números da campanha configurada pelo admin, e convida o visitante a criar conta ou o cliente a ver a cartela.

## Problema comprovado
1. Fidelidade é placeholder em `PLACEHOLDERS_SECOES` (`src/lib/landingPage/secoes.ts`), com os itens planejados pelos autores: "Passo a passo de 'Como Funciona' o acúmulo de pontos", "Exemplos de recompensas reais disponíveis" e "CTA 'Crie sua Conta e Comece a Pontuar'".
2. `fetchCampanhaSupabase` (`src/lib/supabase/fidelidadeService.ts`) busca só campanhas com `ativo = true`. Quando o admin desativa o programa pela tela Fidelidade, a consulta não acha linha e a função devolve a campanha guardada no navegador ou `CAMPANHA_PADRAO`, que é **ativa**. Usar essa função na landing mostraria o programa a um visitante mesmo com ele desligado.

## Decisões
1. **Leitura para a landing**: nova função `obterCampanhaLanding()` em `src/lib/supabase/fidelidadeService.ts`, sem alterar `fetchCampanhaSupabase` (usada pela cartela e pelo admin):
   - Lê a campanha mais recente **sem filtrar por `ativo`** (`order("atualizado_em", desc).limit(1)`), reaproveitando o `rowToCampanha` do arquivo. A RLS já permite leitura pública da tabela.
   - Tabela sem linha: devolve `null` (a seção não aparece).
   - Erro de rede ou do banco: devolve a campanha local (`localStorage` ou `CAMPANHA_PADRAO`), como o resto do arquivo; o visitante nunca vê erro.
   - Sem Supabase configurado: campanha local.
2. **Regras puras** em `src/lib/fidelidade/textosLanding.ts`:
   - `campanhaExibivel(campanha)`: `true` só se `ativo` e se horas, meses e dias forem inteiros maiores que zero. Campanha com número inválido não aparece, para nunca mostrar "junte 0 horas".
   - `montarPassosFidelidade(campanha)`: três passos com título e texto:
     1. "Jogue": "Cada hora de quadra concluída vira 1 selo na sua cartela."
     2. "Junte N horas": "Complete N horas em até M meses." (os selos vencem depois desse prazo)
     3. "Ganhe um voucher": "Use o voucher em uma nova reserva em até X dias."
   - Singular e plural corretos: "1 hora", "1 mês", "1 dia".
3. **Hook** `src/hooks/useCampanhaFidelidadeLanding.ts`: carrega `obterCampanhaLanding()` uma vez e devolve `{ campanha, carregando }`.
4. **Componente** `src/components/landing/SecaoFidelidade.tsx`, com `SecaoLanding` e `id={SECAO_IDS.FIDELIDADE}`:
   - Enquanto carrega, ou se `campanhaExibivel` for falso: a seção não aparece.
   - Mostra os três passos numerados.
   - Chamada para ação depois que a sessão do navegador foi lida (`hasHydrated` de `useUserAuth`), para não piscar o botão errado: visitante vê "Criar conta" (`/cadastro`), cliente logado vê "Ver minha cartela" (`/minha-conta`).
5. **Registro na landing**: remover Fidelidade de `PLACEHOLDERS_SECOES` e passar `<SecaoFidelidade />` pela prop `implementadas` de `<LandingSecoesPlaceholder />` em `PortalCliente.tsx`, como as outras seções. Pelo catálogo, ela continua logo depois de Escolinhas.
6. **Testes do placeholder**: os testes de `LandingSecoesPlaceholder` que dependiam do placeholder de Fidelidade passam a usar uma lista de placeholders montada no próprio teste, para não quebrarem a cada seção implementada.

## Casos de borda
- Admin desativa o programa: a seção some da landing na próxima carga.
- Campanha com 1 hora, 1 mês e 1 dia: textos no singular.
- Campanha com `horasNecessarias` 0, negativo ou fracionado: a seção não aparece.
- Tabela vazia: a seção não aparece.
- Falha de rede: a seção aparece com a campanha local ou padrão.
- Visitante e cliente logado: botões diferentes; antes de ler a sessão, nenhum botão.

## Banco
Nenhuma mudança: a tabela `fidelidade_campanha` e a política "Campanha: leitura pública" já existem.

## Testes
- Vitest `tests/lib/fidelidade/textosLanding.test.ts`: passos com os números da campanha, singular e plural, `campanhaExibivel` (inativa, zero, negativo, fracionado).
- Vitest `tests/lib/supabase/obterCampanhaLanding.test.ts` (cliente simulado): campanha inativa do banco volta com `ativo: false` (não cai no padrão); tabela vazia devolve `null`; erro devolve a campanha padrão.
- Vitest `tests/components/landing/SecaoFidelidade.test.tsx`: passos com os números; visitante vê "Criar conta" para `/cadastro`; logado vê "Ver minha cartela" para `/minha-conta`; campanha inativa não mostra a seção.
- Vitest `tests/lib/landingPage/secoes.test.ts`: Fidelidade fora de `PLACEHOLDERS_SECOES`.

## Critérios de aceitação
- A seção mostra os números configurados na tela Fidelidade do admin e some quando o programa é desativado.
- `npm run lint`, `npm run typecheck` e `npm test` sem erros.

## Fora do escopo
- Lista de recompensas além do voucher: o sistema atual só tem o voucher de uma hora.
- Corrigir `fetchCampanhaSupabase`, que a cartela e a tela do admin usam: com o programa desativado, o admin abre a tela em outro navegador e vê o programa como ativo (registrado no `BACKLOG.md`).
