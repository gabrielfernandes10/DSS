# Plano de fundação — DSS · Deni Sistemas de Segurança

## 1. Objetivo da primeira etapa

Construir a fundação de uma plataforma web profissional para a DSS, com website institucional público e painel administrativo privado preparado para crescer de um administrador para uma equipe. Nesta etapa serão entregues a estrutura React/TypeScript, o sistema visual com Tailwind CSS, layouts principais, navegação e rotas, a preparação do cliente Supabase sem credenciais, e a documentação técnica. Não serão inventadas credenciais, registros reais ou fluxos completos de negócio.

## 2. Escopo funcional da fundação

### Website público

- `/` — Início, com proposta de valor, serviços em destaque, sinais de confiança e CTAs para orçamento e assistência.
- `/servicos` — catálogo dos seis grupos de serviços da DSS.
- `/sobre` — posicionamento da empresa, atendimento em Porto Alegre e foco em residências e condomínios.
- `/orcamento` — formulário visual de solicitação de orçamento, com estado pronto para futura persistência e proteção contra spam.
- `/assistencia` — entrada dedicada para chamados de assistência técnica.
- `/contato` — canais, área de atendimento e formulário de contato.

### Painel privado

- `/painel/login` — entrada de autenticação preparada para Supabase Auth.
- `/painel` — dashboard inicial com visão operacional, sem dados fictícios.
- `/painel/clientes` — clientes.
- `/painel/solicitacoes` — solicitações recebidas.
- `/painel/orcamentos` — orçamentos.
- `/painel/ordens` — ordens de serviço.
- `/painel/agenda` — agenda.
- `/painel/financeiro` — financeiro.
- `/painel/configuracoes` — configurações e futura gestão de perfis.

As telas internas terão estados vazios claros e componentes de carregamento/erro/sucesso, sem fingir que existem dados de produção.

## 3. Abordagem de implementação

- React + TypeScript + Vite como base de frontend.
- Tailwind CSS para tokens visuais e composição responsiva.
- React Router para rotas públicas e privadas.
- Supabase JS isolado em `src/lib/supabase/`, lendo somente `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` quando fornecidas.
- Nenhuma chave `service_role` ou segredo será incluída no frontend.
- Tipos e contratos iniciais do domínio ficarão em `src/types/` e `src/features/`, deixando a implementação de queries e mutations para uma etapa posterior.
- A separação entre `components`, `features`, `lib`, `layouts`, `pages` e `types` evita concentrar regras em um componente monolítico.
- O projeto usará dependências fixadas via `packageManager` e política explícita de scripts conforme as orientações do ambiente.

## 4. Decisão arquitetural pendente de aprovação

### Alternativa recomendada — Supabase direto com RLS

O SPA usa o cliente Supabase no navegador com a chave pública `anon`, Supabase Auth para sessão e RLS para isolamento por `company_id`. Operações que exigirem segredo, validação forte ou efeitos privilegiados serão movidas futuramente para Supabase Edge Functions. É a opção mais alinhada à stack solicitada e mantém a primeira etapa simples, sem adicionar um backend paralelo.

### Alternativa B — camada server-side intermediária

O frontend chamaria um servidor próprio, que manteria as credenciais privadas e faria as operações no Supabase. Aumenta o controle sobre rate limiting, webhooks e regras privilegiadas, mas introduz uma camada adicional de deploy, observabilidade e manutenção já na fundação.

**Recomendação:** aprovar a alternativa recomendada para a fundação, deixando a camada server-side/Edge Functions como extensão para fluxos que realmente precisarem de privilégios, antispam avançado, webhooks ou integrações externas.

## 5. Arquitetura visual aprovada pelo briefing

### Opções consideradas

1. **Infraestrutura Editorial** — 0,07: composição assimétrica, alto contraste e linguagem de engenharia confiável.
2. **Névoa Ciano Operacional** — 0,06: interface escura com halos ciano, cartões técnicos e sensação de central de monitoramento.
3. **Precisão Institucional** — 0,05: base clara, azul-marinho estrutural e ciano usado como sinal de ação e confiança.

### Estilo escolhido: Precisão Institucional

- **Movimento de design:** B2B editorial contemporâneo, combinando clareza de serviço local com precisão de produto tecnológico.
- **Princípios:** confiança sem excesso de formalidade; hierarquia de informação muito legível; contraste funcional; sensação de prontidão operacional.
- **Filosofia de cor:** azul-marinho cria estabilidade e autoridade; azul estrutura navegação e confiança; ciano indica ação, conexão e tecnologia; cinza claro dá respiro para leitura; branco mantém o contato humano e a clareza.
- **Paradigma de layout:** blocos de conteúdo em faixas com alinhamentos laterais e cortes diagonais discretos, evitando uma página inteira de cards centralizados. O herói terá uma coluna de mensagem e uma coluna de “painel de confiança” com serviços e indicadores visuais, sem números inventados.
- **Elementos de assinatura:** linhas de circuito sutis; selo circular de atendimento/segurança; marca DSS formada por um monograma geométrico que lembra um escudo e uma conexão.
- **Interação:** CTAs diretos, foco visível, feedback de formulário imediato e microinterações discretas em hover/foco, sem efeitos que dificultem leitura ou performance mobile.
- **Animação:** entrada curta por fade/translate em blocos; hover com elevação de 2–4px e mudança de borda; nenhuma animação essencial para compreensão; respeito a `prefers-reduced-motion`.
- **Tipografia:** Manrope para títulos e interface, com peso 600–800; Inter para texto corrido e formulários, com escala generosa em mobile. Fallbacks system sans serão configurados para carregamento robusto.
- **Essência de marca:** proteção e automação confiáveis para casas e condomínios de Porto Alegre. Personalidade: confiável, técnica, próxima.
- **Voz:** objetiva, tranquilizadora e orientada à solução. Exemplos: “Proteção bem instalada começa com uma avaliação precisa.” e “Fale com a DSS e resolva o próximo passo com clareza.”
- **Wordmark/logo:** monograma “DSS” em escudo modular, acompanhado do nome em caixa alta compacta; o símbolo será tratado como marca própria, não apenas texto em fonte padrão.
- **Cor proprietária:** ciano `#19B6C9`, reservado para ações, estados positivos e detalhes de conexão.

