-- Script para adicionar campo 'hidden' na tabela appointments
-- Execute este script no SQL Editor do Supabase

-- Adicionar coluna hidden para ocultar agendamentos da visualização
-- sem perder os dados para o financeiro
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS hidden BOOLEAN DEFAULT FALSE;

-- Criar índice para melhorar performance das consultas
CREATE INDEX IF NOT EXISTS idx_appointments_hidden 
ON public.appointments(hidden) 
WHERE hidden IS NOT TRUE;

-- Verificar se a coluna foi adicionada
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'appointments' 
  AND table_schema = 'public'
  AND column_name = 'hidden';