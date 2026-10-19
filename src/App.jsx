// src/App.jsx
import React, { useState, useEffect } from 'react';
//import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { configService } from './services/configService';
import LoginPage from './pages/LoginPage';
import ConfigPage from './pages/ConfigPage';
import DashboardPage from './pages/DashboardPage';
import MesasPage from './pages/MesasPage';
import HistoricoPage from './pages/HistoricoPage';
import RelatoriosPage from './pages/RelatoriosPage';
import AlertaContingencia from './components/AlertaContingencia';
import NotasPage from './pages/NotasPage';
import DiagnosticoPage from './pages/DiagnosticoPage';
import JobsPage from './pages/JobsPage';
import CaixaPage from './pages/CaixaPage'
import PdvPage from './pages/PdvPage';
import VendaDiretaPage from './pages/VendaDiretaPage';




function PrivateRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <div style={{ padding: 40 }}>Carregando...</div>;
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function AppRoutes() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [configVerificada, setConfigVerificada] = useState(false);
  const [configurado, setConfigurado] = useState(false);

  useEffect(() => {
    verificarConfig();
  }, []);

  const verificarConfig = async () => {
    const ok = await configService.estaConfigurado();
    setConfigurado(ok);
    setConfigVerificada(true);
  };

  const handleConfigurado = async () => {
    const ok = await configService.estaConfigurado();
    setConfigurado(ok);
  };

  if (!configVerificada || authLoading) {
    return <div style={{ padding: 40 }}>Carregando...</div>;
  }

  if (!configurado) {
    return (
      <Routes>
        <Route path="*" element={<ConfigPage onConfigurado={handleConfigurado} />} />
      </Routes>
    );
  }

    return (
          <>
            {isAuthenticated && <AlertaContingencia />}
            <Routes>
              {/* Login */}
              <Route
                path="/login"
                element={
                  !isAuthenticated ? (
                    <LoginPage />
                  ) : (
                    <Navigate to="/dashboard" replace />
                  )
                }
              />

              {/* Dashboard */}
              <Route
                path="/dashboard"
                element={
                  <PrivateRoute>
                    <DashboardPage />
                  </PrivateRoute>
                }
              />

             <Route
              path="/pdv"
              element={
                <PrivateRoute>
                  <PdvPage />
                </PrivateRoute>
              }
            />

              {/* Mesas */}
              <Route
                path="/mesas"
                element={
                  <PrivateRoute>
                    <MesasPage />
                  </PrivateRoute>
                }
              />

              
            <Route
              path="/venda-direta"
              element={
                <PrivateRoute>
                  <VendaDiretaPage />
                </PrivateRoute>
              }
            />

              <Route
                path="/config"
                element={
                  <PrivateRoute>
                    <ConfigPage />
                  </PrivateRoute>
                }
              />

              <Route
                path="/historico"
                element={
                  <PrivateRoute>
                    <HistoricoPage />
                  </PrivateRoute>
                }
              />

              <Route
                path="/relatorios"
                element={
                  <PrivateRoute>
                    <RelatoriosPage />
                  </PrivateRoute>
                }
              />

              <Route
                path="/notas"
                element={
                  <PrivateRoute>
                    <NotasPage />
                  </PrivateRoute>
                }
              />

              <Route
                path="/jobs"
                element={
                  <PrivateRoute>
                    <JobsPage />
                  </PrivateRoute>
                }
              />
              
             <Route
                path="/caixa"
                element={
                  <PrivateRoute>
                    <CaixaPage />
                  </PrivateRoute>
                }
              />

              <Route
                path="/diagnostico"
                element={
                  <PrivateRoute>
                    <DiagnosticoPage />
                  </PrivateRoute>
                }
              />
              
              {/* Rota padrão → dashboard */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </>
        );
      };


export default function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </HashRouter>
  );
}