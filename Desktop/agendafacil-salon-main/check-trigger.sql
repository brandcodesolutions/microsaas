-- Script para verificar se o trigger handle_new_user está funcionando
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar se a função handle_new_user existe
SELECT 
    routine_name,
    routine_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user' 
    AND routine_schema = 'public';

-- 2. Verificar se o trigger on_auth_user_created existe
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    trigger_schema
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- 3. Verificar quantos perfis existem na tabela profiles
SELECT COUNT(*) as total_profiles FROM public.profiles;

-- 4. Verificar quantos usuários existem na tabela auth.users
SELECT COUNT(*) as total_users FROM auth.users;

-- 5. Verificar se há usuários sem perfil correspondente
SELECT 
    u.id,
    u.email,
    u.created_at as user_created,
    p.id as profile_id
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL;

-- 6. Se necessário, criar perfis manualmente para usuários existentes
-- (Descomente as linhas abaixo se houver usuários sem perfil)

/*
INSERT INTO public.profiles (id, email, name, user_type)
SELECT 
    u.id,
    u.email,
    COALESCE(u.raw_user_meta_data->>'name', 'Usuário') as name,
    'client' as user_type
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL;
*/

-- 7. Verificar se os perfis foram criados corretamente
SELECT 
    p.id,
    p.email,
    p.name,
    p.user_type,
    p.created_at
FROM public.profiles p
ORDER BY p.created_at DESC;