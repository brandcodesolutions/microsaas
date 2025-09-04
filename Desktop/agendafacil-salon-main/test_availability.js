import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wnqjqvqxqxqxqxqx.supabase.co';
const supabaseKey = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InducWpxdnF4cXhxeHF4cXgiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTcwMDAwMDAwMCwiZXhwIjoxODU3Njc5OTk5fQ.example';

const supabase = createClient(supabaseUrl, supabaseKey);

const testAvailability = async () => {
  console.log('🧪 Testando disponibilidade de horários...');
  
  const salonId = '32b4dcc5-05b0-4116-9a5b-27c5914d915f';
  const date = '2025-09-09';
  
  // Buscar agendamentos para 9/9
  const { data: appointments, error } = await supabase
    .from('appointments')
    .select('appointment_time, duration_minutes')
    .eq('salon_id', salonId)
    .eq('appointment_date', date)
    .in('status', ['scheduled', 'confirmed']);
    
  if (error) {
    console.error('❌ Erro:', error);
    return;
  }
  
  console.log('📅 Agendamentos encontrados:', appointments);
  
  // Testar se 09:00 deve estar disponível
  const slotStart = new Date('2000-01-01T09:00:00');
  const slotEnd = new Date('2000-01-01T09:30:00'); // Assumindo serviço de 30min
  
  let hasConflict = false;
  
  for (const appointment of appointments || []) {
    const appointmentStart = new Date(`2000-01-01T${appointment.appointment_time}:00`);
    const appointmentEnd = new Date(appointmentStart.getTime() + appointment.duration_minutes * 60000);
    
    console.log(`🔍 Verificando agendamento:`);
    console.log(`   Agendamento: ${appointmentStart.toTimeString()} - ${appointmentEnd.toTimeString()}`);
    console.log(`   Slot 09:00: ${slotStart.toTimeString()} - ${slotEnd.toTimeString()}`);
    
    // Verificar sobreposição
    if (
      (slotStart >= appointmentStart && slotStart < appointmentEnd) ||
      (slotEnd > appointmentStart && slotEnd <= appointmentEnd) ||
      (slotStart <= appointmentStart && slotEnd >= appointmentEnd)
    ) {
      hasConflict = true;
      console.log('❌ CONFLITO DETECTADO!');
      break;
    }
  }
  
  console.log(`✅ Resultado: 09:00 deve estar ${hasConflict ? 'BLOQUEADO' : 'DISPONÍVEL'}`);
};

testAvailability().catch(console.error);