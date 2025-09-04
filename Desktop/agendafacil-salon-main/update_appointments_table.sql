-- Script para atualizar a tabela appointments com as colunas faltantes
-- Execute este script no SQL Editor do Supabase

-- Adicionar colunas que podem estar faltando
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS duration_minutes INTEGER;

ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS total_price DECIMAL(10,2);

-- Verificar se as colunas foram adicionadas
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'appointments' 
  AND table_schema = 'public'
  AND column_name IN ('notes', 'duration_minutes', 'total_price')
ORDER BY column_name;