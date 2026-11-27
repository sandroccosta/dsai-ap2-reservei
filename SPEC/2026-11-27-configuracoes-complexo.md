# Especificação: Configurações do complexo no painel admin (JN-04)

## Objetivo
O admin edita os dados do complexo (nome, contato, endereço, redes sociais e horário de funcionamento) numa tela do painel, e o site inteiro passa a usar esses dados em vez de valores fixos no código.

## Problemas comprovados
1. **Dados fictícios e fixos**: `src/lib/landingPage/siteConfig.ts` tem `whatsappNumero: "5500000000000"` e redes sociais apontando para as páginas iniciais do Instagram e do Facebook. `src/lib/constants.ts` tem `NOME_COMPLEXO`, `ENDERECO_COMPLEXO = "Rua das Quadras, 100 – Centro"` e `TELEFONE_COMPLEXO = "(11) 99999-0000"`.
2. **Números de WhatsApp diferentes no mesmo site**: o rodapé usa `5500000000000`; "Minha Conta" e o login montam o link com os dígitos de `TELEFONE_COMPLEXO` (`11999990000`, sem DDI); o botão "Falar com Suporte" da conta bloqueada (`src/components/portal/PortalCliente.tsx`) abre `https://wa.me/5500000000000`.
3. **Gestão prometida e inexistente**: o próprio `siteConfig.ts` cita specs de gestão pelo admin (`lp-suporte-contato`) que nunca foram criadas.

## Decisões

### Banco (migração `supabase/migrations/20261127210000_configuracoes_complexo.sql`)
1. Tabela `configuracoes_complexo` com **uma linha só**: `id TEXT PRIMARY KEY DEFAULT 'principal' CHECK (id = 'principal')`, `nome_complexo`, `descricao`, `slogan`, `endereco`, `telefone`, `whatsapp`, `email`, `instagram_url`, `facebook_url`, `horario_funcionamento` (todas `TEXT NOT NULL DEFAULT ''`, exceto `nome_complexo`, que não tem padrão) e `atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()`.
2. `INSERT ... ON CONFLICT (id) DO NOTHING` com os valores atuais do código, para nada mudar visualmente até o admin editar.
3. RLS habilitado:
   - leitura pública (`SELECT USING (true)`): os dados aparecem para visitantes;
   - **gravação só pelo admin** (`FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin())`).
   - **Diferença em relação ao planejamento da tarefa**: o planejamento pedia uma policy de gestão provisória permissiva (`USING (true)`), escrito antes da RLS por usuário e admin (`SPEC/2026-11-24-rls-por-usuario-e-admin.md`). Como `public.is_admin()` já existe, usar a policy permissiva deixaria qualquer pessoa com a chave pública trocar o WhatsApp e o endereço do site. Esta spec já usa o padrão das outras tabelas da landing.
4. Teste SQL `supabase/tests/configuracoes_complexo.sql` (rodado no workflow de migrações): visitante lê a linha e não consegue alterá-la nem inserir outra; admin altera; uma segunda linha é recusada pelo `CHECK`.

### Regras puras (`src/lib/configuracoes/configuracoesComplexo.ts`)
1. Tipo `ConfiguracoesComplexo` (campos em camelCase, sem `atualizadoEm`).
2. `CONFIGURACOES_PADRAO` montado a partir das constantes atuais (`NOME_COMPLEXO`, `ENDERECO_COMPLEXO`, `TELEFONE_COMPLEXO`, `SITE_CONFIG`). As constantes antigas continuam exportadas como valores padrão.
3. `normalizarConfiguracoes(dados)`: tira espaços das pontas e deixa só os dígitos do WhatsApp.
4. `validarConfiguracoes(dados)`: devolve um objeto `{ campo: mensagem }` só com os campos inválidos (vazio = válido). Regras, aplicadas sobre os dados normalizados:
   - nome do complexo obrigatório, até 80 caracteres;
   - WhatsApp obrigatório, só dígitos, 12 ou 13 dígitos começando com o DDI 55;
   - e-mail opcional; se preenchido, formato `algo@dominio.tld`, até 120 caracteres;
   - URLs do Instagram e do Facebook opcionais; se preenchidas, começam com `https://`, até 300 caracteres;
   - tamanhos máximos: descrição 120, slogan 160, endereço 200, telefone 30, horário de funcionamento 120.
