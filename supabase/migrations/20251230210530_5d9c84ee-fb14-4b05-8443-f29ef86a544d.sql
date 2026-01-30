-- 1. Política para permitir usuários autenticados criarem famílias
CREATE POLICY "Users can create families" 
ON public.families 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- 2. Política para permitir usuários se adicionarem como membros
CREATE POLICY "Users can add themselves to families" 
ON public.family_members 
FOR INSERT 
TO authenticated 
WITH CHECK (user_id = auth.uid());

-- 3. Função SECURITY DEFINER para criar família com admin atomicamente
CREATE OR REPLACE FUNCTION public.create_family_with_admin(
  _family_name TEXT
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _family_id uuid;
  _user_id uuid;
BEGIN
  _user_id := auth.uid();
  
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  -- Verificar se usuário já tem família
  IF EXISTS (SELECT 1 FROM family_members WHERE user_id = _user_id) THEN
    RAISE EXCEPTION 'User already belongs to a family';
  END IF;
  
  -- Criar família
  INSERT INTO families (name) VALUES (_family_name)
  RETURNING id INTO _family_id;
  
  -- Adicionar usuário como membro
  INSERT INTO family_members (family_id, user_id)
  VALUES (_family_id, _user_id);
  
  -- Promover a admin
  UPDATE user_roles SET role = 'admin' WHERE user_id = _user_id;
  
  RETURN _family_id;
END;
$$;