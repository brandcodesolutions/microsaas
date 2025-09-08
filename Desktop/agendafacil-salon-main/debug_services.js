import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase (substitua pelas suas credenciais)
const supabaseUrl = 'https://your-project.supabase.co';
const supabaseKey = 'your-anon-key';
const supabase = createClient(supabaseUrl, supabaseKey);

async function debugServices() {
  console.log('🔍 Iniciando debug dos serviços...');
  
  try {
    // 1. Verificar autenticação
    console.log('\n1. 🔐 Verificando autenticação...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('❌ Erro de autenticação:', authError);
      return;
    }
    
    if (!user) {
      console.log('❌ Usuário não autenticado');
      return;
    }
    
    console.log('✅ Usuário autenticado:', user.id);
    
    // 2. Verificar salão
    console.log('\n2. 🏢 Verificando salão...');
    const { data: salonData, error: salonError } = await supabase
      .from('salons')
      .select('*')
      .eq('owner_id', user.id)
      .single();
    
    if (salonError) {
      console.error('❌ Erro ao buscar salão:', salonError);
      return;
    }
    
    if (!salonData) {
      console.log('❌ Nenhum salão encontrado');
      return;
    }
    
    console.log('✅ Salão encontrado:', {
      id: salonData.id,
      name: salonData.name,
      owner_id: salonData.owner_id
    });
    
    // 3. Verificar serviços
    console.log('\n3. 🔍 Verificando serviços...');
    const { data: servicesData, error: servicesError } = await supabase
      .from('services')
      .select('*')
      .eq('salon_id', salonData.id);
    
    if (servicesError) {
      console.error('❌ Erro ao buscar serviços:', servicesError);
      return;
    }
    
    console.log('✅ Serviços encontrados:', servicesData?.length || 0);
    
    if (servicesData && servicesData.length > 0) {
      console.log('📋 Lista de serviços:');
      servicesData.forEach((service, index) => {
        console.log(`  ${index + 1}. ${service.name} - R$ ${(service.price_cents / 100).toFixed(2)} (${service.duration_minutes}min)`);
      });
    } else {
      console.log('⚠️ Nenhum serviço cadastrado para este salão');
      console.log('💡 Dica: Vá para Configurações > Serviços para cadastrar serviços');
    }
    
    // 4. Verificar estrutura da tabela services
    console.log('\n4. 📊 Verificando estrutura da tabela services...');
    const { data: tableInfo, error: tableError } = await supabase
      .from('services')
      .select('*')
      .limit(1);
    
    if (!tableError && tableInfo && tableInfo.length > 0) {
      console.log('✅ Colunas disponíveis na tabela services:', Object.keys(tableInfo[0]));
    }
    
  } catch (error) {
    console.error('💥 Erro geral:', error);
  }
}

// Executar debug
debugServices();

console.log('\n📝 Para executar este debug:');
console.log('1. Abra o console do navegador (F12)');
console.log('2. Cole este código no console');
console.log('3. Pressione Enter para executar');
console.log('4. Verifique os logs para identificar o problema');