5. `paraConfiguracaoSite(config)`: converte para o `ConfiguracaoSite` que o rodapé já recebe (`LandingFooter` aceita a prop `config`), mantendo a marca "Reservei" e montando as redes sociais só com as URLs preenchidas, mais o WhatsApp.

### Acesso ao banco (`src/lib/supabase/configuracoesRepository.ts`)
1. `obterConfiguracoes()`: lê a linha `principal`.
   - Supabase não configurado: usa o que estiver salvo no `localStorage` (modo local) ou o padrão.
   - Erro de consulta ou linha ausente: devolve o padrão, sem quebrar a tela.
2. `salvarConfiguracoes(dados)`: normaliza e valida antes de gravar; devolve `{ ok: true, configuracoes }` ou `{ ok: false, erros?, mensagem }`. Com Supabase, faz `upsert` da linha `principal`; sem Supabase, grava no `localStorage`. Recusa da RLS (admin sem sessão) vira a mensagem "Sem permissão para salvar. Entre novamente no painel."

### Hook (`src/hooks/useConfiguracoesComplexo.ts`)
- Carrega uma vez por sessão do navegador e compartilha entre os componentes (store Zustand com `carregado`). Expõe `configuracoes` (o padrão enquanto carrega), `carregando` e `salvar(dados)`, que atualiza a store só quando o banco aceita.

### Tela do admin (`src/components/admin/AdminConfiguracoesPage.tsx`)
- Menu "Configurações" (ícone `Settings`) no `AdminSidebar` e renderização no `AdminShell`.
- Formulário com os campos da tabela, mensagem de erro em cada campo inválido, botão "Salvar" desabilitado durante o envio, toast de sucesso ou de erro.

### Uso no site
- `LandingFooter` (via `PortalCliente`): `config={paraConfiguracaoSite(configuracoes)}`.
- `PortalCliente`: link "Falar com Suporte" da conta bloqueada com `montarLinkWhatsApp(configuracoes.whatsapp, ...)`.
- `app/minha-conta/page.tsx`: nome, telefone e links de WhatsApp (suporte, cancelamento e contato) pela configuração.
- `app/login/page.tsx` (arquivo do Alexsandro): só o link de WhatsApp muda; avisar no PR.
- `CarrinhoLateral.tsx` e `FormularioIdentificacao.tsx`: endereço pela configuração.

## Casos de borda
- Tabela ainda não criada (antes do merge) ou Supabase fora do ar: o site mostra os valores padrão.
- Linha `principal` apagada: padrão; o próximo salvamento recria a linha (`upsert`).
- WhatsApp digitado com máscara (`+55 (91) 98888-7777`): normalizado para `5591988887777`.
- WhatsApp sem DDI (`91988887777`) ou com DDI de outro país: recusado com mensagem.
- URL `http://` ou `javascript:`: recusada.
- Instagram ou Facebook em branco: o ícone some do rodapé.
- `localStorage` indisponível ou com JSON inválido: padrão, sem exceção.

## Testes
- Vitest `tests/lib/configuracoes/configuracoesComplexo.test.ts`: cada regra de validação, normalização e conversão para o rodapé.
- Vitest `tests/lib/supabase/configuracoesRepository.test.ts` (mock de `@/lib/supabase/client`): padrão quando o Supabase falha ou não há linha; mapeamento da linha; salvar com dados inválidos não chama o banco; recusa de permissão vira mensagem.
- Vitest `tests/hooks/useConfiguracoesComplexo.test.ts`: carrega uma vez para vários componentes; `salvar` atualiza a store só no sucesso.
- Vitest `tests/components/admin/AdminConfiguracoesPage.test.tsx`: salva dados válidos; mostra erro de validação e não salva.
- SQL `supabase/tests/configuracoes_complexo.sql`.

## Critérios de aceitação
- O admin altera o WhatsApp na tela "Configurações" e o rodapé, a conta bloqueada, "Minha Conta" e o login passam a usar o número novo.
- Workflow "Migrações do Supabase" verde, incluindo o teste SQL e a reexecução da migração.
- `npm run lint`, `npm run typecheck` e `npm test` sem erros.

## Fora do escopo
- Telas de Contato (com mapa), Instagram e FAQ da landing (JN-05, JN-11, JN-06), que vão usar estas configurações.
- Logo e marca "Reservei" configuráveis.
- Horário de funcionamento estruturado (continua texto livre; a grade de horários das quadras não muda).
- Constantes do MCP (`mcp_server/`), que continuam com seus próprios valores.
