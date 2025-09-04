-- Script para corrigir a constraint de status da tabela appointments

-- 1. Primeiro, remover a constraint existente se ela existir
ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_status_check;

-- 2. Adicionar a nova constraint com os valores corretos
ALTER TABLE appointments 
ADD CONSTRAINT appointments_status_check 
CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show'));

-- 3. Verificar se a constraint foi criada corretamente
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conname = 'appointments_status_check';

-- 4. Testar inserção com status 'scheduled'
SELECT 'Constraint corrigida com sucesso!' as resultado;