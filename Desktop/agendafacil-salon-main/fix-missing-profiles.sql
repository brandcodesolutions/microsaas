-- Script para corrigir perfis ausentes
-- Execute este script no SQL Editor do Supabase se houver usuários sem perfil

-- 1. Primeiro, vamos recriar a função handle_new_user (caso tenha sido perdida)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, user_type)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'name', 'Usuário'),
    'client'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Recriar o trigger (caso tenha sido perdido)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Criar perfis para usuários existentes que não têm perfil
INSERT INTO public.profiles (id, email, name, user_type)
SELECT 
    u.id,
    u.email,
    COALESCE(u.raw_user_meta_data->>'name', 'Usuário') as name,
    'client' as user_type
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- 4. Verificar se todos os usuários agora têm perfil
SELECT 
    'Usuários sem perfil:' as status,
    COUNT(*) as quantidade
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL

UNION ALL

SELECT 
    'Total de usuários:' as status,
    COUNT(*) as quantidade
FROM auth.users

UNION ALL

SELECT 
    'Total de perfis:' as status,
    COUNT(*) as quantidade
FROM public.profiles;

-- 5. Mostrar todos os perfis criados
SELECT 
    p.id,
    p.email,
    p.name,
    p.user_type,
    p.created_at
FROM public.profiles p
ORDER BY p.created_at DESC;