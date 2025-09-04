-- Script simplificado para corrigir a tabela salons
-- Execute este script no SQL Editor do Supabase

-- Adicionar a coluna owner_id à tabela salons
ALTER TABLE public.salons 
ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id);

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_salons_owner_id ON public.salons(owner_id);

-- Habilitar RLS
ALTER TABLE public.salons ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes se houver
DROP POLICY IF EXISTS "salon_owners_select" ON public.salons;
DROP POLICY IF EXISTS "salon_owners_insert" ON public.salons;
DROP POLICY IF EXISTS "salon_owners_update" ON public.salons;
DROP POLICY IF EXISTS "salon_owners_delete" ON public.salons;

-- Criar políticas RLS
CREATE POLICY salon_owners_select ON public.salons
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY salon_owners_insert ON public.salons
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY salon_owners_update ON public.salons
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY salon_owners_delete ON public.salons
  FOR DELETE USING (auth.uid() = owner_id);