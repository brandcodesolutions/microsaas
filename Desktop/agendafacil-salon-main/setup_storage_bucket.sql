-- Script para configurar o bucket salon-assets no Supabase Storage
-- Execute este script no SQL Editor do Supabase Dashboard

-- 1. Criar o bucket salon-assets se não existir
INSERT INTO storage.buckets (id, name, public)
VALUES ('salon-assets', 'salon-assets', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Política para permitir leitura pública de todos os arquivos
CREATE POLICY "Public read access for salon assets" ON storage.objects
FOR SELECT USING (bucket_id = 'salon-assets');

-- 3. Política para permitir upload de arquivos por usuários autenticados
CREATE POLICY "Authenticated users can upload salon assets" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'salon-assets' AND 
  auth.role() = 'authenticated'
);

-- 4. Política para permitir atualização de arquivos por usuários autenticados
CREATE POLICY "Authenticated users can update salon assets" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'salon-assets' AND 
  auth.role() = 'authenticated'
) WITH CHECK (
  bucket_id = 'salon-assets' AND 
  auth.role() = 'authenticated'
);

-- 5. Política para permitir exclusão de arquivos por usuários autenticados
CREATE POLICY "Authenticated users can delete salon assets" ON storage.objects
FOR DELETE USING (
  bucket_id = 'salon-assets' AND 
  auth.role() = 'authenticated'
);

-- Verificar se o bucket foi criado corretamente
SELECT * FROM storage.buckets WHERE id = 'salon-assets';

-- Verificar as políticas criadas
SELECT * FROM pg_policies WHERE tablename = 'objects' AND policyname LIKE '%salon%';