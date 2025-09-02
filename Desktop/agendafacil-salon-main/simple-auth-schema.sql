-- Estrutura SQL Simplificada para Sistema de Autenticação
-- AgendaFácil Salon - Versão Simplificada

-- 1. Tabela de usuários (usando auth.users do Supabase)
-- O Supabase já gerencia esta tabela automaticamente

-- 2. Tabela de perfis de usuário simplificada
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  user_type TEXT NOT NULL DEFAULT 'client' CHECK (user_type IN ('client', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabela de salões simplificada
CREATE TABLE IF NOT EXISTS public.salons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  email TEXT,
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tabela de serviços simplificada
CREATE TABLE IF NOT EXISTS public.services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id UUID REFERENCES public.salons(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  duration INTEGER NOT NULL, -- em minutos
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Tabela de agendamentos simplificada
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  salon_id UUID REFERENCES public.salons(id) ON DELETE CASCADE,
  service_id UUID REFERENCES public.services(id) ON DELETE CASCADE,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Políticas de segurança RLS (Row Level Security)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Políticas para profiles
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Políticas para salons
CREATE POLICY "Anyone can view salons" ON public.salons
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Owners can manage their salons" ON public.salons
  FOR ALL USING (auth.uid() = owner_id);

-- Políticas para services
CREATE POLICY "Anyone can view services" ON public.services
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Salon owners can manage services" ON public.services
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.salons 
      WHERE salons.id = services.salon_id 
      AND salons.owner_id = auth.uid()
    )
  );

-- Políticas para appointments
CREATE POLICY "Users can view own appointments" ON public.appointments
  FOR SELECT USING (
    auth.uid() = client_id OR 
    EXISTS (
      SELECT 1 FROM public.salons 
      WHERE salons.id = appointments.salon_id 
      AND salons.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can create appointments" ON public.appointments
  FOR INSERT WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Users can update own appointments" ON public.appointments
  FOR UPDATE USING (
    auth.uid() = client_id OR 
    EXISTS (
      SELECT 1 FROM public.salons 
      WHERE salons.id = appointments.salon_id 
      AND salons.owner_id = auth.uid()
    )
  );

-- Trigger para criar perfil automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'name', 'Usuário'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger que executa quando um novo usuário é criado
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Inserir dados de exemplo
INSERT INTO public.salons (name, address, phone, email) VALUES
('Salão Beleza Total', 'Rua das Flores, 123', '(11) 99999-9999', 'contato@belezatotal.com'),
('Studio Hair', 'Av. Principal, 456', '(11) 88888-8888', 'info@studiohair.com');

INSERT INTO public.services (salon_id, name, description, price, duration) VALUES
((SELECT id FROM public.salons WHERE name = 'Salão Beleza Total'), 'Corte Feminino', 'Corte de cabelo feminino', 50.00, 60),
((SELECT id FROM public.salons WHERE name = 'Salão Beleza Total'), 'Escova', 'Escova modeladora', 30.00, 45),
((SELECT id FROM public.salons WHERE name = 'Studio Hair'), 'Corte Masculino', 'Corte de cabelo masculino', 25.00, 30),
((SELECT id FROM public.salons WHERE name = 'Studio Hair'), 'Barba', 'Corte e modelagem de barba', 20.00, 20);