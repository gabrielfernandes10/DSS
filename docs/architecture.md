# Arquitetura proposta

## Visão geral

A fundação é uma SPA React + TypeScript + Vite com Tailwind CSS. O mesmo frontend contém o website público e o painel administrativo, separados por layouts e rotas. A decisão aprovada é usar Supabase diretamente no cliente com a chave pública `anon`, sessão pelo Supabase Auth e RLS por `company_id`.

## Camadas

- `src/pages`: composição de telas por rota.
- `src/components`: componentes visuais e shells reutilizáveis.
- `src/features`: fronteiras por domínio para evoluir solicitações, clientes, operação e financeiro.
- `src/lib/supabase`: cliente e adaptadores de acesso a dados.
- `src/types`: tipos de domínio compartilhados.
- `supabase/migrations`: reservado para schema e RLS aprovados.

## Segurança

O navegador nunca receberá `service_role` ou outro segredo. As rotas administrativas já possuem uma guarda: sem variáveis Supabase o painel fica bloqueado; com Supabase configurado, a sessão é validada pelo Supabase Auth antes de renderizar o painel. Dados administrativos também deverão ser protegidos por políticas RLS que validem a empresa do perfil. Formulários públicos deverão receber rate limiting, validação de payload e proteção antispam antes de persistir em produção. Operações privilegiadas, webhooks e integrações externas poderão usar Supabase Edge Functions.

## Evolução de papéis

O modelo inicial prevê `owner`, `admin` e `staff`. Cada `profiles` pertence a uma `company_id`; as telas podem começar com um administrador, mas a política deve separar leitura, operação e configuração para permitir novos funcionários sem refatorar o domínio.
