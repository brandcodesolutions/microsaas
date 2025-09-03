-- Criar tabela de agendamentos
CREATE TABLE IF NOT EXISTS appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
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

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_appointments_salon_id ON appointments(salon_id);
CREATE INDEX IF NOT EXISTS idx_appointments_service_id ON appointments(service_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_datetime ON appointments(appointment_date, appointment_time);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_created_at ON appointments(created_at);

-- Habilitar RLS (Row Level Security)
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Política para permitir que usuários vejam apenas agendamentos de seus salões
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'appointments' AND policyname = 'Users can view appointments of their salons') THEN
    CREATE POLICY "Users can view appointments of their salons" ON appointments
      FOR SELECT USING (
        salon_id IN (
          SELECT salon_id FROM user_profiles WHERE id = auth.uid()
        )
      );
  END IF;
END $$;

-- Política para permitir que qualquer pessoa crie agendamentos (para booking público)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'appointments' AND policyname = 'Anyone can create appointments') THEN
    CREATE POLICY "Anyone can create appointments" ON appointments
      FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- Política para permitir que usuários atualizem agendamentos de seus salões
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'appointments' AND policyname = 'Users can update appointments of their salons') THEN
    CREATE POLICY "Users can update appointments of their salons" ON appointments
      FOR UPDATE USING (
        salon_id IN (
          SELECT salon_id FROM user_profiles WHERE id = auth.uid()
        )
      );
  END IF;
END $$;

-- Política para permitir que usuários deletem agendamentos de seus salões
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'appointments' AND policyname = 'Users can delete appointments of their salons') THEN
    CREATE POLICY "Users can delete appointments of their salons" ON appointments
      FOR DELETE USING (
        salon_id IN (
          SELECT salon_id FROM user_profiles WHERE id = auth.uid()
        )
      );
  END IF;
END $$;

-- Política adicional para permitir leitura pública de agendamentos (para verificar disponibilidade)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'appointments' AND policyname = 'Public can view appointments for availability') THEN
    CREATE POLICY "Public can view appointments for availability" ON appointments
      FOR SELECT USING (true);
  END IF;
END $$;

-- Trigger para atualizar updated_at na tabela appointments
DROP TRIGGER IF EXISTS update_appointments_updated_at ON appointments;
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Constraint para evitar agendamentos sobrepostos no mesmo salão
CREATE UNIQUE INDEX IF NOT EXISTS idx_appointments_no_overlap 
ON appointments (salon_id, appointment_date, appointment_time) 
WHERE status != 'cancelled';

-- Função para verificar conflitos de horários
CREATE OR REPLACE FUNCTION check_appointment_conflict()
RETURNS TRIGGER AS $$
BEGIN
    -- Verificar se há conflito com outros agendamentos
    IF EXISTS (
        SELECT 1 FROM appointments 
        WHERE salon_id = NEW.salon_id 
        AND appointment_date = NEW.appointment_date
        AND status != 'cancelled'
        AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
        AND (
            -- Novo agendamento começa durante um existente
            (NEW.appointment_time >= appointment_time 
             AND NEW.appointment_time < appointment_time + (duration_minutes || ' minutes')::interval)
            OR
            -- Novo agendamento termina durante um existente
            (NEW.appointment_time + (NEW.duration_minutes || ' minutes')::interval > appointment_time 
             AND NEW.appointment_time + (NEW.duration_minutes || ' minutes')::interval <= appointment_time + (duration_minutes || ' minutes')::interval)
            OR
            -- Novo agendamento engloba um existente
            (NEW.appointment_time <= appointment_time 
             AND NEW.appointment_time + (NEW.duration_minutes || ' minutes')::interval >= appointment_time + (duration_minutes || ' minutes')::interval)
        )
    ) THEN
        RAISE EXCEPTION 'Conflito de horário: já existe um agendamento neste período';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para verificar conflitos antes de inserir ou atualizar
DROP TRIGGER IF EXISTS check_appointment_conflict_trigger ON appointments;
CREATE TRIGGER check_appointment_conflict_trigger
    BEFORE INSERT OR UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION check_appointment_conflict();