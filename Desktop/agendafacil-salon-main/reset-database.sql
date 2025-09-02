-- Script para Limpar Completamente o Banco de Dados Supabase
-- Execute este script ANTES de rodar o simple-auth-schema.sql
-- ⚠️ ATENÇÃO: Este script irá DELETAR TODOS OS DADOS!

-- ✅ VERSÃO SEGURA - Ignora erros se tabelas não existirem

-- 1. Remover triggers existentes
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. Remover funções
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 3. Remover políticas RLS apenas se as tabelas existirem
DO $$ 
BEGIN
    -- Políticas para profiles
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
        DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
        DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
        DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
    END IF;
    
    -- Políticas para salons
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'salons') THEN
        DROP POLICY IF EXISTS "Anyone can view salons" ON public.salons;
        DROP POLICY IF EXISTS "Owners can manage their salons" ON public.salons;
    END IF;
    
    -- Políticas para services
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'services') THEN
        DROP POLICY IF EXISTS "Anyone can view services" ON public.services;
        DROP POLICY IF EXISTS "Salon owners can manage services" ON public.services;
    END IF;
    
    -- Políticas para appointments
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'appointments') THEN
        DROP POLICY IF EXISTS "Users can view own appointments" ON public.appointments;
        DROP POLICY IF EXISTS "Users can create appointments" ON public.appointments;
        DROP POLICY IF EXISTS "Users can update own appointments" ON public.appointments;
    END IF;
END $$;

-- 4. Remover tabelas na ordem correta (respeitando foreign keys)
DROP TABLE IF EXISTS public.appointments CASCADE;
DROP TABLE IF EXISTS public.services CASCADE;
DROP TABLE IF EXISTS public.professionals CASCADE;
DROP TABLE IF EXISTS public.salons CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 5. Remover outras tabelas que possam existir de versões anteriores
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.salon_services CASCADE;
DROP TABLE IF EXISTS public.salon_professionals CASCADE;
DROP TABLE IF EXISTS public.appointment_services CASCADE;

-- 6. Limpar dados de autenticação (CUIDADO: isso remove todos os usuários!)
-- Descomente as linhas abaixo APENAS se quiser remover todos os usuários também
-- DELETE FROM auth.users;
-- DELETE FROM auth.identities;
-- DELETE FROM auth.sessions;
-- DELETE FROM auth.refresh_tokens;

-- ✅ Banco limpo! Agora execute o simple-auth-schema.sql
-- Mensagem de confirmação
SELECT 'Banco de dados limpo com sucesso! Execute agora o simple-auth-schema.sql' as status;