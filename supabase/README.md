# Supabase

A integração do projeto DSS usa Supabase Auth, PostgreSQL, Storage e RLS por `company_id`. As variáveis públicas do projeto foram configuradas no ambiente gerenciado; nenhum `service_role` é usado no frontend.

## Aplicar o schema inicial

1. Abra o projeto da DSS no Supabase.
2. Acesse **SQL Editor** e crie uma nova query.
3. Copie o conteúdo de `migrations/0001_initial_schema.sql`.
4. Execute a query e confirme que as tabelas, enums, função de bootstrap, bucket privado e políticas foram criados.

A migration não insere clientes, serviços, solicitações ou qualquer dado fictício. O catálogo `service_types` deve ser cadastrado com os serviços reais da DSS numa etapa posterior.

## Primeiro administrador

Depois de criar o primeiro usuário em **Authentication > Users**, o fluxo de onboarding deve chamar a função RPC `bootstrap_company(company_name, company_slug)` uma única vez para criar a empresa e o perfil `owner`. A função impede que um usuário que já tenha perfil crie outro bootstrap.

Exemplo de chamada no cliente, somente depois da migration aplicada:

```ts
const { data, error } = await supabase.rpc('bootstrap_company', {
  company_name: 'Deni Sistemas de Segurança',
  company_slug: 'dss',
})
```

A senha e o usuário são gerenciados pelo Supabase Auth. Não coloque credenciais administrativas em código ou no frontend.

## Convite e primeiro acesso

No Supabase, configure **Authentication > URL Configuration**. O **Site URL** deve ser uma URL HTTPS pública do website, nunca `localhost` para convites usados em outro computador. Em **Additional Redirect URLs**, inclua a URL pública com `/painel/primeiro-acesso` e, para desenvolvimento local, `http://localhost:3000/**`. Depois de salvar, reenvie o convite em **Authentication > Users**, porque links de convite antigos podem continuar usando o redirecionamento anterior e expiram conforme a configuração de OTP do projeto.

Ao abrir um convite válido, o Supabase cria a sessão e a rota `/painel/primeiro-acesso` permite definir a senha. A sessão é processada pelo cliente Supabase com `detectSessionInUrl` habilitado; nenhum token é persistido manualmente pela aplicação.

## Checklist e evidências de Ordens de Serviço

Para habilitar o checklist técnico e o upload privado de fotos/PDFs nas Ordens de Serviço, execute `migrations/0004_service_order_checklist_evidence.sql` no SQL Editor depois do schema inicial. A migration cria as tabelas `service_order_checklist_items` e `service_order_evidence`, o bucket privado `service-order-evidence` e as políticas RLS por `company_id`. O frontend aceita arquivos de até 10 MB e não expõe URLs públicas dos anexos.

Os formulários públicos passam pela Edge Function descrita abaixo, em vez de criarem registros anonimamente direto do navegador.

## Formulários públicos

Os formulários de orçamento, assistência e contato chamam a Edge Function `create-public-request`. Ela usa `SUPABASE_SERVICE_ROLE_KEY` somente no runtime da função, localiza a empresa pelo slug, cria ou atualiza o cliente, registra uma `service_request` com origem `public_form` e aplica honeypot e limite de frequência por hash de IP/e-mail ou telefone.

Para ativar essa integração:

1. Execute `migrations/0003_public_submission_guards.sql` no SQL Editor.
2. Confirme que o slug da empresa usado no `bootstrap_company` é `dss` ou configure `VITE_DSS_COMPANY_SLUG` no ambiente público com o slug correto.
3. Publique `functions/create-public-request/index.ts` pelo Supabase CLI ou pelo fluxo de Edge Functions do Dashboard.
4. Teste os três formulários públicos e confirme a solicitação em **Painel > Solicitações**.

O frontend usa apenas a URL e a chave anon do Supabase. A `service_role` não deve ser colocada em `.env` do frontend, no repositório ou no navegador.

## Login com Google

O login DSS inclui o botão **Continuar com Google**. Para habilitá-lo:

1. No Google Cloud Console, crie um cliente OAuth do tipo **Web application**.
2. Em **Authorized JavaScript origins**, adicione `https://dssseguranca-gvx4zvqc.manus.space`.
3. Em **Authorized redirect URIs**, copie exatamente a callback exibida na página **Authentication > Providers > Google** do projeto Supabase. Ela tem o formato `https://<project-ref>.supabase.co/auth/v1/callback`.
4. No Supabase, abra **Authentication > Providers > Google**, ative o provedor e cole o Client ID e o Client Secret diretamente no painel.
5. Em **Authentication > URL Configuration**, mantenha o Site URL como `https://dssseguranca-gvx4zvqc.manus.space` e autorize `https://dssseguranca-gvx4zvqc.manus.space/painel/primeiro-acesso`.

O Client Secret do Google nunca deve ser colocado no código, em `.env` do frontend ou enviado no chat. O Supabase conduz o OAuth e redireciona a sessão para o onboarding, que cria o perfil `owner` quando necessário.

## Envio de orçamentos por e-mail

O painel possui a Edge Function `functions/send-quote-email/index.ts`. Ela valida a sessão do usuário, consulta o orçamento respeitando o RLS, monta o HTML, envia pelo Resend, atualiza o orçamento para `sent` e grava uma atividade em `activity_logs`. A chave do Resend não é usada no frontend.

Para habilitar o envio:

1. Crie uma conta no Resend e verifique um domínio ou use um remetente de teste permitido pelo Resend.
2. No Supabase, abra **Edge Functions > Secrets** e crie `RESEND_API_KEY` com a chave do Resend.
3. Crie também `RESEND_FROM_EMAIL`, por exemplo `DSS <orcamentos@seudominio.com.br>`; durante testes pode usar o remetente permitido pelo Resend.
4. Publique a função `send-quote-email` pelo Supabase CLI ou pelo fluxo de Edge Functions do Dashboard.
5. No painel DSS, abra **Orçamentos** e use **Enviar e-mail** em um orçamento cujo cliente tenha e-mail cadastrado.

Se a função ainda não estiver publicada ou os segredos não existirem, o botão não altera o orçamento e o painel informa que o Resend precisa ser configurado. O envio atual é HTML responsivo; a página imprimível permite salvar o orçamento como PDF pelo navegador.
