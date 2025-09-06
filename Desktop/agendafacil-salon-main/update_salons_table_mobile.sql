-- Atualizar tabela salons com campos necessários para o layout mobile-first
ALTER TABLE salons 
ADD COLUMN IF NOT EXISTS theme_color VARCHAR(7) DEFAULT '#8B5CF6',
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS cover_image_url TEXT,
ADD COLUMN IF NOT EXISTS opening_time TIME DEFAULT '09:00:00',
ADD COLUMN IF NOT EXISTS closing_time TIME DEFAULT '18:00:00',
ADD COLUMN IF NOT EXISTS instagram VARCHAR(100),
ADD COLUMN IF NOT EXISTS whatsapp VARCHAR(20),
ADD COLUMN IF NOT EXISTS slug VARCHAR(100) UNIQUE;

-- Atualizar o salão de teste com dados completos
UPDATE salons 
SET 
  theme_color = '#8B5CF6',
  opening_time = '09:00:00',
  closing_time = '18:00:00',
  instagram = '@salao_teste',
  whatsapp = '11999999999',
  slug = 'salao-teste',
  description = 'Salão de beleza moderno com os melhores profissionais da região. Oferecemos cortes, coloração, escova e muito mais!'
WHERE id = '32b4dcc5-05b0-4116-9a5b-27c5914d915f';

-- Criar índice para o slug
CREATE INDEX IF NOT EXISTS idx_salons_slug ON salons(slug);

-- Comentários
COMMENT ON COLUMN salons.theme_color IS 'Cor tema do salão em formato hexadecimal';
COMMENT ON COLUMN salons.logo_url IS 'URL da logo do salão';
COMMENT ON COLUMN salons.cover_image_url IS 'URL da imagem de capa do salão';
COMMENT ON COLUMN salons.slug IS 'Slug único para URL amigável do salão';
COMMENT ON COLUMN salons.instagram IS 'Handle do Instagram do salão';
COMMENT ON COLUMN salons.whatsapp IS 'Número do WhatsApp do salão';