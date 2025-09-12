import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Test from "./pages/Test";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import Financeiro from "./pages/Financeiro";
import PerfilSalao from "./pages/PerfilSalao";
import Configuracoes from "./pages/Configuracoes";
import Agendamento from "./pages/Agendamento";
import PublicBooking from "./pages/PublicBooking";

import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import ErrorBoundary from "./components/ErrorBoundary";
import TestPage from "./pages/TestPage";
import PerfilSalaoSimple from "./pages/PerfilSalaoSimple";
import ButtonTest from "./pages/ButtonTest";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <Routes>
            <Route path="/" element={<Index />} />
             <Route path="/test" element={<Test />} />
             <Route path="/test-page" element={<TestPage />} />
            <Route path="/button-test" element={<ProtectedRoute><ButtonTest /></ProtectedRoute>} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/financeiro" element={
              <ProtectedRoute>
                <Financeiro />
              </ProtectedRoute>
            } />
            <Route path="/perfil-salao" element={
               <ProtectedRoute>
                 <PerfilSalao />
               </ProtectedRoute>
             } />
             <Route path="/perfil-salao-simple" element={
               <ProtectedRoute>
                 <PerfilSalaoSimple />
               </ProtectedRoute>
             } />
            <Route path="/configuracoes" element={
              <ProtectedRoute>
                <Configuracoes />
              </ProtectedRoute>
            } />
            <Route path="/agendamento/:salonId" element={<Agendamento />} />
            <Route path="/agendamento-publico/:salonId" element={<PublicBooking />} />

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
