# Configuração do Supabase

Este guia explica como configurar o Supabase para o projeto AgendaFácil Salon.

## 1. Criar Projeto no Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Faça login ou crie uma conta
3. Clique em "New Project"
4. Escolha sua organização
5. Preencha:
   - **Name**: agendafacil-salon
   - **Database Password**: (escolha uma senha forte)
   - **Region**: South America (São Paulo) - para melhor performance no Brasil
6. Clique em "Create new project"

## 2. Obter Credenciais

Após criar o projeto:

1. Vá para **Settings** > **API**
2. Copie as seguintes informações:
   - **Project URL**
   - **anon public key**

## 3. Configurar Variáveis de Ambiente

1. Crie um arquivo `.env` na raiz do projeto
2. Adicione as seguintes variáveis:

```env
VITE_SUPABASE_URL=sua_project_url_aqui
VITE_SUPABASE_ANON_KEY=sua_anon_key_aqui
```

## 4. Criar Tabelas no Banco de Dados

Vá para **SQL Editor** no painel do Supabase e execute os seguintes comandos:

### Tabela de Usuários (Salões)
```sql
-- Criar tabela de perfis de usuário
CREATE TABLE public.user_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Política para usuários verem apenas seus próprios dados
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
```

### Tabela de Agendamentos
```sql
-- Criar tabela de agendamentos
CREATE TABLE public.appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  service TEXT NOT NULL,
  professional TEXT,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  observations TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Políticas para agendamentos
CREATE POLICY "Users can view own appointments" ON public.appointments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert appointments" ON public.appointments
  FOR INSERT WITH CHECK (true); -- Qualquer um pode criar agendamento

CREATE POLICY "Users can update own appointments" ON public.appointments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own appointments" ON public.appointments
  FOR DELETE USING (auth.uid() = user_id);
```

### Função para criar perfil automaticamente
```sql
-- Função para criar perfil automaticamente após registro
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, name, email)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'name', NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para executar a função
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

## 5. Configurar Autenticação

1. Vá para **Authentication** > **Settings**
2. Em **Site URL**, adicione: `http://localhost:5173` (para desenvolvimento)
3. Em **Redirect URLs**, adicione: `http://localhost:5173/**`
4. Salve as configurações

## 6. Testar a Configuração

1. Instale as dependências: `npm install`
2. Inicie o servidor de desenvolvimento: `npm run dev`
3. Acesse `http://localhost:5173`
4. Teste o registro e login de usuários

## 7. Próximos Passos

- Configure o domínio de produção nas configurações de autenticação
- Adicione políticas de segurança mais específicas conforme necessário
- Configure backups automáticos do banco de dados
- Monitore o uso através do painel do Supabase

## Troubleshooting

### Erro de CORS
- Verifique se as URLs estão configuradas corretamente em Authentication > Settings

### Erro de RLS
- Verifique se as políticas de Row Level Security estão configuradas corretamente
- Certifique-se de que o usuário está autenticado antes de fazer operações no banco

### Erro de Variáveis de Ambiente
- Verifique se o arquivo `.env` está na raiz do projeto
- Certifique-se de que as variáveis começam com `VITE_`
- Reinicie o servidor de desenvolvimento após alterar as variáveis