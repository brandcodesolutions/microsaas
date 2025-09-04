-- Script para forçar atualização do cache do schema no Supabase
-- Execute este script no SQL Editor do Supabase

-- 1. Recarregar o cache do schema
NOTIFY pgrst, 'reload schema';

-- 2. Verificar se as colunas existem na tabela
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'appointments' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Verificar se a tabela appointments existe
SELECT schemaname, tablename, tableowner
FROM pg_tables 
WHERE tablename = 'appointments' 
  AND schemaname = 'public';

-- 4. Se necessário, recriar a tabela com todas as colunas
-- (Descomente apenas se as verificações acima mostrarem problemas)
/*
DROP TABLE IF EXISTS public.appointments CASCADE;

CREATE TABLE public.appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id UUID NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  client_name VARCHAR(255) NOT NULL,
  client_email VARCHAR(255) NOT NULL,
  client_phone VARCHAR(20),
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  duration_minutes INTEGER NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recriar índices
CREATE INDEX IF NOT EXISTS idx_appointments_salon_id ON public.appointments(salon_id);
CREATE INDEX IF NOT EXISTS idx_appointments_service_id ON public.appointments(service_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON public.appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_datetime ON public.appointments(appointment_date, appointment_time);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments(status);

-- Habilitar RLS
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Recriar políticas RLS
CREATE POLICY "Anyone can view appointments" ON public.appointments
  FOR SELECT USING (true);

CREATE POLICY "Anyone can create appointments" ON public.appointments
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update appointments" ON public.appointments
  FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete appointments" ON public.appointments
  FOR DELETE USING (true);
*/