## 6. Estrutura de pastas proposta

```text
src/
  app/
    App.tsx                 # composição de providers e roteamento
    routes.tsx              # rotas públicas, privadas e fallback
  components/
    brand/                  # marca, wordmark e elementos DSS
    layout/                 # header, footer, shell do painel, navegação
    ui/                     # Button, Input, Badge, Card, EmptyState, etc.
  features/
    public-site/            # seções e conteúdo das páginas institucionais
    requests/               # contratos e UI de orçamento/assistência
    auth/                   # estado de sessão e guardas do painel
    customers/              # primeira camada de telas administrativas
    operations/             # solicitações, orçamentos, ordens e agenda
    finance/                # visão financeira futura
    settings/               # preferências e perfis futuros
  layouts/                  # PublicLayout e AdminLayout
  lib/
    supabase/               # cliente, tipos e adaptadores sem credenciais
    utils/                  # utilitários compartilhados
  pages/
    public/                 # páginas institucionais
    admin/                  # páginas do painel
  styles/                   # Tailwind/base CSS e tokens
  types/                    # entidades e contratos iniciais do domínio
public/
  manus-routes.json         # manifesto de rotas da plataforma
  logo.svg                  # marca vetorial local
supabase/
  migrations/               # reservado para schema/RLS aprovados
  README.md                 # orientação para conexão sem credenciais

docs/
  architecture.md
  data-model.md
  environment.md
README.md
TODO.md
plan.md
.env.example
app.config.ts
```

## 7. Modelo inicial de dados

As entidades serão documentadas e tipadas, sem migração executada nesta etapa:

- `companies`: empresa, nome, slug, contatos e timestamps.
- `profiles`: vínculo de usuário autenticado com empresa e papel (`owner`, `admin`, `staff`), status e timestamps.
- `customers`: cliente pessoa física ou condomínio, contatos e observações.
- `customer_addresses`: endereços dos clientes, com referência ao cliente e à empresa.
- `service_types`: catálogo de serviços e status de disponibilidade.
- `service_requests`: solicitação pública ou interna, tipo, cliente, status e origem.
- `request_attachments`: anexos de solicitações em Storage, com metadados e políticas de acesso.
- `quotes`: orçamento, cliente, solicitação, status, validade e totais.
- `quote_items`: itens, descrição, quantidade, valor unitário e total.
- `service_orders`: ordem de serviço, orçamento/solicitação de origem, status, prioridade e responsável.
- `appointments`: agenda, ordem/cliente, início, fim, status e responsável.
- `financial_transactions`: receitas/despesas, referência operacional, categoria, valor e status.
- `activity_logs`: trilha de auditoria por empresa, ator, ação, entidade e metadados.

Todos os registros empresariais terão `company_id`, índices para os relacionamentos principais e políticas RLS planejadas por empresa e papel. O Storage será organizado por empresa e entidade, evitando caminhos públicos irrestritos.

## 8. Fluxo de construção

1. Criar manifestos, dependências e configuração de diagnóstico.
2. Montar tokens, marca, shell público e shell administrativo.
3. Criar páginas e rotas com conteúdo institucional real apenas do briefing.
4. Criar estados vazios e formulários visuais sem persistência.
5. Adicionar cliente Supabase opcional e `.env.example` sem valores reais.
6. Documentar arquitetura, dados, ambiente e decisões de segurança.
7. Rodar diagnóstico TypeScript, build, servidor de preview e validação do manifesto de rotas.
8. Salvar checkpoint no repositório canônico; publicação fica separada e não será ativada automaticamente.

## 9. Fora do escopo desta etapa

- Criação de usuários reais, configuração do projeto Supabase e aplicação das migrations/RLS em produção.
- Migrações ou políticas RLS aplicadas em um projeto Supabase real.
- CRUD completo, envio de e-mails, WhatsApp, pagamentos ou integrações externas.
- Dados de clientes, solicitações, orçamentos, agenda ou financeiro.
- Upload real de anexos e proteção antispam em produção.

## 10. Variáveis de ambiente previstas

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Os valores serão fornecidos/configurados apenas quando o projeto Supabase estiver definido. O arquivo `.env.example` conterá apenas os nomes, nunca valores inventados.
