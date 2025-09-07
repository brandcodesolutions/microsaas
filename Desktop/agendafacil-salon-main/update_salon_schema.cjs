// Script simples para verificar dados do salão
const fs = require('fs');

// Ler variáveis do arquivo .env
let envContent = '';
try {
  envContent = fs.readFileSync('.env', 'utf8');
} catch (error) {
  console.error('❌ Arquivo .env não encontrado');
  process.exit(1);
}

const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    envVars[key.trim()] = value.trim().replace(/"/g, '');
  }
});

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseKey = envVars.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

async function updateSalonSchema() {
  console.log('🔄 Verificando dados do salão...');
  
  try {
    // Verificar se existe o salão de teste
    const response = await fetch(`${supabaseUrl}/rest/v1/salons?id=eq.32b4dcc5-05b0-4116-9a5b-27c5914d915f&select=*`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.log('⚠️ Erro na requisição:', response.status, response.statusText);
      return;
    }
    
    const salons = await response.json();
    
    if (salons.length === 0) {
      console.log('⚠️ Salão de teste não encontrado');
      return;
    }
    
    const testSalon = salons[0];
    console.log('✅ Salão de teste encontrado:');
    console.log('- ID:', testSalon.id);
    console.log('- Nome:', testSalon.name);
    console.log('- Slug:', testSalon.slug || 'null');
    console.log('- Theme Color:', testSalon.theme_color || 'null');
    console.log('- Logo URL:', testSalon.logo_url || 'null');
    console.log('- Cover URL:', testSalon.cover_image_url || 'null');
    console.log('- Instagram URL:', testSalon.instagram_url || 'null');
    console.log('- WhatsApp Number:', testSalon.whatsapp_number || 'null');
    console.log('- Opening Time:', testSalon.opening_time || 'null');
    console.log('- Closing Time:', testSalon.closing_time || 'null');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

updateSalonSchema();