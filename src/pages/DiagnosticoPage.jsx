// src/pages/DiagnosticoPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTema } from '../hooks/useTema';
import { configService } from '../services/configService';
import { diagnosticoService } from '../services/diagnosticoService';
import RelogioHeader from '../components/RelogioHeader';
import './DiagnosticoPage.css';
import { logoUrl } from '../assets';


const ABAS = [
  { id: 'sem_ambos',      label: '🔴 Crítico (sem NCM e CFOP)' },
  { id: 'sem_ncm',        label: '🟠 Sem NCM' },
  { id: 'sem_cfop',       label: '🟠 Sem CFOP' },
  { id: 'cfop_invalido',  label: '🟡 CFOP Inválido' },
];

export default function DiagnosticoPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const tema = useTema();

  const [empresaNome, setEmpresaNome] = useState('');
  const [dias, setDias] = useState(90);
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(false);
  const [aba, setAba] = useState('sem_ambos');
  const [busca, setBusca] = useState('');

  useEffect(() => {
    configService.carregar().then((cfg) => {
      if (cfg?.empresaNome) setEmpresaNome(cfg.empresaNome);
    });
  }, []);

  const carregar = useCallback(async (d) => {
    setLoading(true);
    try {
      const result = await diagnosticoService.produtos(d ?? dias);
      setDados(result);
    } catch (err) {
      console.error(err);
      setDados(null);
    } finally {
      setLoading(false);
    }
  }, [dias]);

  useEffect(() => { carregar(); }, [carregar]);

  const iniciais = (user?.nomeFuncionario || user?.nome || 'US')
    .split(' ')
    .map((p) => p[0]).slice(0, 2).join('').toUpperCase();

  const listaAtual = (() => {
    if (!dados) return [];
    const l = dados[aba] || [];
    if (!busca.trim()) return l;
    const b = busca.toLowerCase();
    return l.filter((p) =>
      (p.referencia || '').toLowerCase().includes(b) ||
      (p.descricao || '').toLowerCase().includes(b)
    );
  })();

  const resumo = dados?.resumo || {};

  return (
    <div className="diag-container">
      <header className="dash-header">
        <div className="dash-header-left">
          <button className="notas-btn-voltar" onClick={() => navigate('/dashboard')}>
            ← Voltar
          </button>
          <div className="mesas-header-logo-circle">
            <img src={logoUrl} alt="WDS Food" className="mesas-header-logo-img" />
          </div>
          <div>
            <h1 className="dash-header-title">Diagnóstico de Cadastros</h1>
            <div className="dash-header-subtitle">
              {empresaNome ? `${empresaNome} • ` : ''}
              Últimos {dias} dias
            </div>
          </div>
        </div>
        <div className="mesas-header-right">
          <RelogioHeader cor={tema.cor} />
          <div className="mesas-user-bloco">
            <div className="mesas-header-user-name">
              {user?.nomeFuncionario || user?.nome || 'Usuário'}
            </div>
          </div>
          <div className="mesas-user-avatar" style={{ backgroundColor: tema.cor }}>
            {iniciais}
          </div>
          <button className="mesas-btn-sair" onClick={logout}>Sair</button>
        </div>
      </header>

      {/* Filtros */}
      <div className="diag-filtros">
        <div className="diag-filtro">
          <label>Analisar produtos vendidos nos últimos</label>
          <select value={dias} onChange={(e) => setDias(parseInt(e.target.value, 10))}>
            <option value={30}>30 dias</option>
            <option value={60}>60 dias</option>
            <option value={90}>90 dias</option>
            <option value={180}>180 dias</option>
            <option value={365}>1 ano</option>
          </select>
        </div>
        <div className="diag-filtro diag-filtro-busca">
          <label>Buscar</label>
          <input
            type="text"
            placeholder="Referência ou descrição..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
        <button className="diag-btn-buscar" style={{ backgroundColor: tema.cor }} onClick={() => carregar()}>
          🔍 Reanalisar
        </button>
      </div>

      {/* Cards de resumo */}
      <div className="diag-cards">
        <button className={`diag-card diag-card-vermelho ${aba === 'sem_ambos' ? 'ativo' : ''}`} onClick={() => setAba('sem_ambos')}>
          <div className="diag-card-valor">{resumo.sem_ambos || 0}</div>
          <div className="diag-card-label">Sem NCM e CFOP</div>
          <div className="diag-card-sub">🔴 Não emite</div>
        </button>
        <button className={`diag-card diag-card-laranja ${aba === 'sem_ncm' ? 'ativo' : ''}`} onClick={() => setAba('sem_ncm')}>
          <div className="diag-card-valor">{resumo.sem_ncm || 0}</div>
          <div className="diag-card-label">Sem NCM</div>
          <div className="diag-card-sub">🔴 Não emite</div>
        </button>
        <button className={`diag-card diag-card-laranja ${aba === 'sem_cfop' ? 'ativo' : ''}`} onClick={() => setAba('sem_cfop')}>
          <div className="diag-card-valor">{resumo.sem_cfop || 0}</div>
          <div className="diag-card-label">Sem CFOP</div>
          <div className="diag-card-sub">🔴 Não emite</div>
        </button>
        <button className={`diag-card diag-card-amarelo ${aba === 'cfop_invalido' ? 'ativo' : ''}`} onClick={() => setAba('cfop_invalido')}>
          <div className="diag-card-valor">{resumo.cfop_invalido || 0}</div>
          <div className="diag-card-label">CFOP Inválido</div>
          <div className="diag-card-sub">🟡 CFOP não existe em tab_cfop</div>
        </button>
      </div>

      {/* Abas */}
      <div className="diag-abas">
        {ABAS.map((a) => (
          <button
            key={a.id}
            className={`diag-aba ${aba === a.id ? 'ativa' : ''}`}
            onClick={() => setAba(a.id)}
          >
            {a.label} ({resumo[a.id === 'sem_ambos' ? 'sem_ambos' : a.id] || 0})
          </button>
        ))}
      </div>

      {/* Lista */}
      <div className="diag-lista-wrap">
        {loading ? (
          <div className="diag-vazio">Analisando...</div>
        ) : listaAtual.length === 0 ? (
          <div className="diag-vazio">
            <div className="diag-vazio-icon">✅</div>
            <div className="diag-vazio-msg">
              Nenhum problema encontrado nesta categoria
            </div>
          </div>
        ) : (
          <table className="diag-tabela">
            <thead>
              <tr>
                <th>Referência</th>
                <th>Descrição</th>
                <th>NCM</th>
                <th>CFOP</th>
              </tr>
            </thead>
            <tbody>
              {listaAtual.map((p) => (
                <tr key={p.referencia} className="diag-linha">
                  <td className="diag-col-ref">{p.referencia}</td>
                  <td>{p.descricao}</td>
                  <td className={!p.ncm ? 'diag-vazio-cell' : ''}>
                    {p.ncm || '(vazio)'}
                  </td>
                  <td className={!p.cfop ? 'diag-vazio-cell' : ''}>
                    {p.cfop || '(vazio)'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Aviso CFOPs únicos */}
      {aba === 'cfop_invalido' && dados?.cfops_invalidos_unicos?.length > 0 && (
        <div className="diag-cfops-unicos">
          <div className="diag-cfops-titulo">CFOPs inválidos mais comuns:</div>
          {dados.cfops_invalidos_unicos.map((c, i) => (
            <div key={i} className="diag-cfop-linha">
              <span className="diag-cfop-codigo">{c.cfop}</span>
              <span className="diag-cfop-qtd">{c.qtd_produtos} produto(s)</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}