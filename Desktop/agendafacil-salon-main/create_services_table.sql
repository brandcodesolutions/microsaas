-- Criar tabela de serviços
CREATE TABLE IF NOT EXISTS services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_services_salon_id ON services(salon_id);
CREATE INDEX IF NOT EXISTS idx_services_created_at ON services(created_at);

-- Habilitar RLS (Row Level Security)
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- Política para permitir que usuários vejam apenas serviços de seus salões
CREATE POLICY "Users can view services of their salons" ON services
  FOR SELECT USING (
    salon_id IN (
      SELECT salon_id FROM user_profiles WHERE id = auth.uid()
    )
  );

-- Política para permitir que usuários criem serviços em seus salões
CREATE POLICY "Users can create services for their salons" ON services
  FOR INSERT WITH CHECK (
    salon_id IN (
      SELECT salon_id FROM user_profiles WHERE id = auth.uid()
    )
  );

-- Política para permitir que usuários atualizem serviços de seus salões
CREATE POLICY "Users can update services of their salons" ON services
  FOR UPDATE USING (
    salon_id IN (
      SELECT salon_id FROM user_profiles WHERE id = auth.uid()
    )
  );

-- Política para permitir que usuários deletem serviços de seus salões
CREATE POLICY "Users can delete services of their salons" ON services
  FOR DELETE USING (
    salon_id IN (
      SELECT salon_id FROM user_profiles WHERE id = auth.uid()
    )
  );

-- Política adicional para permitir visualização pública dos serviços (para agendamento público)
CREATE POLICY "Public can view services" ON services
  FOR SELECT USING (true);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar updated_at na tabela services
DROP TRIGGER IF EXISTS update_services_updated_at ON services;
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();