# Correção do Erro PGRST204 - Tabela Appointments

## Problema Identificado
O erro `PGRST204: Could not find the 'notes' column of 'appointments' in the schema cache` indica que o schema da tabela `appointments` no Supabase não está sincronizado com o código.

## Causa
O schema atual no Supabase (arquivo `supabase-schema.sql`) não possui as colunas `duration_minutes` e `total_price` que o código está tentando usar.

## Solução

### Passo 1: Executar Script de Verificação
1. Acesse o **SQL Editor** no painel do Supabase
2. Execute o conteúdo do arquivo `check_appointments_schema.sql` para verificar as colunas atuais

### Passo 2: Atualizar Schema
1. No **SQL Editor** do Supabase, execute o conteúdo do arquivo `update_appointments_table.sql`
2. Este script irá adicionar as colunas faltantes:
   - `duration_minutes INTEGER`
   - `total_price DECIMAL(10,2)`

### Passo 3: Verificar Correção
Após executar o script, teste novamente a criação de agendamento na página pública.

## Arquivos Criados
- `check_appointments_schema.sql` - Para verificar o schema atual
- `update_appointments_table.sql` - Para corrigir o schema

## Alternativa
Se preferir, você pode executar o arquivo `create_appointments_table.sql` completo, que já contém a estrutura correta da tabela.