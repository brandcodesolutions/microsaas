-- Script para adicionar a coluna owner_id à tabela salons
-- Execute este script no SQL Editor do Supabase se a tabela salons já existir sem a coluna owner_id

-- Adicionar a coluna owner_id à tabela salons
ALTER TABLE public.salons 
ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id);

-- Tornar a coluna obrigatória (opcional, apenas se necessário)
-- ALTER TABLE public.salons 
-- ALTER COLUMN owner_id SET NOT NULL;

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_salons_owner_id ON public.salons(owner_id);

-- Habilitar RLS se ainda não estiver habilitado
ALTER TABLE public.salons ENABLE ROW LEVEL SECURITY;

-- Política para permitir que proprietários vejam seus próprios salões
CREATE POLICY IF NOT EXISTS "salon_owners_select" ON public.salons
  FOR SELECT USING (auth.uid() = owner_id);

-- Política para permitir que proprietários insiram salões
CREATE POLICY IF NOT EXISTS "salon_owners_insert" ON public.salons
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- Política para permitir que proprietários atualizem seus salões
CREATE POLICY IF NOT EXISTS "salon_owners_update" ON public.salons
  FOR UPDATE USING (auth.uid() = owner_id);

-- Política para permitir que proprietários excluam seus salões
CREATE POLICY IF NOT EXISTS "salon_owners_delete" ON public.salons
  FOR DELETE USING (auth.uid() = owner_id);