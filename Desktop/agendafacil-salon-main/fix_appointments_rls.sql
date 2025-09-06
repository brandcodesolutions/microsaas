-- Corrigir política RLS da tabela appointments
-- O problema é que a política está buscando na tabela user_profiles que não existe
-- Deveria buscar na tabela salons

-- Remover política antiga
DROP POLICY IF EXISTS "Users can view appointments of their salons" ON appointments;

-- Criar nova política correta
CREATE POLICY "Users can view appointments of their salons" ON appointments
  FOR SELECT USING (
    salon_id IN (
      SELECT id FROM salons WHERE owner_id = auth.uid()
    )
  );

-- Também corrigir a política de atualização se existir
DROP POLICY IF EXISTS "Users can update appointments of their salons" ON appointments;

CREATE POLICY "Users can update appointments of their salons" ON appointments
  FOR UPDATE USING (
    salon_id IN (
      SELECT id FROM salons WHERE owner_id = auth.uid()
    )
  );

-- E a política de exclusão
DROP POLICY IF EXISTS "Users can delete appointments of their salons" ON appointments;

CREATE POLICY "Users can delete appointments of their salons" ON appointments
  FOR DELETE USING (
    salon_id IN (
      SELECT id FROM salons WHERE owner_id = auth.uid()
    )
  );