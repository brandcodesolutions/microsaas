-- Configurar Row Level Security (RLS) para as novas tabelas

-- Habilitar RLS nas tabelas financeiras
ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_goals ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes das tabelas financeiras se existirem
DROP POLICY IF EXISTS "Users can view own salon transactions" ON financial_transactions;
DROP POLICY IF EXISTS "Users can insert own salon transactions" ON financial_transactions;
DROP POLICY IF EXISTS "Users can update own salon transactions" ON financial_transactions;
DROP POLICY IF EXISTS "Users can delete own salon transactions" ON financial_transactions;
DROP POLICY IF EXISTS "Users can view own salon goals" ON financial_goals;
DROP POLICY IF EXISTS "Users can insert own salon goals" ON financial_goals;
DROP POLICY IF EXISTS "Users can update own salon goals" ON financial_goals;
DROP POLICY IF EXISTS "Users can delete own salon goals" ON financial_goals;

-- Políticas para financial_transactions
-- Permitir que usuários vejam apenas transações do seu salão
CREATE POLICY "Users can view own salon transactions" ON financial_transactions
  FOR SELECT USING (
    salon_id IN (
      SELECT id FROM salons WHERE owner_id = auth.uid()
    )
  );

-- Permitir que usuários insiram transações apenas no seu salão
CREATE POLICY "Users can insert own salon transactions" ON financial_transactions
  FOR INSERT WITH CHECK (
    salon_id IN (
      SELECT id FROM salons WHERE owner_id = auth.uid()
    )
  );

-- Permitir que usuários atualizem transações apenas do seu salão
CREATE POLICY "Users can update own salon transactions" ON financial_transactions
  FOR UPDATE USING (
    salon_id IN (
      SELECT id FROM salons WHERE owner_id = auth.uid()
    )
  );

-- Permitir que usuários deletem transações apenas do seu salão
CREATE POLICY "Users can delete own salon transactions" ON financial_transactions
  FOR DELETE USING (
    salon_id IN (
      SELECT id FROM salons WHERE owner_id = auth.uid()
    )
  );

-- Políticas para financial_goals
-- Permitir que usuários vejam apenas metas do seu salão
CREATE POLICY "Users can view own salon goals" ON financial_goals
  FOR SELECT USING (
    salon_id IN (
      SELECT id FROM salons WHERE owner_id = auth.uid()
    )
  );

-- Permitir que usuários insiram metas apenas no seu salão
CREATE POLICY "Users can insert own salon goals" ON financial_goals
  FOR INSERT WITH CHECK (
    salon_id IN (
      SELECT id FROM salons WHERE owner_id = auth.uid()
    )
  );

-- Permitir que usuários atualizem metas apenas do seu salão
CREATE POLICY "Users can update own salon goals" ON financial_goals
  FOR UPDATE USING (
    salon_id IN (
      SELECT id FROM salons WHERE owner_id = auth.uid()
    )
  );

-- Permitir que usuários deletem metas apenas do seu salão
CREATE POLICY "Users can delete own salon goals" ON financial_goals
  FOR DELETE USING (
    salon_id IN (
      SELECT id FROM salons WHERE owner_id = auth.uid()
    )
  );

-- Remover políticas existentes se existirem
DROP POLICY IF EXISTS "Public can view salon info" ON salons;
DROP POLICY IF EXISTS "Public can view services" ON services;
DROP POLICY IF EXISTS "Public can create appointments" ON appointments;
DROP POLICY IF EXISTS "Users can view own salon appointments" ON appointments;
DROP POLICY IF EXISTS "Users can update own salon appointments" ON appointments;

-- Política para permitir acesso público aos dados do salão (para o site público)
CREATE POLICY "Public can view salon info" ON salons
  FOR SELECT USING (true);

-- Política para permitir acesso público aos serviços (para o site público)
CREATE POLICY "Public can view services" ON services
  FOR SELECT USING (true);

-- Política para permitir criação de agendamentos públicos
CREATE POLICY "Public can create appointments" ON appointments
  FOR INSERT WITH CHECK (true);

-- Política para permitir que usuários vejam agendamentos do seu salão
CREATE POLICY "Users can view own salon appointments" ON appointments
  FOR SELECT USING (
    salon_id IN (
      SELECT id FROM salons WHERE owner_id = auth.uid()
    )
  );

-- Política para permitir que usuários atualizem agendamentos do seu salão
CREATE POLICY "Users can update own salon appointments" ON appointments
  FOR UPDATE USING (
    salon_id IN (
      SELECT id FROM salons WHERE owner_id = auth.uid()
    )
  );

-- Comentários
COMMENT ON POLICY "Users can view own salon transactions" ON financial_transactions IS 'Permite que usuários vejam apenas transações do seu próprio salão';
COMMENT ON POLICY "Public can view salon info" ON salons IS 'Permite acesso público aos dados básicos do salão para o site de agendamentos';
COMMENT ON POLICY "Public can create appointments" ON appointments IS 'Permite que clientes criem agendamentos através do site público';