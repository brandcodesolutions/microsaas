-- Criar serviços padrão para o salão de teste
INSERT INTO services (id, salon_id, name, description, price, duration_minutes, created_at, updated_at)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440001', '32b4dcc5-05b0-4116-9a5b-27c5914d915f', 'Corte de Cabelo', 'Corte masculino e feminino (30min - intervalos de 30min)', 50.00, 30, NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440002', '32b4dcc5-05b0-4116-9a5b-27c5914d915f', 'Escova', 'Escova modeladora (45min - intervalos de 15min)', 30.00, 45, NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440003', '32b4dcc5-05b0-4116-9a5b-27c5914d915f', 'Coloração', 'Coloração completa (90min - intervalos de 15min)', 120.00, 90, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  duration_minutes = EXCLUDED.duration_minutes,
  updated_at = NOW();

-- Criar tabela de transações financeiras
CREATE TABLE IF NOT EXISTS financial_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
  category VARCHAR(50) NOT NULL,
  description TEXT,
  amount DECIMAL(10,2) NOT NULL,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method VARCHAR(20) CHECK (payment_method IN ('cash', 'card', 'pix', 'transfer')),
  status VARCHAR(20) NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_financial_transactions_salon_id ON financial_transactions(salon_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_date ON financial_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_type ON financial_transactions(type);

-- Criar tabela de metas financeiras
CREATE TABLE IF NOT EXISTS financial_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  target_amount DECIMAL(10,2) NOT NULL,
  current_amount DECIMAL(10,2) DEFAULT 0,
  target_date DATE,
  category VARCHAR(50),
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para metas
CREATE INDEX IF NOT EXISTS idx_financial_goals_salon_id ON financial_goals(salon_id);
CREATE INDEX IF NOT EXISTS idx_financial_goals_status ON financial_goals(status);

-- Inserir algumas transações de exemplo para o salão de teste
INSERT INTO financial_transactions (salon_id, type, category, description, amount, transaction_date, payment_method)
VALUES 
  ('32b4dcc5-05b0-4116-9a5b-27c5914d915f', 'income', 'Serviços', 'Corte de cabelo - Cliente João', 50.00, CURRENT_DATE - INTERVAL '1 day', 'card'),
  ('32b4dcc5-05b0-4116-9a5b-27c5914d915f', 'income', 'Serviços', 'Escova - Cliente Maria', 30.00, CURRENT_DATE - INTERVAL '1 day', 'pix'),
  ('32b4dcc5-05b0-4116-9a5b-27c5914d915f', 'income', 'Serviços', 'Coloração - Cliente Ana', 120.00, CURRENT_DATE - INTERVAL '2 days', 'cash'),
  ('32b4dcc5-05b0-4116-9a5b-27c5914d915f', 'expense', 'Produtos', 'Shampoo e condicionador', 85.00, CURRENT_DATE - INTERVAL '3 days', 'card'),
  ('32b4dcc5-05b0-4116-9a5b-27c5914d915f', 'expense', 'Aluguel', 'Aluguel do salão', 1200.00, CURRENT_DATE - INTERVAL '5 days', 'transfer'),
  ('32b4dcc5-05b0-4116-9a5b-27c5914d915f', 'income', 'Serviços', 'Corte + Escova - Cliente Pedro', 80.00, CURRENT_DATE, 'card')
ON CONFLICT DO NOTHING;

-- Inserir meta de exemplo
INSERT INTO financial_goals (salon_id, name, target_amount, current_amount, target_date, category)
VALUES 
  ('32b4dcc5-05b0-4116-9a5b-27c5914d915f', 'Faturamento Mensal', 5000.00, 2800.00, DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day', 'Receita')
ON CONFLICT DO NOTHING;

-- Função para atualizar automaticamente o updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para atualizar updated_at automaticamente
DROP TRIGGER IF EXISTS update_financial_transactions_updated_at ON financial_transactions;
CREATE TRIGGER update_financial_transactions_updated_at
    BEFORE UPDATE ON financial_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_financial_goals_updated_at ON financial_goals;
CREATE TRIGGER update_financial_goals_updated_at
    BEFORE UPDATE ON financial_goals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comentários nas tabelas
COMMENT ON TABLE financial_transactions IS 'Tabela para armazenar todas as transações financeiras do salão';
COMMENT ON TABLE financial_goals IS 'Tabela para armazenar metas financeiras do salão';