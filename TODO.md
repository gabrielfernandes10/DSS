# TODO — Fundação DSS

## Fundação React, TypeScript e Tailwind

- [x] A aplicação usa React + TypeScript + Tailwind CSS, com dependências fixadas e estrutura organizada por funcionalidades.
- [x] A identidade visual utiliza azul-marinho `#101D32`, azul `#1769AA`, ciano `#19B6C9`, cinza claro `#F3F6FA` e branco `#FFFFFF`, com tipografia moderna, ícones minimalistas, animações discretas e componentes consistentes.
- [x] O design é responsivo, prioriza mobile, possui navegação intuitiva, acessibilidade básica e componentes reutilizáveis.

## Website institucional

- [x] O website possui as rotas Início, Serviços, Sobre a DSS, Solicitar orçamento, Assistência técnica e Contato.
- [x] As páginas apresentam somente informações fornecidas no briefing da DSS, sem dados fictícios apresentados como reais.
- [x] Orçamento, assistência e contato possuem formulários com persistência encaminhada à Edge Function, estados de carregamento/erro/sucesso, honeypot e limite básico de frequência.
- [ ] Aplicar `supabase/migrations/0003_public_submission_guards.sql` e publicar `create-public-request` para ativar os formulários no ambiente Supabase real.

## Painel administrativo

- [x] O painel possui entrada preparada para autenticação e rotas para Dashboard, Clientes, Solicitações, Orçamentos, Ordens de serviço, Agenda, Financeiro e Configurações.
- [x] O painel é privado por arquitetura de rotas, não expõe dados administrativos publicamente e apresenta estados vazios sem inventar registros.
- [x] A estrutura permite começar com um administrador e evoluir para novos funcionários e papéis.
- [x] O módulo Clientes possui listagem, busca, cadastro de pessoa ou condomínio, estados de carregamento/erro/vazio e persistência na tabela `customers` respeitando o `company_id` do perfil autenticado.
- [x] O módulo Clientes possui edição e exclusão com confirmação, respeitando o RLS; endereços vinculados e histórico de relacionamento permanecem pendentes.
- [x] O módulo Solicitações possui cadastro, vínculo opcional com cliente e serviço, prioridade, busca, filtro por status, atualização de status e persistência na tabela `service_requests` respeitando o `company_id` do perfil autenticado.
- [ ] Solicitações possuem anexos e automações para orçamento e ordem de serviço.
- [x] Solicitações possuem edição e exclusão com confirmação, além da atualização de status, respeitando o RLS.
- [x] O catálogo de serviços possui cadastro, catálogo inicial real da DSS, ativação/desativação e integração com o formulário de Solicitações.
- [x] Serviços possuem edição, exclusão com confirmação e ativação/desativação, respeitando o RLS de administradores.
- [x] O módulo Orçamentos possui vínculo com cliente e solicitação, itens, quantidade, valor unitário, subtotal, desconto, total, validade, status e persistência em `quotes`/`quote_items`.
- [ ] Orçamentos possuem edição detalhada e aprovação pública ou por link seguro.
- [x] Orçamentos possuem exclusão com confirmação e remoção dos itens vinculados por cascata.
- [ ] Orçamentos possuem edição detalhada dos dados e itens.
- [x] O botão de envio de orçamento, a Edge Function `send-quote-email` e o registro de status/atividade foram implementados com Resend sem expor segredo no frontend.
- [ ] Configurar `RESEND_API_KEY`, `RESEND_FROM_EMAIL` e publicar a Edge Function no projeto Supabase para ativar o envio real.
- [x] O módulo Ordens de serviço possui vínculo com cliente, orçamento e solicitação, responsável, prioridade, agendamento, descrição, busca, status e persistência em `service_orders`.
- [ ] Ordens de serviço possuem edição detalhada, checklist técnico, anexos, conclusão com evidências e integração completa com Agenda.
- [x] Ordens de serviço possuem exclusão com confirmação, respeitando o RLS de administradores.
- [x] O módulo Agenda possui criação de compromissos, vínculo com cliente, ordem e responsável, validação de horário, busca, status e persistência em `appointments`.
- [ ] Agenda possui visão mensal/semanal, conflitos de horário, lembretes e edição detalhada.
- [x] Agenda possui exclusão com confirmação, respeitando o RLS de administradores.
- [x] O módulo Financeiro possui receitas e despesas, categorias, valores, datas, pagamento/pendência, vínculo opcional com ordem de serviço, busca, totais de receitas/despesas/saldo, edição e exclusão com confirmação na tabela `financial_transactions`.
- [x] O módulo Financeiro permite registrar receita e despesa no mesmo lançamento, vinculando os movimentos por `operation_id` e calculando o lucro da operação automaticamente.
- [ ] Aplicar `supabase/migrations/0002_financial_operation_id.sql` no SQL Editor do projeto Supabase antes de usar lançamentos compostos.
- [ ] Financeiro possui conciliação bancária, anexos de comprovantes, filtros por período/categoria e relatórios exportáveis.

## Integração Supabase preparada

- [x] O cliente Supabase é isolado em uma camada própria e usa somente `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` quando configuradas.
- [x] Nenhuma chave secreta é colocada no frontend; a arquitetura registra RLS por `company_id` como requisito para a próxima etapa.
- [x] As entidades companies, profiles, customers, customer_addresses, service_types, service_requests, request_attachments, quotes, quote_items, service_orders, appointments, financial_transactions e activity_logs estão documentadas para evolução.

## Conexão com o projeto Supabase real

- [x] A URL HTTPS e a chave pública do projeto Supabase estão configuradas com segurança no ambiente gerenciado, sem serem gravadas no repositório.
- [x] O cliente Supabase Auth foi inicializado e respondeu ao smoke test sem sessão autenticada.
- [x] Aplicar `supabase/migrations/0001_initial_schema.sql` no SQL Editor do projeto Supabase, incluindo tabelas, RLS, função de bootstrap e bucket privado.
- [ ] Criar/confirmar o primeiro usuário em Supabase Auth, habilitar o provedor Email e concluir o onboarding `bootstrap_company` para gerar a empresa e o perfil `owner`.
- [ ] Habilitar e validar o provedor Google OAuth no Supabase, incluindo Client ID, Client Secret e URLs autorizadas.

## Rotas, documentação e validação

- [x] O manifesto `public/manus-routes.json` cobre todas as rotas de página atuais.
- [x] A documentação inicial inclui visão geral, estrutura de pastas, tecnologias, arquitetura, modelo de dados e variáveis de ambiente.
- [x] O diagnóstico TypeScript, o build e o servidor de preview são executados com sucesso.
- [x] O projeto possui build de publicação configurado para `dist`, domínio público ativo e publicação automática habilitada no ambiente gerenciado.
