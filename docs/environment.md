# Ambiente e integração

## Variáveis necessárias

O arquivo `.env.example` lista somente os nomes previstos:

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

`VITE_SUPABASE_ANON_KEY` é a chave pública do projeto Supabase e não substitui políticas RLS. Não usar `service_role`, tokens administrativos ou senhas em variáveis expostas ao Vite.

As duas variáveis já foram configuradas no ambiente gerenciado do projeto DSS por cartão seguro. Elas não são gravadas em `.env`, não aparecem no repositório e não devem ser copiadas para a documentação.

## Preparação futura

1. Criar ou selecionar o projeto Supabase da DSS.
2. Preencher as duas variáveis no ambiente de desenvolvimento.
3. Aplicar migrations revisadas para schema, índices, buckets e RLS.
4. Configurar Auth e o primeiro perfil de administrador fora do frontend.
5. Validar Storage por empresa e o fluxo de recuperação de senha.

A fundação funciona sem essas variáveis: o cliente fica `null` e a interface continua apresentando os estados de preparação, sem inventar dados.
