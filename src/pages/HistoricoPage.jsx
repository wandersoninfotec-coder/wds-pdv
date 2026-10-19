// src/pages/HistoricoPage.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTema } from '../hooks/useTema';
import { configService } from '../services/configService';
import { historicoService } from '../services/historicoService';
import DetalhesPedidoModal from '../components/DetalhesPedidoModal';
import './HistoricoPage.css';
import { logoUrl } from '../assets';


const PERIODOS = [
  { id: 'hoje', label: 'Hoje' },
  { id: '7dias', label: '7 dias' },
  { id: 'mes', label: 'Este mês' },
  { id: 'todos', label: 'Todos' },
];

const STATUS_OPCOES = [
  { id: 'todas', label: 'Todas' },
  { id: 'fechadas', label: 'Fechadas' },
  { id: 'canceladas', label: 'Canceladas' },
];

export default function HistoricoPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const tema = useTema();
  const [vendas, setVendas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState('hoje');
  const [status, setStatus] = useState('todas');
  const [empresaNome, setEmpresaNome] = useState('');
  const [vendaSelecionada, setVendaSelecionada] = useState(null);

  // ✅ NOVO: filtro por mesa
  const [mesaFiltro, setMesaFiltro] = useState('');
  const [mesaAplicada, setMesaAplicada] = useState(null);
  const mesaInputRef = useRef(null);

  const carregarHistorico = useCallback(async () => {
    setLoading(true);
    try {
      const data = await historicoService.listar(
        periodo,
        status,
        mesaAplicada
      );
      setVendas(data);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
      setVendas([]);
    } finally {
      setLoading(false);
    }
  }, [periodo, status, mesaAplicada]);

  useEffect(() => {
    carregarHistorico();
  }, [carregarHistorico]);

  useEffect(() => {
    configService.carregar().then((cfg) => {
      if (cfg?.empresaNome) setEmpresaNome(cfg.empresaNome);
    });
  }, []);

  // ✅ Aplica o filtro de mesa
  const handleAplicarMesa = () => {
    const valor = mesaFiltro.trim();
    if (!valor) {
      setMesaAplicada(null);
      return;
    }
    setMesaAplicada(valor);
  };

  const handleLimparMesa = () => {
    setMesaFiltro('');
    setMesaAplicada(null);
    if (mesaInputRef.current) mesaInputRef.current.focus();
  };

  const handleMesaKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAplicarMesa();
    }
    if (e.key === 'Escape') {
      handleLimparMesa();
    }
  };

  const formatarData = (dataStr, hora) => {
    if (!dataStr) return '';
    try {
      const data = new Date(dataStr);
      const dia = String(data.getDate()).padStart(2, '0');
      const mes = String(data.getMonth() + 1).padStart(2, '0');
      return `${dia}/${mes} ${hora || ''}`;
    } catch {
      return dataStr;
    }
  };

  const formatarDataDetalhes = (dataStr, hora) => {
    if (!dataStr) return '';
    try {
      const data = new Date(dataStr);
      const dia = String(data.getDate()).padStart(2, '0');
      const mes = String(data.getMonth() + 1).padStart(2, '0');
      const ano = data.getFullYear();
      return `${dia}/${mes}/${ano} às ${hora || ''}`;
    } catch {
      return dataStr;
    }
  };

  const handleVendaClick = (venda) => {
    setVendaSelecionada(venda);
  };

  const iniciais = (user?.nomeFuncionario || user?.nome || 'US')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  // Resumo
  const vendasFechadas = vendas.filter((v) => v.status === 1);
  const totalPeriodo = vendasFechadas.reduce(
    (sum, v) => sum + (parseFloat(v.total) || 0),
    0
  );

  return (
    <div className="hist-container">
      <header className="hist-header">
        <div className="dash-header-left">
            <button
              className="mesas-header-back"
              onClick={() => navigate('/dashboard')}
              title="Voltar para o Dashboard"
            >
              ←
            </button>
          <div className="mesas-header-logo-circle">
             <img src={logoUrl} alt="WDS Food" className="mesas-header-logo-img" />
          </div>
          <div>
            <h1 className="dash-header-title">WDS Food PDV</h1>
            <div className="dash-header-subtitle">
              {empresaNome ? `${empresaNome} • ` : ''}
              {tema.nome}
            </div>
          </div>
        </div>

        <div className="hist-header-right">
          <div className="hist-user-info">
            <div className="hist-user-name">
              {user?.nomeFuncionario || user?.nome || 'Usuário'}
            </div>
            <div className="hist-user-role">
              Empresa {user?.empresa || 1}
            </div>
          </div>
          <div
            className="hist-user-avatar"
            style={{ backgroundColor: tema.cor }}
          >
            {iniciais}
          </div>
          <button className="hist-btn-sair" onClick={logout}>
            Sair
          </button>
        </div>
      </header>

      {/* Filtros */}
      <div className="hist-filtros">
        <div className="hist-filtro-grupo">
          <span className="hist-filtro-label">Período:</span>
          <div className="hist-chips">
            {PERIODOS.map((p) => (
              <button
                key={p.id}
                className={`hist-chip ${periodo === p.id ? 'ativo' : ''}`}
                style={periodo === p.id ? { backgroundColor: tema.cor } : {}}
                onClick={() => setPeriodo(p.id)}
                type="button"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="hist-filtro-grupo">
          <span className="hist-filtro-label">Status:</span>
          <div className="hist-chips">
            {STATUS_OPCOES.map((s) => (
              <button
                key={s.id}
                className={`hist-chip ${status === s.id ? 'ativo' : ''}`}
                style={status === s.id ? { backgroundColor: tema.cor } : {}}
                onClick={() => setStatus(s.id)}
                type="button"
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* ✅ NOVO: filtro de mesa */}
        <div className="hist-filtro-grupo hist-filtro-mesa">
          <span className="hist-filtro-label">Mesa:</span>
          <input
            ref={mesaInputRef}
            type="text"
            className="hist-mesa-input"
            value={mesaFiltro}
            onChange={(e) => setMesaFiltro(e.target.value.replace(/\D/g, ''))}
            onKeyDown={handleMesaKeyDown}
            placeholder="Nº da mesa"
            maxLength={4}
            style={{
              borderColor: mesaAplicada ? tema.cor : '#e0e5ec',
            }}
          />
          {mesaFiltro && !mesaAplicada && (
            <button
              className="hist-mesa-btn"
              onClick={handleAplicarMesa}
              style={{ backgroundColor: tema.cor }}
              type="button"
            >
              Buscar
            </button>
          )}
          {mesaAplicada && (
            <button
              className="hist-mesa-limpar"
              onClick={handleLimparMesa}
              type="button"
              title="Limpar filtro de mesa"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Badge de filtro ativo */}
      {mesaAplicada && (
        <div className="hist-filtro-ativo">
          <span>
            🔍 Filtrando por <strong>Mesa {mesaAplicada}</strong>
          </span>
          <button
            className="hist-filtro-ativo-limpar"
            onClick={handleLimparMesa}
            type="button"
          >
            Limpar filtro
          </button>
        </div>
      )}

      {/* Resumo */}
      <div className="hist-resumo">
        <div className="hist-resumo-esquerda">
          <div className="hist-resumo-item">
            <span className="hist-resumo-label">Vendas</span>
            <span className="hist-resumo-valor">{vendasFechadas.length}</span>
          </div>
          <div className="hist-resumo-item">
            <span className="hist-resumo-label">Faturamento</span>
            <span className="hist-resumo-valor destaque">
              R$ {totalPeriodo.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Lista */}
      <div className="hist-content">
        {loading ? (
          <div className="hist-loading">
            <div
              className="hist-loading-spinner"
              style={{ borderTopColor: tema.cor }}
            />
            Carregando...
          </div>
        ) : vendas.length === 0 ? (
          <div className="hist-vazio">
            <div className="hist-vazio-icon">🧾</div>
            <div className="hist-vazio-titulo">
              {mesaAplicada
                ? `Nenhuma venda encontrada para a Mesa ${mesaAplicada}`
                : 'Nenhuma venda encontrada'}
            </div>
            <div className="hist-vazio-sub">
              {mesaAplicada
                ? 'Tente outro período ou remova o filtro'
                : 'Altere os filtros para ver mais resultados'}
            </div>
          </div>
        ) : (
          <div className="hist-lista">
            {vendas.map((v) => {
              const cancelada = v.status === 2;
              return (
                <div
                  key={v.venda}
                  className={`hist-venda ${cancelada ? 'cancelada' : ''}`}
                  onClick={() => handleVendaClick(v)}
                >
                  <div className="hist-venda-numero">#{v.venda}</div>
                  <div className="hist-venda-mesa">
                    {v.mesa_descricao || `Mesa ${v.mesa}`}
                  </div>
                  <div className="hist-venda-vendedor">
                    👤 {v.vendedor_nome || `#${v.vendedor}`}
                  </div>
                  <div className="hist-venda-data">
                    {formatarData(v.data, v.hora)}
                  </div>
                  <div className="hist-venda-total">
                    R$ {parseFloat(v.total).toFixed(2)}
                  </div>
                  <div
                    className={`hist-venda-status ${
                      cancelada ? 'cancelada' : 'fechada'
                    }`}
                  >
                    {cancelada ? 'CANC' : 'OK'}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {vendaSelecionada && (
        <DetalhesPedidoModal
          venda={vendaSelecionada.venda}
          onClose={() => setVendaSelecionada(null)}
          formatarData={formatarDataDetalhes}
        />
      )}
    </div>
  );
}