import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  console.log('🔒 ProtectedRoute rendered');
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      console.log('🔍 Checking authentication...');
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const authenticated = !!user;
        console.log('👤 User authenticated:', authenticated, user ? 'User found' : 'No user');
        setIsAuthenticated(authenticated);
        
        if (!authenticated) {
          console.log('❌ Not authenticated, redirecting to login');
          navigate('/login');
        } else {
          console.log('✅ User is authenticated');
        }
      } catch (error) {
        console.error('❌ Erro ao verificar autenticação:', error);
        setIsAuthenticated(false);
        navigate('/login');
      }
    };

    checkAuth();
  }, [navigate]);

  // Mostra loading enquanto verifica autenticação
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  // Se não autenticado, mostra loading durante redirecionamento
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Redirecionando para login...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;