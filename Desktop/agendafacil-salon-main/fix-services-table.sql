-- Script para corrigir a tabela services
-- Execute este script no SQL Editor do Supabase

-- Adicionar a coluna price à tabela services se não existir
ALTER TABLE public.services 
ADD COLUMN IF NOT EXISTS price DECIMAL(10,2);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_services_salon_id ON public.services(salon_id);
CREATE INDEX IF NOT EXISTS idx_services_price ON public.services(price);

-- Remover políticas existentes se houver
DROP POLICY IF EXISTS "Anyone can view services" ON public.services;
DROP POLICY IF EXISTS "salon_owners_services_select" ON public.services;
DROP POLICY IF EXISTS "salon_owners_services_insert" ON public.services;
DROP POLICY IF EXISTS "salon_owners_services_update" ON public.services;
DROP POLICY IF EXISTS "salon_owners_services_delete" ON public.services;

-- Criar políticas RLS para services (usando IF NOT EXISTS para evitar conflitos)
-- Qualquer pessoa pode visualizar serviços (para agendamento público)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'services' AND policyname = 'services_public_select') THEN
    CREATE POLICY services_public_select ON public.services
      FOR SELECT USING (true);
  END IF;
END $$;

-- Apenas proprietários do salão podem inserir serviços
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'services' AND policyname = 'services_owners_insert') THEN
    CREATE POLICY services_owners_insert ON public.services
      FOR INSERT WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.salons 
          WHERE salons.id = services.salon_id 
          AND salons.owner_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Apenas proprietários do salão podem atualizar serviços
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'services' AND policyname = 'services_owners_update') THEN
    CREATE POLICY services_owners_update ON public.services
      FOR UPDATE USING (
        EXISTS (
          SELECT 1 FROM public.salons 
          WHERE salons.id = services.salon_id 
          AND salons.owner_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Apenas proprietários do salão podem excluir serviços
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'services' AND policyname = 'services_owners_delete') THEN
    CREATE POLICY services_owners_delete ON public.services
      FOR DELETE USING (
        EXISTS (
          SELECT 1 FROM public.salons 
          WHERE salons.id = services.salon_id 
          AND salons.owner_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Garantir que RLS está habilitado
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;