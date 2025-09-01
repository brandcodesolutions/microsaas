# 🚀 Configuração do Supabase - AgendaFácil Salon

## ✅ Passo a Passo para Conectar com o Supabase

### 1. **Criar Conta no Supabase**
- Acesse: https://supabase.com
- Clique em "Start your project"
- Faça login com GitHub, Google ou email

### 2. **Criar Novo Projeto**
- No dashboard, clique em "New Project"
- Escolha sua organização
- Preencha:
  - **Name**: `agendafacil-salon` (ou nome de sua preferência)
  - **Database Password**: Crie uma senha forte e **ANOTE**
  - **Region**: Escolha a mais próxima (ex: South America)
- Clique em "Create new project"
- ⏳ Aguarde 2-3 minutos para o projeto ser criado

### 3. **Obter Credenciais de Conexão**
- No seu projeto, vá em **Settings** → **API**
- Copie as seguintes informações:

#### 📋 **Project URL**
```
URL: https://seu-projeto-id.supabase.co
```

#### 🔑 **API Keys**
```
anon/public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4. **Configurar o Arquivo .env**
- Abra o arquivo `.env` na raiz do projeto
- Substitua os valores:

```env
# Substitua pelos seus valores reais
VITE_SUPABASE_URL=https://seu-projeto-id-real.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-real-aqui
```

### 5. **Criar as Tabelas no Banco**
- No Supabase Dashboard, vá em **SQL Editor**
- Copie todo o conteúdo do arquivo `supabase-schema.sql`
- Cole no editor SQL e clique em **Run**
- ✅ Verifique se as tabelas foram criadas em **Table Editor**

### 6. **Testar a Conexão**
- Salve o arquivo `.env`
- O servidor de desenvolvimento deve reiniciar automaticamente
- Acesse: http://localhost:8081
- Se não houver erros no console, a conexão está funcionando! 🎉

---

## 🔧 **Resolução de Problemas**

### ❌ **Erro: "Invalid URL"**
- Verifique se a `VITE_SUPABASE_URL` está no formato correto
- Deve começar com `https://` e terminar com `.supabase.co`

### ❌ **Erro: "Invalid API Key"**
- Verifique se copiou a chave `anon/public` (não a `service_role`)
- A chave deve começar com `eyJhbGciOiJIUzI1NiI...`

### ❌ **Erro: "Missing environment variables"**
- Certifique-se que o arquivo `.env` está na raiz do projeto
- Reinicie o servidor de desenvolvimento (`Ctrl+C` e `npm run dev`)

---

## 📚 **Próximos Passos**

Após a configuração:
1. ✅ Teste o registro de usuário
2. ✅ Teste o login
3. ✅ Teste o agendamento
4. ✅ Verifique os dados no Supabase Dashboard

**🎯 Sua aplicação estará totalmente funcional com banco de dados na nuvem!**