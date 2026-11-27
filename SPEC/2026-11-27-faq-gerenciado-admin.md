# Especificação: Perguntas frequentes gerenciadas pelo admin (JN-06)

## Objetivo
A seção "Termos, Regras e Perguntas Frequentes" da landing deixa de ser placeholder e mostra perguntas em sanfona, cadastradas e ordenadas pelo admin numa tela nova do painel.

## Problema comprovado
FAQ é placeholder em `PLACEHOLDERS_SECOES` (`src/lib/landingPage/secoes.ts`), com os itens planejados pelos próprios autores: "Perguntas em formato sanfona (accordion)", "Política de chuva e de cancelamento", "Regras de vestimenta e calçados" e "Gestão das perguntas pelo Painel Admin". Não há tabela, tela nem componente de FAQ no código.

## Banco
Migração nova `supabase/migrations/20261127230000_faq_itens.sql`:
- Tabela `faq_itens`: `id UUID PK DEFAULT gen_random_uuid()`, `pergunta TEXT NOT NULL`, `resposta TEXT NOT NULL`, `categoria TEXT NOT NULL DEFAULT 'geral'`, `ordem INTEGER NOT NULL DEFAULT 0`, `ativo BOOLEAN NOT NULL DEFAULT TRUE`, `criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()`.
- `CHECK` no banco, iguais à validação da tela: pergunta com 5 a 200 caracteres e resposta com 10 a 2000 (após `btrim`); categoria em `reservas`, `pagamentos`, `regras`, `geral`.
- Quatro perguntas iniciais com ids fixos e `ON CONFLICT (id) DO NOTHING`: chuva, cancelamento com 24h, vestimenta e calçado, antecedência de chegada. O admin pode editar ou apagar.
- RLS, seguindo a regra do Alexsandro para tabelas novas (`is_admin()`, no lugar da "gestão provisória permissiva" do documento-mestre):
  - Leitura: `ativo OR is_admin()`. Visitante e cliente só leem perguntas ativas; o admin lê todas.
  - Inserir, alterar e excluir: só `is_admin()`.
- Teste SQL `supabase/tests/faq_itens.sql`: visitante lê só as ativas e não grava; cliente não grava; admin lê as inativas, cria, altera e exclui; `CHECK` recusa pergunta curta e categoria desconhecida.

## Decisões
1. **Regras puras** em `src/lib/faq/`:
   - `types.ts`: `ItemFaq` (`id`, `pergunta`, `resposta`, `categoria`, `ordem`, `ativo`, `criadoEm`), `CategoriaFaq`, `DadosItemFaq` (o que o formulário edita) e `CATEGORIAS_FAQ` com os rótulos.
   - `validarItemFaq(dados)`: apara espaços e devolve os erros por campo (pergunta 5 a 200, resposta 10 a 2000, categoria conhecida).
   - `ordenarItensFaq(itens)`: por `ordem`; empate por `criadoEm` e depois `id`, para a ordem nunca variar entre cargas.
   - `moverItem(lista, id, "cima" | "baixo")`: troca o item com o vizinho na lista ordenada e renumera `ordem` de 1 a N. O primeiro não sobe, o último não desce e um id desconhecido devolve a lista sem mudança.
   - `filtrarAtivos(itens)`: só os ativos, já ordenados.
   - `proximaOrdem(itens)`: maior `ordem` + 1 (1 para lista vazia).
   - `FAQ_PADRAO`: as mesmas quatro perguntas da migração, para o site sem Supabase.
2. **Repositório** `src/lib/supabase/faqRepository.ts`, com `try/catch` e mensagens claras:
   - `listarItensFaq()` devolve `{ ok: true, itens }` ou `{ ok: false, mensagem }`. Tabela vazia é `ok` com lista vazia, **não** cai no padrão: se o admin apagou tudo, a seção some.
   - `salvarItemFaq(item)`: valida antes de gravar; dados inválidos não chegam ao banco. Insere quando não há `id`, senão atualiza.
   - `excluirItemFaq(id)` e `salvarOrdemFaq(itens)`: a nova ordem vai num único `upsert`.
   - Erro `42501` (RLS): "Sem permissão para alterar as perguntas. Entre novamente no painel."
   - Sem Supabase configurado: lê e grava no `localStorage` (chave `reservei_faq_itens`), começando por `FAQ_PADRAO`.
