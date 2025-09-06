// Script para corrigir as políticas RLS da tabela appointments
const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase (usando variáveis de ambiente)
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixRLSPolicies() {
  try {
    console.log('Corrigindo políticas RLS da tabela appointments...');
    
    // Remover política antiga
    const { error: dropError1 } = await supabase.rpc('exec_sql', {
      sql: 'DROP POLICY IF EXISTS "Users can view appointments of their salons" ON appointments;'
    });
    
    if (dropError1) {
      console.log('Aviso ao remover política de SELECT:', dropError1.message);
    }
    
    // Criar nova política de SELECT
    const { error: createError1 } = await supabase.rpc('exec_sql', {
      sql: `CREATE POLICY "Users can view appointments of their salons" ON appointments
        FOR SELECT USING (
          salon_id IN (
            SELECT id FROM salons WHERE owner_id = auth.uid()
          )
        );`
    });
    
    if (createError1) {
      console.error('Erro ao criar política de SELECT:', createError1);
    } else {
      console.log('✓ Política de SELECT criada com sucesso');
    }
    
    // Remover e criar política de UPDATE
    const { error: dropError2 } = await supabase.rpc('exec_sql', {
      sql: 'DROP POLICY IF EXISTS "Users can update appointments of their salons" ON appointments;'
    });
    
    const { error: createError2 } = await supabase.rpc('exec_sql', {
      sql: `CREATE POLICY "Users can update appointments of their salons" ON appointments
        FOR UPDATE USING (
          salon_id IN (
            SELECT id FROM salons WHERE owner_id = auth.uid()
          )
        );`
    });
    
    if (createError2) {
      console.error('Erro ao criar política de UPDATE:', createError2);
    } else {
      console.log('✓ Política de UPDATE criada com sucesso');
    }
    
    // Remover e criar política de DELETE
    const { error: dropError3 } = await supabase.rpc('exec_sql', {
      sql: 'DROP POLICY IF EXISTS "Users can delete appointments of their salons" ON appointments;'
    });
    
    const { error: createError3 } = await supabase.rpc('exec_sql', {
      sql: `CREATE POLICY "Users can delete appointments of their salons" ON appointments
        FOR DELETE USING (
          salon_id IN (
            SELECT id FROM salons WHERE owner_id = auth.uid()
          )
        );`
    });
    
    if (createError3) {
      console.error('Erro ao criar política de DELETE:', createError3);
    } else {
      console.log('✓ Política de DELETE criada com sucesso');
    }
    
    console.log('\nPolíticas RLS corrigidas! Agora os agendamentos devem aparecer no dashboard.');
    
  } catch (error) {
    console.error('Erro geral:', error);
  }
}

fixRLSPolicies();