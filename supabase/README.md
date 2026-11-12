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

## Próximos passos

Após aplicar a migration, a próxima entrega pode conectar o cadastro real de serviços, clientes e solicitações ao painel. Os formulários públicos devem passar por uma Edge Function ou outra camada de proteção antes de criar registros anonimamente, para que rate limiting e antispam não dependam apenas do navegador.

## Login com Google

O login DSS inclui o botão **Continuar com Google**. Para habilitá-lo:

1. No Google Cloud Console, crie um cliente OAuth do tipo **Web application**.
2. Em **Authorized JavaScript origins**, adicione `https://dssseguranca-gvx4zvqc.manus.space`.
3. Em **Authorized redirect URIs**, copie exatamente a callback exibida na página **Authentication > Providers > Google** do projeto Supabase. Ela tem o formato `https://<project-ref>.supabase.co/auth/v1/callback`.
4. No Supabase, abra **Authentication > Providers > Google**, ative o provedor e cole o Client ID e o Client Secret diretamente no painel.
5. Em **Authentication > URL Configuration**, mantenha o Site URL como `https://dssseguranca-gvx4zvqc.manus.space` e autorize `https://dssseguranca-gvx4zvqc.manus.space/painel/primeiro-acesso`.

O Client Secret do Google nunca deve ser colocado no código, em `.env` do frontend ou enviado no chat. O Supabase conduz o OAuth e redireciona a sessão para o onboarding, que cria o perfil `owner` quando necessário.
