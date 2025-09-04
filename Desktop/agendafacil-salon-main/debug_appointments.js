import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ofpuhlkkvzrxidqkwvyp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mcHVobGtrdnpyeGlkcWt3dnlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3Mzk0NjYsImV4cCI6MjA3MjMxNTQ2Nn0.1TrRrNSAIzoE1NGF9GUFbPA7hUUHr4x6v1KgjDGbWG0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugAppointments() {
  try {
    console.log('🔍 Verificando agendamentos existentes...');
    
    // Buscar todos os agendamentos
    const { data: appointments, error } = await supabase
      .from('appointments')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Erro ao buscar agendamentos:', error);
      return;
    }
    
    console.log(`📊 Total de agendamentos encontrados: ${appointments?.length || 0}`);
    
    if (appointments && appointments.length > 0) {
      console.log('\n📋 Agendamentos existentes:');
      appointments.forEach((apt, index) => {
        console.log(`\n${index + 1}. ID: ${apt.id}`);
        console.log(`   Salão: ${apt.salon_id}`);
        console.log(`   Data: ${apt.appointment_date}`);
        console.log(`   Hora: ${apt.appointment_time}`);
        console.log(`   Status: ${apt.status}`);
        console.log(`   Cliente: ${apt.client_name}`);
        console.log(`   Serviço: ${apt.service_name || 'N/A'}`);
        console.log(`   Criado em: ${apt.created_at}`);
      });
    } else {
      console.log('✅ Nenhum agendamento encontrado na tabela.');
    }
    
    // Verificar especificamente agendamentos para o salão de teste
    console.log('\n🔍 Verificando agendamentos para o salão de teste (test-salon)...');
    const { data: testSalonAppointments, error: testError } = await supabase
      .from('appointments')
      .select('*')
      .eq('salon_id', 'test-salon')
      .neq('status', 'cancelled');
    
    // Verificar também agendamentos para o UUID real encontrado
    console.log('\n🔍 Verificando agendamentos para o UUID real (32b4dcc5-05b0-4116-9a5b-27c5914d915f)...');
    const { data: realSalonAppointments, error: realError } = await supabase
      .from('appointments')
      .select('*')
      .eq('salon_id', '32b4dcc5-05b0-4116-9a5b-27c5914d915f')
      .neq('status', 'cancelled');
    
    if (realError) {
      console.error('❌ Erro ao buscar agendamentos do salão real:', realError);
    } else {
      console.log(`📊 Agendamentos ativos para UUID real: ${realSalonAppointments?.length || 0}`);
      
      if (realSalonAppointments && realSalonAppointments.length > 0) {
        realSalonAppointments.forEach((apt, index) => {
          console.log(`\n${index + 1}. Data: ${apt.appointment_date}, Hora: ${apt.appointment_time}, Status: ${apt.status}`);
        });
      }
    }
    
    // Buscar agendamentos específicos para 9/9 às 9h (formato correto: 2025-09-09)
console.log('\n=== Agendamentos para 9/9/2025 às 9h ===');
try {
  const { data: specificAppointments, error: specificError } = await supabase
    .from('appointments')
    .select('*')
    .eq('salon_id', '32b4dcc5-05b0-4116-9a5b-27c5914d915f')
    .eq('appointment_date', '2025-09-09')
    .eq('appointment_time', '09:00:00')
    .in('status', ['scheduled', 'confirmed']);

  if (specificError) {
    console.error('Erro ao buscar agendamentos específicos:', specificError);
  } else {
    console.log('Agendamentos encontrados para 9/9/2025 às 9h:', specificAppointments?.length || 0);
    specificAppointments?.forEach(apt => {
      console.log(`- ID: ${apt.id}, Cliente: ${apt.client_name}, Serviço: ${apt.service_name}, Duração: ${apt.duration_minutes}min, Status: ${apt.status}`);
    });
  }
} catch (error) {
  console.error('Erro na busca específica:', error);
}
    
    if (testError) {
      console.error('❌ Erro ao buscar agendamentos do salão de teste:', testError);
    } else {
      console.log(`📊 Agendamentos ativos para test-salon: ${testSalonAppointments?.length || 0}`);
      
      if (testSalonAppointments && testSalonAppointments.length > 0) {
        testSalonAppointments.forEach((apt, index) => {
          console.log(`\n${index + 1}. Data: ${apt.appointment_date}, Hora: ${apt.appointment_time}, Status: ${apt.status}`);
        });
      }
    }
    
  } catch (error) {
    console.error('💥 Erro geral:', error);
  }
}

debugAppointments();