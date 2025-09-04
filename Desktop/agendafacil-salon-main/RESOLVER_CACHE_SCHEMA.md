# Resolver Problema de Cache do Schema - PGRST204

## Problema
O erro `PGRST204: Could not find the 'notes' column of 'appointments' in the schema cache` persiste mesmo após adicionar as colunas. Isso indica que o cache do schema do PostgREST (usado pelo Supabase) não foi atualizado.

## Soluções (Execute em ordem)

### Solução 1: Forçar Reload do Schema Cache
1. Acesse o **SQL Editor** no Supabase
2. Execute o comando:
```sql
NOTIFY pgrst, 'reload schema';
```
3. Aguarde alguns segundos e teste novamente

### Solução 2: Verificar Schema Atual
Execute o script `refresh_schema_cache.sql` completo para:
- Forçar reload do cache
- Verificar se as colunas existem
- Verificar se a tabela existe

### Solução 3: Reiniciar Conexão Supabase
1. No painel do Supabase, vá em **Settings > Database**
2. Clique em **Restart** para reiniciar o banco
3. Aguarde alguns minutos e teste novamente

### Solução 4: Recriar Tabela (Última opção)
Se as soluções anteriores não funcionarem:
1. Descomente a seção final do `refresh_schema_cache.sql`
2. Execute para recriar completamente a tabela
3. **ATENÇÃO**: Isso apagará todos os dados existentes

## Verificação
Após cada solução, teste criando um agendamento na página pública.

## Causa Provável
O PostgREST mantém um cache do schema que não é automaticamente atualizado quando colunas são adicionadas via ALTER TABLE.