# TODO — Fundação DSS

## Fundação React, TypeScript e Tailwind

- [x] A aplicação usa React + TypeScript + Tailwind CSS, com dependências fixadas e estrutura organizada por funcionalidades.
- [x] A identidade visual utiliza azul-marinho `#101D32`, azul `#1769AA`, ciano `#19B6C9`, cinza claro `#F3F6FA` e branco `#FFFFFF`, com tipografia moderna, ícones minimalistas, animações discretas e componentes consistentes.
- [x] O design é responsivo, prioriza mobile, possui navegação intuitiva, acessibilidade básica e componentes reutilizáveis.

## Website institucional

- [x] O website possui as rotas Início, Serviços, Sobre a DSS, Solicitar orçamento, Assistência técnica e Contato.
- [x] As páginas apresentam somente informações fornecidas no briefing da DSS, sem dados fictícios apresentados como reais.
- [ ] Orçamento, assistência e contato possuem formulários simples com estados visuais de carregamento, erro e sucesso, preparados para futura persistência e proteção contra spam.

## Painel administrativo

- [x] O painel possui entrada preparada para autenticação e rotas para Dashboard, Clientes, Solicitações, Orçamentos, Ordens de serviço, Agenda, Financeiro e Configurações.
- [x] O painel é privado por arquitetura de rotas, não expõe dados administrativos publicamente e apresenta estados vazios sem inventar registros.
- [x] A estrutura permite começar com um administrador e evoluir para novos funcionários e papéis.

## Integração Supabase preparada

- [x] O cliente Supabase é isolado em uma camada própria e usa somente `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` quando configuradas.
- [x] Nenhuma chave secreta é colocada no frontend; a arquitetura registra RLS por `company_id` como requisito para a próxima etapa.
- [ ] As entidades companies, profiles, customers, customer_addresses, service_types, service_requests, request_attachments, quotes, quote_items, service_orders, appointments, financial_transactions e activity_logs estão documentadas para evolução.

## Conexão com o projeto Supabase real

- [x] A URL HTTPS e a chave pública do projeto Supabase estão configuradas com segurança no ambiente gerenciado, sem serem gravadas no repositório.
- [x] O cliente Supabase Auth foi inicializado e respondeu ao smoke test sem sessão autenticada.
- [ ] Aplicar `supabase/migrations/0001_initial_schema.sql` no SQL Editor do projeto Supabase.
- [ ] Criar o primeiro usuário em Supabase Auth e executar o onboarding `bootstrap_company` para gerar a empresa e o perfil `owner`.

## Rotas, documentação e validação

- [x] O manifesto `public/manus-routes.json` cobre todas as rotas de página atuais.
- [x] A documentação inicial inclui visão geral, estrutura de pastas, tecnologias, arquitetura, modelo de dados e variáveis de ambiente.
- [x] O diagnóstico TypeScript, o build e o servidor de preview são executados com sucesso.
- [ ] O projeto não publica automaticamente e o checkpoint só é salvo após validação da fundação.
