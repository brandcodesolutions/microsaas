-- =====================================================
-- SCHEMA SIMPLIFICADO PARA AGENDAFACIL SALON
-- Foco na funcionalidade essencial
-- =====================================================

-- 1. LIMPAR TUDO PRIMEIRO
DROP TABLE IF EXISTS public.appointments CASCADE;
DROP TABLE IF EXISTS public.user_profiles CASCADE;
DROP TABLE IF EXISTS public.professionals CASCADE;
DROP TABLE IF EXISTS public.services CASCADE;
DROP TABLE IF EXISTS public.salons CASCADE;

-- Limpar funções e triggers existentes
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_updated_at() CASCADE;

-- 2. TABELA DE SALÕES (SIMPLIFICADA)
CREATE TABLE public.salons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. TABELA DE SERVIÇOS (SIMPLIFICADA)
CREATE TABLE public.services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id UUID REFERENCES public.salons(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  price_cents INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. TABELA DE PROFISSIONAIS (SIMPLIFICADA)
CREATE TABLE public.professionals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id UUID REFERENCES public.salons(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  specialty TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. TABELA DE PERFIS DE USUÁRIO (SIMPLIFICADA)
CREATE TABLE public.user_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  salon_id UUID REFERENCES public.salons(id),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  role TEXT DEFAULT 'admin',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. TABELA DE AGENDAMENTOS (SIMPLIFICADA)
CREATE TABLE public.appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id UUID REFERENCES public.salons(id) ON DELETE CASCADE,
  service_id UUID REFERENCES public.services(id),
  professional_id UUID REFERENCES public.professionals(id),
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  observations TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. HABILITAR RLS (SIMPLES)
ALTER TABLE public.salons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- 8. POLÍTICAS SIMPLES (PERMISSIVAS PARA FUNCIONAR)
-- Salões: qualquer um pode ver, apenas donos podem modificar
CREATE POLICY "Anyone can view salons" ON public.salons FOR SELECT USING (true);
CREATE POLICY "Users can manage own salon" ON public.salons FOR ALL USING (id IN (SELECT salon_id FROM public.user_profiles WHERE id = auth.uid()));

-- Serviços: qualquer um pode ver, apenas donos do salão podem modificar
CREATE POLICY "Anyone can view services" ON public.services FOR SELECT USING (true);
CREATE POLICY "Salon owners can manage services" ON public.services FOR ALL USING (salon_id IN (SELECT salon_id FROM public.user_profiles WHERE id = auth.uid()));

-- Profissionais: qualquer um pode ver, apenas donos do salão podem modificar
CREATE POLICY "Anyone can view professionals" ON public.professionals FOR SELECT USING (true);
CREATE POLICY "Salon owners can manage professionals" ON public.professionals FOR ALL USING (salon_id IN (SELECT salon_id FROM public.user_profiles WHERE id = auth.uid()));

-- Perfis: usuários podem ver e gerenciar próprio perfil
CREATE POLICY "Users can view own profile" ON public.user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.user_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.user_profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Agendamentos: qualquer um pode criar, donos do salão podem ver todos
CREATE POLICY "Anyone can create appointments" ON public.appointments FOR INSERT WITH CHECK (true);
CREATE POLICY "Salon owners can view appointments" ON public.appointments FOR SELECT USING (salon_id IN (SELECT salon_id FROM public.user_profiles WHERE id = auth.uid()));
CREATE POLICY "Salon owners can manage appointments" ON public.appointments FOR ALL USING (salon_id IN (SELECT salon_id FROM public.user_profiles WHERE id = auth.uid()));

-- 9. FUNÇÃO SIMPLES PARA CRIAR PERFIL AUTOMATICAMENTE
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  salon_uuid UUID;
BEGIN
  -- Criar salão padrão para o usuário
  INSERT INTO public.salons (name, email)
  VALUES (
    COALESCE(NEW.raw_user_meta_data->>'name', 'Meu Salão') || ' - Salão',
    NEW.email
  )
  RETURNING id INTO salon_uuid;
  
  -- Criar perfil do usuário
  INSERT INTO public.user_profiles (id, salon_id, name, email, phone)
  VALUES (
    NEW.id,
    salon_uuid,
    COALESCE(NEW.raw_user_meta_data->>'name', 'Usuário'),
    NEW.email,
    NEW.raw_user_meta_data->>'phone'
  );
  
  -- Criar serviços padrão
  INSERT INTO public.services (salon_id, name, duration_minutes, price_cents) VALUES
  (salon_uuid, 'Corte de Cabelo', 60, 5000),
  (salon_uuid, 'Escova', 45, 4000),
  (salon_uuid, 'Manicure', 45, 2500);
  
  -- Criar profissional padrão
  INSERT INTO public.professionals (salon_id, name, specialty) VALUES
  (salon_uuid, COALESCE(NEW.raw_user_meta_data->>'name', 'Profissional'), 'Geral');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. TRIGGER PARA EXECUTAR A FUNÇÃO
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 11. DADOS DE TESTE (SALÃO PÚBLICO)
INSERT INTO public.salons (id, name, email, phone, address) VALUES
('00000000-0000-0000-0000-000000000001', 'Salão Beleza Total', 'contato@belezatotal.com', '(11) 3333-4444', 'Rua das Flores, 123');

INSERT INTO public.services (salon_id, name, duration_minutes, price_cents) VALUES
('00000000-0000-0000-0000-000000000001', 'Corte Feminino', 60, 5000),
('00000000-0000-0000-0000-000000000001', 'Corte Masculino', 30, 3000),
('00000000-0000-0000-0000-000000000001', 'Escova', 45, 4000),
('00000000-0000-0000-0000-000000000001', 'Coloração', 120, 12000),
('00000000-0000-0000-0000-000000000001', 'Manicure', 45, 2500);

INSERT INTO public.professionals (salon_id, name, specialty) VALUES
('00000000-0000-0000-0000-000000000001', 'Ana Silva', 'Cabelo'),
('00000000-0000-0000-0000-000000000001', 'Carlos Santos', 'Barba'),
('00000000-0000-0000-0000-000000000001', 'Maria Oliveira', 'Unhas');

-- =====================================================
-- CONCLUÍDO! SCHEMA SIMPLIFICADO CRIADO
-- =====================================================
-- Este schema foca na funcionalidade essencial:
-- ✅ Estrutura simples e direta
-- ✅ Políticas permissivas para funcionar
-- ✅ Criação automática de salão para novos usuários
-- ✅ Dados de teste incluídos
-- ✅ Sem complexidades desnecessárias
-- =====================================================