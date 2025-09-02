# 🚀 GUIA COMPLETO: Como Executar o Script SQL no Supabase

## ⚠️ PROBLEMA IDENTIFICADO
O agendamento não funciona porque **as tabelas ainda não foram criadas no Supabase**.

## 📋 PASSO A PASSO DETALHADO

### 1. Acesse o Supabase Dashboard
- Vá para: https://supabase.com/dashboard
- Faça login na sua conta
- Selecione o projeto: **ofpuhlkkvzrxidqkwvyp**

### 2. Abra o SQL Editor
- No menu lateral esquerdo, clique em **"SQL Editor"**
- Ou acesse diretamente: https://supabase.com/dashboard/project/ofpuhlkkvzrxidqkwvyp/sql

### 3. Execute o Script
- Clique em **"New Query"** (Nova Consulta)
- **COPIE TODO O CONTEÚDO** do arquivo `supabase-schema.sql`
- **COLE** no editor SQL
- Clique em **"Run"** (Executar) ou pressione **Ctrl+Enter**

### 4. Verificar se Funcionou
Após executar, você deve ver:
- ✅ Mensagens de sucesso (sem erros vermelhos)
- ✅ Tabelas criadas: `user_profiles` e `appointments`

### 5. Verificar as Tabelas
- Vá para **"Table Editor"** no menu lateral
- Você deve ver as tabelas:
  - `appointments` (agendamentos)
  - `user_profiles` (perfis de usuário)

## 🔍 COMO VERIFICAR SE DEU CERTO

### Opção 1: Pelo Dashboard
1. Vá em **Table Editor**
2. Clique na tabela `appointments`
3. Você deve ver as colunas:
   - `id`, `user_id`, `client_name`, `client_email`, `client_phone`
   - `service`, `professional`, `appointment_date`, `appointment_time`
   - `observations`, `status`, `created_at`, `updated_at`

### Opção 2: Teste Direto
1. Abra o arquivo: `test-supabase-direct.html`
2. Clique em **"Testar Conexão"**
3. Deve mostrar: ✅ Conexão OK!
4. Clique em **"Testar Inserção"**
5. Deve mostrar: ✅ Agendamento criado com sucesso!

## 🚨 SE DER ERRO

### Erro: "relation 'appointments' does not exist"
- **Causa**: Script não foi executado
- **Solução**: Execute o script `supabase-schema.sql` novamente

### Erro: "permission denied"
- **Causa**: Problemas de permissão
- **Solução**: Verifique se está logado no projeto correto

### Erro: "syntax error"
- **Causa**: Script copiado incorretamente
- **Solução**: Copie novamente TODO o conteúdo do arquivo

## 📞 CONTEÚDO DO SCRIPT
O arquivo `supabase-schema.sql` contém:
- ✅ Criação das tabelas `user_profiles` e `appointments`
- ✅ Configuração de segurança (RLS)
- ✅ Políticas de acesso
- ✅ Triggers automáticos
- ✅ Índices para performance

## 🎯 APÓS EXECUTAR O SCRIPT
1. Teste o agendamento em: http://localhost:8081/agendamento/default
2. Preencha o formulário
3. Clique em "Agendar"
4. Deve mostrar: ✅ "Agendamento realizado!"

---

**💡 DICA**: Se ainda não funcionar após executar o script, use o arquivo `test-supabase-direct.html` para diagnosticar o problema específico.