3. **Hook** `src/hooks/useFaqService.ts`: carrega a lista e expõe `itens`, `carregando`, `erro`, `salvar`, `excluir`, `mover` e `alternarAtivo`. Na landing, falha de leitura usa `FAQ_PADRAO`, para o visitante nunca ver erro. No admin, a falha aparece como mensagem e a lista fica vazia, para ele não editar dados de demonstração achando que são reais. Se gravar a nova ordem falhar, a lista volta à ordem anterior e aparece um toast de erro.
4. **Admin**: `src/components/admin/AdminFaqPage.tsx`, menu "Perguntas Frequentes" com ícone `HelpCircle`, ligado em `AdminSidebar.tsx` e `AdminShell.tsx`.
   - Lista em ordem, com a categoria, o selo "Inativa" e os botões subir, descer, editar, ativar/desativar e excluir.
   - Formulário de criar e editar com as mensagens de erro por campo (`aria-invalid`).
   - Excluir pede confirmação ("Excluir esta pergunta? Esta ação não pode ser desfeita.").
   - Subir fica desabilitado no primeiro item e descer no último.
5. **Landing**: `src/components/landing/SecaoFaq.tsx` com `SecaoLanding` e `id={SECAO_IDS.FAQ}`, sanfona com `<details>`/`<summary>` nativos (acessível pelo teclado, sem biblioteca nova). Mostra só os itens ativos, em ordem. Sem itens ativos, a seção não aparece. Remover FAQ de `PLACEHOLDERS_SECOES` e passar `<SecaoFaq />` pela prop `implementadas` em `PortalCliente.tsx`; pelo catálogo, ela fica entre os placeholders e o Contato.
6. **Segurança**: pergunta e resposta são exibidas como **texto**, nunca como HTML. Proibido `dangerouslySetInnerHTML`. Quebras de linha da resposta são mantidas com `whitespace-pre-line`.

## Casos de borda
- Pergunta com `<script>alert(1)</script>`: aparece literalmente na landing, sem executar.
- Pergunta com 4 caracteres, resposta com 9, ou só espaços: recusadas na tela e no banco.
- Dois itens com a mesma `ordem`: a ordem de exibição é estável (criação, depois id).
- Mover o primeiro para cima ou o último para baixo: nada muda e o botão fica desabilitado.
- Item inativo: some da landing e continua no admin com o selo "Inativa".
- Todas inativas ou tabela vazia: a seção FAQ não aparece na landing.
- Falha de rede na landing: mostra as perguntas padrão.
- Falha de rede no admin: mensagem de erro, sem lista de demonstração.
- Gravação recusada pela RLS (sessão expirada): toast com a mensagem de permissão; a lista não muda.

## Testes
- Vitest `tests/lib/faq/regrasFaq.test.ts`: validação (limites e espaços), ordenação com empate, `moverItem` (meio, primeiro, último, id desconhecido), `filtrarAtivos` e `proximaOrdem`.
- Vitest `tests/lib/supabase/faqRepository.test.ts` (cliente simulado): tabela vazia devolve lista vazia; erro de leitura devolve `ok: false`; item inválido não chama o banco; erro `42501` vira a mensagem de permissão; sem Supabase usa `localStorage`.
- Vitest `tests/components/landing/SecaoFaq.test.tsx`: só ativos, em ordem; `<script>` exibido como texto; sem ativos a seção não aparece.
- Vitest `tests/components/admin/AdminFaqPage.test.tsx`: criar um item chama o salvar com os dados aparados; dado inválido mostra o erro e não salva; excluir pede confirmação; subir desabilitado no primeiro.
- SQL `supabase/tests/faq_itens.sql` (acima).
- Vitest `tests/lib/landingPage/secoes.test.ts`: FAQ fora de `PLACEHOLDERS_SECOES`.

## Critérios de aceitação
- O admin cria, edita, reordena, desativa e exclui perguntas, e a landing reflete a mudança na próxima carga.
- Visitante não lê pergunta inativa nem grava nada, comprovado pelo teste SQL.
- `npm run lint`, `npm run typecheck` e `npm test` sem erros.

## Fora do escopo
- Busca ou filtro por categoria na landing.
- Respostas com formatação (negrito, links): o texto é exibido puro.
- Reordenar arrastando: a ordem muda pelos botões subir e descer.
- Edição simultânea por dois admins: vale a última gravação.
