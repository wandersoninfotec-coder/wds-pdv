// src/components/AutorizarCancelamentoModal.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useTema } from '../hooks/useTema';
import { getEmpresa } from '../config';
import api from '../services/api';
import './AutorizarCancelamentoModal.css';

export default function AutorizarCancelamentoModal({ motivo, onAutorizado, onCancelar }) {
  const tema = useTema();
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const userRef = useRef(null);

  useEffect(() => { setTimeout(() => userRef.current?.focus(), 100); }, []);

  const handleAutorizar = async () => {
    if (!usuario.trim() || !senha.trim()) {
      setErro('Preencha usuário e senha');
      return;
    }
    setLoading(true);
    setErro('');
    try {
      const r = await api.post('/app/autorizarCancelamento', {
        empresa: getEmpresa(),
        usuario: usuario.trim(),
        senha,
      });
      if (r.data.autorizado) {
        onAutorizado(r.data.supervisor);
      } else {
        setErro(r.data.erro || 'Não autorizado');
      }
    } catch (e) {
      setErro(e.response?.data?.erro || e.message || 'Erro ao autorizar');
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); handleAutorizar(); }
    if (e.key === 'Escape') onCancelar();
  };

  return (
    <div className="acm-overlay" onClick={onCancelar}>
      <div
        className="acm-content"
        style={{ '--tema-cor': tema.cor, '--tema-cor-suave': tema.corSuave }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="acm-icon">🔐</div>
        <h2 className="acm-titulo">Autorização Necessária</h2>
        <p className="acm-sub">
          {motivo || 'Sua conta não tem permissão para cancelar vendas. Peça a um supervisor.'}
        </p>

        <label className="acm-label">Usuário (supervisor)</label>
        <input
          ref={userRef}
          type="text"
          className="acm-input"
          value={usuario}
          onChange={(e) => setUsuario(e.target.value)}
          onKeyDown={handleKey}
          autoComplete="off"
          disabled={loading}
        />

        <label className="acm-label">Senha</label>
        <input
          type="password"
          className="acm-input"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          onKeyDown={handleKey}
          autoComplete="off"
          disabled={loading}
        />

        {erro && <div className="acm-erro">⚠️ {erro}</div>}

        <div className="acm-acoes">
          <button className="acm-btn acm-btn-cinza" onClick={onCancelar} disabled={loading}>
            Cancelar
          </button>
          <button
            className="acm-btn acm-btn-primario"
            style={{ backgroundColor: tema.cor }}
            onClick={handleAutorizar}
            disabled={loading}
          >
            {loading ? 'Verificando...' : '🔓 Autorizar'}
          </button>
        </div>
      </div>
    </div>
  );
}