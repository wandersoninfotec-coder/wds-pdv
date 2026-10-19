// src/pages/LoginPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import { useTema } from '../hooks/useTema';
import { configService } from '../services/configService';
import './LoginPage.css';
import { logoUrl } from '../assets';
import { getEmpresa } from '../config';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const tema = useTema();
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [empresaNome, setEmpresaNome] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    setErro('');

    if (!usuario.trim() || !senha) {
      setErro('Preencha usuário e senha');
      return;
    }

    setLoading(true);
    try {
      const resultado = await authService.login(usuario.trim(), senha, getEmpresa(),) ;
      if (resultado.success) {
        await login(resultado.token, resultado.user);
        navigate('/dashboard', { replace: true });
      } else {
        setErro(resultado.error || 'Falha no login');
      }
    } catch (error) {
      console.error('Erro:', error);
      setErro('Erro inesperado ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          {/* ✅ Logo da empresa */}
          <img
            src={logoUrl}
            alt="WDS Food"
            className="login-logo-img"
          />
          <div className="login-title">WDS Food PDV</div>
          <div className="login-subtitle">{tema.nome}</div>
        </div>
        <form className="login-form" onSubmit={handleSubmit}>
          <label className="login-label">Usuário</label>
          <input
            type="text"
            className="login-input"
            value={usuario}
            onChange={(e) => setUsuario(e.target.value.toUpperCase())}
            placeholder="Digite seu usuário"
            autoFocus
            autoComplete="username"
            spellCheck={false}
            disabled={loading}
          />

          <label className="login-label">Senha</label>
          <div className="login-input-wrapper">
            <input
              type={mostrarSenha ? 'text' : 'password'}
              className="login-input login-input-with-icon"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Digite sua senha"
              autoComplete="current-password"
              disabled={loading}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSubmit(e);
              }}
            />
            <button
              type="button"
              className="login-eye"
              onClick={() => setMostrarSenha(!mostrarSenha)}
              tabIndex={-1}
            >
              {mostrarSenha ? '🙈' : '👁️'}
            </button>
          </div>

          {erro && <div className="login-erro">{erro}</div>}

          <button
            type="submit"
            className="login-button"
            style={{ backgroundColor: tema.cor }}
            disabled={loading}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div className="login-rodape">
          {empresaNome && (
            <div className="login-empresa">{empresaNome}</div>
          )}
          <div>v1.0.0</div>
        </div>
      </div>
    </div>
  );
}