# DSS — Deni Sistemas de Segurança

Fundação do website institucional e painel administrativo da DSS, empresa de soluções de segurança para residências e condomínios em Porto Alegre/RS.

## Rodar localmente

```bash
pnpm install
pnpm dev
```

O projeto usa Vite e escuta na porta `3000` conforme a configuração do ambiente.

## Scripts

- `pnpm dev`: inicia o servidor de desenvolvimento.
- `pnpm build`: executa o build de produção.
- `pnpm typecheck`: verifica os tipos TypeScript.
- `pnpm preview`: serve o build localmente.

## Arquitetura

A aplicação é uma SPA em React + TypeScript + Tailwind CSS, organizada por layouts, componentes reutilizáveis, páginas e features. O website público usa `PublicLayout`; as rotas do painel usam `AdminLayout` protegido por `AuthGuard`. Sem Supabase configurado, o painel permanece bloqueado; com as variáveis configuradas, a sessão é verificada pelo Supabase Auth antes da renderização administrativa.

A integração Supabase fica isolada em `src/lib/supabase/client.ts`. O frontend usa apenas `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`, quando disponíveis. Chaves privadas nunca devem ser colocadas em arquivos `VITE_*`.

Consulte `docs/architecture.md`, `docs/data-model.md`, `docs/environment.md` e `plan.md` para decisões e evolução.
