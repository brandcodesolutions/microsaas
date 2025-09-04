# Corrigir Erro de Constraint de Status

## Problema
O erro `23514` indica que o valor `'scheduled'` não é aceito pela constraint `appointments_status_check` da tabela `appointments`.

## Solução

### Passo 1: Executar Script no Supabase

1. **Acesse o Supabase Dashboard**
2. **Vá para SQL Editor**
3. **Execute o arquivo:** `fix_status_constraint.sql`

**OU copie e cole este código:**

```sql
-- Remover constraint existente
ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_status_check;

-- Adicionar nova constraint com valores corretos
ALTER TABLE appointments 
ADD CONSTRAINT appointments_status_check 
CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show'));

-- Verificar se funcionou
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conname = 'appointments_status_check';
```

### Passo 2: Testar

Após executar o script:
1. Volte para a aplicação
2. Tente criar um agendamento
3. O erro deve ser resolvido

## Valores de Status Permitidos

Após a correção, os seguintes valores serão aceitos:
- `'scheduled'` - Agendado
- `'confirmed'` - Confirmado
- `'completed'` - Concluído
- `'cancelled'` - Cancelado
- `'no_show'` - Não compareceu

## Verificação

Para verificar se a constraint foi aplicada corretamente, execute:

```sql
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conname = 'appointments_status_check';
```

O resultado deve mostrar a constraint com os valores corretos.