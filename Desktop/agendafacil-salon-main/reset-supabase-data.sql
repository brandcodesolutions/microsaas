-- =====================================================
-- SCRIPT PARA RESETAR TODOS OS DADOS DO SUPABASE
-- Use este script para limpar completamente o banco
-- e permitir reutilizar emails em novos testes
-- =====================================================

-- ATENÇÃO: Este script irá deletar TODOS os dados!
-- Execute apenas em ambiente de desenvolvimento/teste

-- 1. Desabilitar RLS temporariamente para permitir limpeza
ALTER TABLE public.appointments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.professionals DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.services DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.salons DISABLE ROW LEVEL SECURITY;

-- 2. Limpar todas as tabelas públicas (em ordem de dependência)
DELETE FROM public.appointments;
DELETE FROM public.user_profiles;
DELETE FROM public.professionals;
DELETE FROM public.services;
DELETE FROM public.salons;

-- 3. Limpar usuários da tabela auth (CUIDADO: Isso remove todos os usuários!)
-- Nota: Você precisa ter permissões de superusuário para isso
-- Se não funcionar, você pode deletar manualmente no Dashboard do Supabase
DELETE FROM auth.users;

-- 4. Reabilitar RLS
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salons ENABLE ROW LEVEL SECURITY;

-- 5. Recriar dados iniciais (salão padrão)
INSERT INTO public.salons (slug, name, email, phone, address, description) VALUES
('default', 'Salão Beleza Total', 'contato@belezatotal.com', '(11) 3333-4444', 'Rua das Flores, 123 - Centro', 'Salão de beleza completo com os melhores profissionais da região.');

-- Obter ID do salão padrão e inserir dados iniciais
DO $$
DECLARE
  salon_uuid UUID;
BEGIN
  SELECT id INTO salon_uuid FROM public.salons WHERE slug = 'default';
  
  -- Inserir serviços padrão
  INSERT INTO public.services (salon_id, name, description, duration_minutes, price_cents) VALUES
  (salon_uuid, 'Corte Feminino', 'Corte de cabelo feminino com lavagem e finalização', 60, 5000),
  (salon_uuid, 'Corte Masculino', 'Corte de cabelo masculino tradicional', 30, 3000),
  (salon_uuid, 'Escova', 'Escova modeladora com produtos profissionais', 45, 4000),
  (salon_uuid, 'Coloração', 'Coloração completa com produtos de qualidade', 120, 12000),
  (salon_uuid, 'Manicure', 'Cuidados completos para as unhas das mãos', 45, 2500),
  (salon_uuid, 'Pedicure', 'Cuidados completos para as unhas dos pés', 60, 3000);
  
  -- Inserir profissionais padrão
  INSERT INTO public.professionals (salon_id, name, specialty, email, phone) VALUES
  (salon_uuid, 'Ana Silva', 'Cabelo', 'ana@belezatotal.com', '(11) 99999-0001'),
  (salon_uuid, 'Carlos Santos', 'Barba e Cabelo', 'carlos@belezatotal.com', '(11) 99999-0002'),
  (salon_uuid, 'Maria Oliveira', 'Unhas', 'maria@belezatotal.com', '(11) 99999-0003'),
  (salon_uuid, 'João Costa', 'Coloração', 'joao@belezatotal.com', '(11) 99999-0004');
END $$;

-- =====================================================
-- CONCLUÍDO!
-- =====================================================
-- Todos os dados foram limpos e você pode:
-- 1. Reutilizar os mesmos emails para novos cadastros
-- 2. Fazer novos testes sem conflitos
-- 3. O salão padrão foi recriado com dados iniciais
-- =====================================================

-- INSTRUÇÕES DE USO:
-- 1. Copie todo este conteúdo
-- 2. Vá para o Supabase Dashboard > SQL Editor
-- 3. Cole o script e execute
-- 4. Aguarde a conclusão
-- 5. Agora você pode usar os mesmos emails novamente!