-- =====================================================
-- ESQUEMA SUPABASE V2 - AGENDAFÁCIL SALON
-- Versão redesenhada para resolver problemas de estrutura
-- =====================================================

-- Limpar tabelas existentes (se houver)
DROP TABLE IF EXISTS public.appointments CASCADE;
DROP TABLE IF EXISTS public.user_profiles CASCADE;
DROP TABLE IF EXISTS public.salons CASCADE;
DROP TABLE IF EXISTS public.services CASCADE;
DROP TABLE IF EXISTS public.professionals CASCADE;

-- =====================================================
-- 1. TABELA DE SALÕES
-- =====================================================
CREATE TABLE public.salons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL, -- Para URLs amigáveis (ex: 'default', 'salon-beleza')
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  description TEXT,
  business_hours JSONB DEFAULT '{"monday": "9:00-18:00", "tuesday": "9:00-18:00", "wednesday": "9:00-18:00", "thursday": "9:00-18:00", "friday": "9:00-18:00", "saturday": "9:00-17:00", "sunday": "closed"}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 2. TABELA DE SERVIÇOS
-- =====================================================
CREATE TABLE public.services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id UUID REFERENCES public.salons(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  price_cents INTEGER NOT NULL DEFAULT 0, -- Preço em centavos para evitar problemas de float
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. TABELA DE PROFISSIONAIS
-- =====================================================
CREATE TABLE public.professionals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id UUID REFERENCES public.salons(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  specialty TEXT,
  email TEXT,
  phone TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 4. TABELA DE PERFIS DE USUÁRIO
-- =====================================================
CREATE TABLE public.user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  salon_id UUID REFERENCES public.salons(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  role TEXT DEFAULT 'client' CHECK (role IN ('client', 'admin', 'professional')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 5. TABELA DE AGENDAMENTOS (REDESENHADA)
-- =====================================================
CREATE TABLE public.appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Referências
  salon_id UUID REFERENCES public.salons(id) ON DELETE CASCADE NOT NULL,
  service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
  professional_id UUID REFERENCES public.professionals(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Opcional para agendamentos públicos
  
  -- Dados do cliente (sempre preenchidos, mesmo para usuários autenticados)
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  
  -- Dados do agendamento
  service_name TEXT NOT NULL, -- Nome do serviço no momento do agendamento
  professional_name TEXT, -- Nome do profissional no momento do agendamento
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  price_cents INTEGER DEFAULT 0,
  
  -- Informações adicionais
  observations TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')),
  
  -- Metadados
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancellation_reason TEXT
);

-- =====================================================
-- 6. ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices para salons
CREATE INDEX idx_salons_slug ON public.salons(slug);
CREATE INDEX idx_salons_active ON public.salons(is_active);

-- Índices para services
CREATE INDEX idx_services_salon_id ON public.services(salon_id);
CREATE INDEX idx_services_active ON public.services(salon_id, is_active);

-- Índices para professionals
CREATE INDEX idx_professionals_salon_id ON public.professionals(salon_id);
CREATE INDEX idx_professionals_active ON public.professionals(salon_id, is_active);

-- Índices para appointments
CREATE INDEX idx_appointments_salon_id ON public.appointments(salon_id);
CREATE INDEX idx_appointments_date ON public.appointments(appointment_date);
CREATE INDEX idx_appointments_status ON public.appointments(status);
CREATE INDEX idx_appointments_user_id ON public.appointments(user_id);
CREATE INDEX idx_appointments_professional_id ON public.appointments(professional_id);
CREATE INDEX idx_appointments_service_id ON public.appointments(service_id);
CREATE INDEX idx_appointments_datetime ON public.appointments(appointment_date, appointment_time);

-- =====================================================
-- 7. POLÍTICAS RLS (ROW LEVEL SECURITY)
-- =====================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.salons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Políticas para salons (leitura pública, escrita apenas para admins)
CREATE POLICY "Salons are viewable by everyone" ON public.salons
  FOR SELECT USING (true);

CREATE POLICY "Salons can be managed by admins" ON public.salons
  FOR ALL USING (auth.uid() IN (SELECT id FROM public.user_profiles WHERE role = 'admin'));

-- Políticas para services (leitura pública, escrita para admins do salão)
CREATE POLICY "Services are viewable by everyone" ON public.services
  FOR SELECT USING (is_active = true);

CREATE POLICY "Services can be managed by salon admins" ON public.services
  FOR ALL USING (
    auth.uid() IN (
      SELECT up.id FROM public.user_profiles up 
      WHERE up.role = 'admin' AND up.salon_id = services.salon_id
    )
  );

-- Políticas para professionals (leitura pública, escrita para admins do salão)
CREATE POLICY "Professionals are viewable by everyone" ON public.professionals
  FOR SELECT USING (is_active = true);

CREATE POLICY "Professionals can be managed by salon admins" ON public.professionals
  FOR ALL USING (
    auth.uid() IN (
      SELECT up.id FROM public.user_profiles up 
      WHERE up.role = 'admin' AND up.salon_id = professionals.salon_id
    )
  );

-- Políticas para user_profiles
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Profiles can be created on signup" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Políticas para appointments
CREATE POLICY "Anyone can create appointments" ON public.appointments
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view own appointments" ON public.appointments
  FOR SELECT USING (
    auth.uid() = user_id OR 
    auth.uid() IN (
      SELECT up.id FROM public.user_profiles up 
      WHERE up.role IN ('admin', 'professional') AND up.salon_id = appointments.salon_id
    )
  );

CREATE POLICY "Users can update own appointments" ON public.appointments
  FOR UPDATE USING (
    auth.uid() = user_id OR 
    auth.uid() IN (
      SELECT up.id FROM public.user_profiles up 
      WHERE up.role IN ('admin', 'professional') AND up.salon_id = appointments.salon_id
    )
  );

CREATE POLICY "Users can delete own appointments" ON public.appointments
  FOR DELETE USING (
    auth.uid() = user_id OR 
    auth.uid() IN (
      SELECT up.id FROM public.user_profiles up 
      WHERE up.role = 'admin' AND up.salon_id = appointments.salon_id
    )
  );

-- =====================================================
-- 8. FUNÇÕES E TRIGGERS
-- =====================================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_salons_updated_at
  BEFORE UPDATE ON public.salons
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER update_services_updated_at
  BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER update_professionals_updated_at
  BEFORE UPDATE ON public.professionals
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Função para criar perfil de usuário e salão automaticamente
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  salon_uuid UUID;
  salon_slug TEXT;
BEGIN
  -- Gerar slug único para o salão baseado no nome
  salon_slug := LOWER(REPLACE(COALESCE(NEW.raw_user_meta_data->>'name', 'salon'), ' ', '-')) || '-' || SUBSTRING(NEW.id::text, 1, 8);
  
  -- Criar salão para o usuário
  INSERT INTO public.salons (slug, name, email, phone, address, description)
  VALUES (
    salon_slug,
    COALESCE(NEW.raw_user_meta_data->>'name', 'Meu Salão'),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'address', ''),
    COALESCE(NEW.raw_user_meta_data->>'description', '')
  )
  RETURNING id INTO salon_uuid;
  
  -- Criar perfil de usuário associado ao salão
  INSERT INTO public.user_profiles (id, salon_id, email, name, phone, role)
  VALUES (
    NEW.id,
    salon_uuid,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    'admin'
  );
  
  -- Criar serviços padrão para o salão
  INSERT INTO public.services (salon_id, name, description, duration_minutes, price_cents) VALUES
  (salon_uuid, 'Corte Feminino', 'Corte de cabelo feminino com lavagem e finalização', 60, 5000),
  (salon_uuid, 'Corte Masculino', 'Corte de cabelo masculino tradicional', 30, 3000),
  (salon_uuid, 'Escova', 'Escova modeladora com produtos profissionais', 45, 4000),
  (salon_uuid, 'Coloração', 'Coloração completa com produtos de qualidade', 120, 12000),
  (salon_uuid, 'Manicure', 'Cuidados completos para as unhas das mãos', 45, 2500),
  (salon_uuid, 'Pedicure', 'Cuidados completos para as unhas dos pés', 60, 3000);
  
  -- Criar profissionais padrão para o salão
  INSERT INTO public.professionals (salon_id, name, specialty, email, phone) VALUES
  (salon_uuid, 'Profissional 1', 'Cabelo', '', ''),
  (salon_uuid, 'Profissional 2', 'Unhas', '', ''),
  (salon_uuid, 'Profissional 3', 'Estética', '', '');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar perfil automaticamente (verificar se já existe)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =====================================================
-- 9. DADOS INICIAIS (SEED DATA)
-- =====================================================

-- Inserir salão padrão
INSERT INTO public.salons (slug, name, email, phone, address, description) VALUES
('default', 'Salão Beleza Total', 'contato@belezatotal.com', '(11) 3333-4444', 'Rua das Flores, 123 - Centro', 'Salão de beleza completo com os melhores profissionais da região.');

-- Obter ID do salão padrão
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
-- 10. VIEWS ÚTEIS
-- =====================================================

-- View para agendamentos com informações completas
CREATE OR REPLACE VIEW appointments_detailed AS
SELECT 
  a.*,
  s.name as salon_name,
  s.phone as salon_phone,
  s.address as salon_address,
  srv.name as service_full_name,
  srv.duration_minutes as service_duration,
  srv.price_cents as service_price,
  p.name as professional_full_name,
  p.specialty as professional_specialty,
  up.name as user_name,
  up.email as user_email
FROM public.appointments a
LEFT JOIN public.salons s ON a.salon_id = s.id
LEFT JOIN public.services srv ON a.service_id = srv.id
LEFT JOIN public.professionals p ON a.professional_id = p.id
LEFT JOIN public.user_profiles up ON a.user_id = up.id;

-- =====================================================
-- CONCLUÍDO!
-- =====================================================
-- Este esquema resolve os principais problemas:
-- 1. Estrutura normalizada com relacionamentos claros
-- 2. Suporte a múltiplos salões
-- 3. Agendamentos públicos (sem necessidade de autenticação)
-- 4. Dados duplicados para histórico (service_name, professional_name)
-- 5. Preços em centavos para evitar problemas de float
-- 6. Políticas RLS robustas
-- 7. Índices para performance
-- 8. Triggers automáticos
-- 9. Dados iniciais para teste
-- =====================================================