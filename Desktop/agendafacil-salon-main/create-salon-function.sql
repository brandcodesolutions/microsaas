-- Função para criar salão contornando RLS
CREATE OR REPLACE FUNCTION public.create_salon_for_user(
  p_name TEXT,
  p_slug TEXT,
  p_address TEXT,
  p_phone TEXT,
  p_email TEXT,
  p_description TEXT,
  p_user_id UUID
)
RETURNS TABLE(
  id UUID,
  name TEXT,
  slug TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  description TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Inserir o salão
  RETURN QUERY
  INSERT INTO public.salons (name, slug, address, phone, email, description)
  VALUES (p_name, p_slug, p_address, p_phone, p_email, p_description)
  RETURNING 
    salons.id,
    salons.name,
    salons.slug,
    salons.address,
    salons.phone,
    salons.email,
    salons.description,
    salons.created_at,
    salons.updated_at;
END;
$$;

-- Adicionar política de INSERT para salons
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'salons' AND policyname = 'Users can create salons') THEN
    CREATE POLICY "Users can create salons" ON public.salons
      FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
  END IF;
END $$;

-- Adicionar política de UPDATE para salons
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'salons' AND policyname = 'Users can update their salons') THEN
    CREATE POLICY "Users can update their salons" ON public.salons
      FOR UPDATE USING (auth.uid() IS NOT NULL);
  END IF;
END $$;

-- Adicionar política de DELETE para salons
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'salons' AND policyname = 'Users can delete their salons') THEN
    CREATE POLICY "Users can delete their salons" ON public.salons
      FOR DELETE USING (auth.uid() IS NOT NULL);
  END IF;
END $$;