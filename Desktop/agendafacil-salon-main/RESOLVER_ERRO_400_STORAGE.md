# 🔧 Resolver Erro 400 do Supabase Storage

## 🚨 Problema
Erro: `Failed to load resource: the server responded with a status of 400`
URL: `ofpuhlkkvzrxidqkwvyp.supabase.co/storage/v1/object/salon-assets/salon-images/32b4dcc5-05b0-4116-9a5b-27c5914d915f_cover.png`

## 🔍 Diagnóstico
O erro 400 indica que:
1. ❌ O bucket `salon-assets` não existe
2. ❌ As imagens não foram enviadas para o Storage
3. ❌ As políticas de acesso não estão configuradas

## ✅ Solução Passo a Passo

### 1. Verificar/Criar o Bucket

1. Acesse o [Supabase Dashboard](https://supabase.com/dashboard)
2. Vá para **Storage** no menu lateral
3. Verifique se existe um bucket chamado `salon-assets`
4. Se não existir, clique em **New bucket**:
   - Nome: `salon-assets`
   - ✅ Marque **Public bucket**
   - Clique em **Create bucket**

### 2. Configurar Políticas de Acesso

No SQL Editor do Supabase, execute:

```sql
-- Política para leitura pública
CREATE POLICY "Public read access for salon assets" ON storage.objects
FOR SELECT USING (bucket_id = 'salon-assets');

-- Política para upload por usuários autenticados
CREATE POLICY "Authenticated users can upload salon assets" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'salon-assets' AND 
  auth.role() = 'authenticated'
);

-- Política para atualização por usuários autenticados
CREATE POLICY "Authenticated users can update salon assets" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'salon-assets' AND 
  auth.role() = 'authenticated'
) WITH CHECK (
  bucket_id = 'salon-assets' AND 
  auth.role() = 'authenticated'
);

-- Política para exclusão por usuários autenticados
CREATE POLICY "Authenticated users can delete salon assets" ON storage.objects
FOR DELETE USING (
  bucket_id = 'salon-assets' AND 
  auth.role() = 'authenticated'
);
```

### 3. Testar o Upload de Imagens

1. Acesse a página de **Perfil do Salão** no app
2. Faça login como proprietário do salão
3. Tente fazer upload de uma imagem de capa
4. Tente fazer upload de um logotipo

### 4. Verificar se as Imagens Foram Enviadas

1. No Supabase Dashboard, vá para **Storage** > **salon-assets**
2. Verifique se existe a pasta `salon-images`
3. Verifique se existem os arquivos:
   - `32b4dcc5-05b0-4116-9a5b-27c5914d915f_cover.png`
   - `32b4dcc5-05b0-4116-9a5b-27c5914d915f_logo.png`

### 5. Testar URLs Públicas

Abra no navegador: http://localhost:8080/test-storage.html

Este teste mostrará:
- ✅ Se as imagens carregam corretamente
- ❌ Qual erro específico está ocorrendo
- 📊 Status HTTP das requisições

## 🔧 Soluções Alternativas

### Se o bucket não pode ser criado:
1. Verifique se você tem permissões de administrador no projeto Supabase
2. Tente criar o bucket manualmente pelo dashboard
3. Verifique se não há limite de buckets atingido

### Se as políticas não funcionam:
1. Verifique se RLS (Row Level Security) está habilitado na tabela `storage.objects`
2. Execute: `ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;`

### Se as imagens não aparecem:
1. Verifique se o upload realmente foi concluído
2. Confirme se o caminho está correto: `salon-images/{salon_id}_{tipo}.{extensao}`
3. Teste fazer upload de uma nova imagem

## 🎯 Resultado Esperado

Após seguir todos os passos:
- ✅ O bucket `salon-assets` deve existir e ser público
- ✅ As políticas de acesso devem estar ativas
- ✅ As imagens devem carregar sem erro 400
- ✅ O link público deve exibir as imagens corretamente

## 📞 Suporte

Se o problema persistir:
1. Verifique os logs do Supabase Dashboard
2. Teste com uma imagem diferente
3. Confirme se as credenciais do Supabase estão corretas no `.env`