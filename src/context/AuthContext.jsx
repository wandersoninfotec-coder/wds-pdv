// src/context/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import { sessionService } from '../services/sessionService';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    restaurarSessao();
  }, []);

  const restaurarSessao = async () => {
    try {
      const sessao = await sessionService.carregarSessao();
      if (sessao) {
        setUser(sessao.user);
        setToken(sessao.token);
        console.log('🟢 Sessão restaurada:', sessao.user.nome);
      }
    } catch (error) {
      console.error('Erro ao restaurar sessão:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (authToken, userData) => {
    await sessionService.salvarSessao(authToken, userData);
    setToken(authToken);
    setUser(userData);
  };

  const logout = async () => {
    await sessionService.limparSessao();
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        isAuthenticated: !!token && !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};