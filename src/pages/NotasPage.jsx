// src/pages/NotasPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTema } from '../hooks/useTema';
import { configService } from '../services/configService';
import { notaService } from '../services/notaService';
import NotaDetalhesModal from '../components/NotaDetalhesModal';
import RelogioHeader from '../components/RelogioHeader';
import './NotasPage.css';
import { logoUrl } from '../assets';

const hoje = () => new Date().toISOString().split('T')[0];

// ✅ Formata data ISO (YYYY-MM-DD) para BR (DD/MM/YYYY)
const fmtDataBR = (dataISO) => {
  if (!dataISO) return '-';
  const [y, m, d] = String(dataISO).split('-');
  return `${d}/${m}/${y}`;
};

// ✅ Formata data + hora
const fmtDataHoraBR = (dataISO, hora) => {
  const d = fmtDataBR(dataISO);
  return hora ? `${d} ${String(hora).slice(0, 5)}` : d;
};

const STATUS_CORES = {
  0: { cor: '#95a5a6', label: 'Digitada' },
  1: { cor: '#3498db', label: 'Validada' },
  2: { cor: '#f39c12', label: 'Processando' },
  3: { cor: '#27ae60', label: 'Autorizada' },
  4: { cor: '#e74c3c', label: 'Rejeitada' },
  5: { cor: '#c0392b', label: 'Denegada' },
  6: { cor: '#7f8c8d', label: 'Cancelada' },
  7: { cor: '#95a5a6', label: 'Inutilizada' },
  8: { cor: '#e67e22', label: 'Contingência' },
};

export default function NotasPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const tema = useTema();

  const [empresaNome, setEmpresaNome] = useState('');
  const [dataIni, setDataIni] = useState(hoje());
  const [dataFim, setDataFim] = useState(hoje());
  const [statusFiltro, setStatusFiltro] = useState('');
  const [busca, setBusca] = useState('');
  const [lista, setLista] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notaSelecionada, setNotaSelecionada] = useState(null);
  const [filtrouHoje, setFiltrouHoje] = useState(true);

  useEffect(() => {
    configService.carregar().then((cfg) => {
      if (cfg?.empresaNome) setEmpresaNome(cfg.empresaNome);
    });
  }, []);

  const carregar = useCallback(async (overrideIni, overrideFim) => {
    setLoading(true);
    try {
      const dados = await notaService.listar({
        dataIni: overrideIni ?? dataIni,
        dataFim: overrideFim ?? dataFim,
        status: statusFiltro === '' ? null : parseInt(statusFiltro, 10),
      });
      setLista(dados?.nfce || []);
    } catch (err) {
      console.error('Erro ao listar notas:', err);
      setLista([]);
    } finally {
      setLoading(false);
    }
  }, [dataIni, dataFim, statusFiltro]);

  useEffect(() => { carregar(); }, [carregar]);

  const handleVer7Dias = () => {
    const ini = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString().split('T')[0];
    setDataIni(ini);
    setDataFim(hoje());
    setFiltrouHoje(false);
    carregar(ini, hoje());
  };

  const listaFiltrada = lista.filter((n) => {
    if (!busca.trim()) return true;
    const b = busca.toLowerCase();
    return (
      String(n.numero).includes(b) ||
      (n.cliente_nome || '').toLowerCase().includes(b) ||
      (n.chave || '').includes(b)
    );
  });

  const iniciais = (user?.nomeFuncionario || user?.nome || 'US')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="notas-container">
      {/* ✅ HEADER padrão (igual ao Dashboard) */}
      <header className="dash-header">
        <div className="dash-header-left">
          <button className="notas-btn-voltar" onClick={() => navigate('/dashboard')}>
            ← Voltar
          </button>
          <div className="mesas-header-logo-circle">
            <img src={logoUrl} alt="WDS Food" className="mesas-header-logo-img" />
          </div>
          <div>
            <h1 className="dash-header-title">Notas Fiscais</h1>
            <div className="dash-header-subtitle">
              {empresaNome ? `${empresaNome} • ` : ''}
              {tema.nome}
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
          <button className="mesas-btn-sair" onClick={logout}>
            Sair
          </button>
        </div>
      </header>

      {/* Filtros */}
      <div className="notas-filtros">
        <div className="notas-filtro">
          <label>De</label>
          <input
            type="date"
            value={dataIni}
            onChange={(e) => setDataIni(e.target.value)}
          />
        </div>
        <div className="notas-filtro">
          <label>Até</label>
          <input
            type="date"
            value={dataFim}
            onChange={(e) => setDataFim(e.target.value)}
          />
        </div>
        <div className="notas-filtro">
          <label>Status</label>
          <select value={statusFiltro} onChange={(e) => setStatusFiltro(e.target.value)}>
            <option value="">Todos</option>
            <option value="3">Autorizada</option>
            <option value="4">Rejeitada</option>
            <option value="6">Cancelada</option>
            <option value="7">Inutilizada</option>
            <option value="8">Contingência</option>
          </select>
        </div>
        <div className="notas-filtro notas-filtro-busca">
          <label>Buscar</label>
          <input
            type="text"
            placeholder="Nº, cliente ou chave..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
        <button
          className="notas-btn-buscar"
          style={{ backgroundColor: tema.cor }}
          onClick={() => carregar()}
        >
          🔍 Buscar
        </button>
      </div>

      {/* Lista */}
      <div className="notas-lista-wrap">
        {loading ? (
          <div className="notas-vazio">Carregando...</div>
        ) : listaFiltrada.length === 0 ? (
          <div className="notas-vazio">
            <div className="notas-vazio-icon">📭</div>
            <div className="notas-vazio-msg">Nenhuma nota encontrada hoje</div>
            {filtrouHoje && (
              <button className="notas-btn-7dias" onClick={handleVer7Dias}>
                Ver últimos 7 dias
              </button>
            )}
          </div>
        ) : (
          <table className="notas-tabela">
            <thead>
              <tr>
                <th>Nº</th>
                <th>Série</th>
                <th>Data/Hora</th>
                <th>Cliente</th>
                <th>Total</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {listaFiltrada.map((n) => {
                const st = STATUS_CORES[n.status] || { cor: '#95a5a6', label: '?' };
                return (
                  <tr
                    key={n.numero}
                    className="notas-linha"
                    onClick={() => setNotaSelecionada(n)}
                  >
                    <td className="notas-col-num">{String(n.numero).padStart(6, '0')}</td>
                    <td>{n.serie}</td>
                    {/* ✅ Data em formato BR */}
                    <td>{fmtDataHoraBR(n.data, n.hora)}</td>
                    <td>{n.cliente_nome}</td>
                    <td className="notas-col-total">R$ {parseFloat(n.total).toFixed(2)}</td>
                    <td>
                      <span
                        className="notas-status-badge"
                        style={{ backgroundColor: st.cor }}
                      >
                        {st.label}
                      </span>
                    </td>
                    <td className="notas-col-acao">›</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {notaSelecionada && (
        <NotaDetalhesModal
          nota={notaSelecionada}
          onClose={() => setNotaSelecionada(null)}
          onAtualizar={() => carregar()}
        />
      )}
    </div>
  );
}