# Correção do Erro 400 - Supabase Storage

## Problema
O erro `Failed to load resource: the server responded with a status of 400` indica que o bucket `salon-assets` não existe ou não tem as políticas de acesso configuradas corretamente no Supabase Storage.

## Solução

### Passo 1: Acessar o Supabase Dashboard
1. Acesse [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Faça login na sua conta
3. Selecione o projeto `ofpuhlkkvzrxidqkwvyp`

### Passo 2: Criar o Bucket
1. No menu lateral, clique em **Storage**
2. Clique em **Create bucket**
3. Nome do bucket: `salon-assets`
4. Marque a opção **Public bucket** (importante!)
5. Clique em **Create bucket**

### Passo 3: Configurar Políticas (Alternativa via SQL)
Se preferir usar SQL, vá para **SQL Editor** e execute o arquivo `setup_storage_bucket.sql`:

```sql
-- O arquivo setup_storage_bucket.sql contém todos os comandos necessários
```

### Passo 4: Verificar Configuração
1. Vá para **Storage** > **salon-assets**
2. Clique em **Policies**
3. Verifique se existem políticas para:
   - ✅ Public read access
   - ✅ Authenticated upload
   - ✅ Authenticated update
   - ✅ Authenticated delete

### Passo 5: Testar
Após configurar o bucket:
1. Acesse a página de Perfil do Salão
2. Tente fazer upload de uma imagem de logo ou capa
3. Verifique se a imagem aparece corretamente no link público

## Estrutura de Arquivos no Bucket
Os arquivos serão salvos com a seguinte estrutura:
- `salon-images/{salon_id}_logo.{ext}` - Logo do salão
- `salon-images/{salon_id}_cover.{ext}` - Capa do salão

## Troubleshooting

### Se ainda houver erro 400:
1. Verifique se o bucket está marcado como **público**
2. Confirme se as políticas de RLS estão ativas
3. Teste com um arquivo pequeno (< 1MB) primeiro

### Se houver erro 403:
1. Verifique se o usuário está autenticado
2. Confirme se as políticas para usuários autenticados estão corretas

### Se a imagem não carregar:
1. Verifique se a URL pública está sendo gerada corretamente
2. Teste a URL diretamente no navegador
3. Confirme se o arquivo foi realmente enviado para o bucket