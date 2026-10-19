// src/pages/DashboardPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTema } from '../hooks/useTema';
import { usePermissoes } from '../hooks/usePermissoes';
import { mesaService } from '../services/mesaService';
import { configService } from '../services/configService';
import RelogioHeader from '../components/RelogioHeader';
import { tefService } from '../services/tefService';   // ← ADICIONAR
import api from '../services/api';                      // ← ADICIONAR
import { getEmpresa } from '../config';
import './DashboardPage.css';
import { logoUrl } from '../assets';


export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const tema = useTema();
  const permissoes = usePermissoes();
  const [empresaNome, setEmpresaNome] = useState('');

  

  const [stats, setStats] = useState({
    livres: 0,
    ocupadas: 0,
    total: 0,
    emAberto: 0,
  });

  const carregarStats = useCallback(async () => {
    try {
      const data = await mesaService.listar();

      let lista = [];
      if (Array.isArray(data)) lista = data;
      else if (data && typeof data === 'object') {
        lista = data.mesas || data.data || Object.values(data);
      }

      const normalizadas = lista.map((m) => {
        const vendaNum = parseInt(m.venda ?? m.venda_atual ?? 0) || 0;
        return {
          status: vendaNum > 0 ? 'ocupada' : 'livre',
          total: parseFloat(m.total) || 0,
        };
      });

      const livres = normalizadas.filter((m) => m.status === 'livre').length;
      const ocupadas = normalizadas.filter((m) => m.status === 'ocupada')
        .length;

      const emAberto = normalizadas
        .filter((m) => m.status === 'ocupada')
        .reduce((sum, m) => sum + m.total, 0);

      setStats({
        livres,
        ocupadas,
        total: normalizadas.length,
        emAberto,
      });
    } catch (error) {
      console.error('Erro ao carregar stats:', error);
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const ativo = await tefService.verificarAtivo();
        if (!ativo?.usa_tef) return;

        const dados = await api.post('/app/dadosEmpresa', { empresa: getEmpresa() });
        const nome = dados.data?.fantasia || dados.data?.nome || 'PDV';

        await tefService.mostrarMensagemPinpad(
          tefService.montarBoasVindas(nome, 16),
          true
        );
      } catch (err) {
        console.error('[TEF] Boas-vindas PinPad FALHOU:', err);
      }
    })();
  }, []);

  useEffect(() => {
    carregarStats();
    const interval = setInterval(carregarStats, 15000);
    return () => clearInterval(interval);
  }, [carregarStats]);

  useEffect(() => {
    configService.carregar().then((cfg) => {
      if (cfg?.empresaNome) setEmpresaNome(cfg.empresaNome);
    });
  }, []);

  const iniciais = (user?.nomeFuncionario || user?.nome || 'US')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="dash-container">
      <header className="dash-header">
        <div className="dash-header-left">
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

         <div className="mesas-header-right">
          {/* ✅ Relógio em tempo real */}
          <RelogioHeader cor={tema.cor} />

          {/* ✅ Nome + Avatar juntos */}
          <div className="mesas-user-bloco">            
            <div className="mesas-header-user-name">
              {user?.nomeFuncionario || user?.nome || 'Usuário'}
            </div>
          </div>
          <div
              className="mesas-user-avatar"
              style={{ backgroundColor: tema.cor }}
            >
              {iniciais}
          </div>
          <button className="mesas-btn-sair" onClick={logout}>
            Sair
          </button>
        </div>
      </header>

      <div className="dash-content">
        <div className="dash-welcome">
          <h2 className="dash-welcome-title">
            Bem-vindo, {user?.nomeFuncionario || user?.nome}!
          </h2>
          <div className="dash-welcome-subtitle">
            Selecione uma opção para começar
          </div>
        </div>

        {/* Resumo */}
        <div className="dash-stats">
          <div className="dash-stat" style={{ borderLeftColor: '#27ae60' }}>
            <div
              className="dash-stat-icon-wrap"
              style={{ backgroundColor: '#eaf9f1' }}
            >
              <span className="dash-stat-icon">🪑</span>
            </div>
            <div>
              <div className="dash-stat-label">Mesas Livres</div>
              <div className="dash-stat-valor" style={{ color: '#27ae60' }}>
                {stats.livres}
              </div>
            </div>
          </div>

          <div className="dash-stat" style={{ borderLeftColor: '#c0392b' }}>
            <div
              className="dash-stat-icon-wrap"
              style={{ backgroundColor: '#fdecea' }}
            >
              <span className="dash-stat-icon">{tema.icones.pedidos}</span>
            </div>
            <div>
              <div className="dash-stat-label">Mesas Ocupadas</div>
              <div className="dash-stat-valor" style={{ color: '#c0392b' }}>
                {stats.ocupadas}
              </div>
            </div>
          </div>

          <div className="dash-stat" style={{ borderLeftColor: tema.cor }}>
            <div
              className="dash-stat-icon-wrap"
              style={{ backgroundColor: tema.corSuave }}
            >
              <span className="dash-stat-icon">{tema.icones.mesas}</span>
            </div>
            <div>
              <div className="dash-stat-label">Total de Mesas</div>
              <div className="dash-stat-valor" style={{ color: tema.cor }}>
                {stats.total}
              </div>
            </div>
          </div>


          {/* ✅ "Em Aberto" só aparece se tiver permissão */}
          {permissoes.visualizarRelatorios && (
            <div className="dash-stat" style={{ borderLeftColor: '#f39c12' }}>
              <div
                className="dash-stat-icon-wrap"
                style={{ backgroundColor: '#fef3e5' }}
              >
                <span className="dash-stat-icon">💰</span>
              </div>
              <div>
                <div className="dash-stat-label">Em Aberto</div>
                <div className="dash-stat-valor" style={{ color: '#f39c12' }}>
                  R$ {stats.emAberto.toFixed(2)}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Ações rápidas */}
        <div className="dash-section-title">⚡ Ações Rápidas</div>

        <div className="dash-actions">          

        {user?.usaControleMesas === false ? (
          // ========== MODO PDV (N) — só botão PDV ==========
          <button
            className="dash-action primary"
            style={{ backgroundColor: tema.cor }}
            onClick={() => navigate('/pdv')}
          >
            <div className="dash-action-icon">🛒</div>
            <div className="dash-action-title">PDV</div>
            <div className="dash-action-subtitle">Venda direta no balcão</div>
          </button>
        ) : (
          // ========== MODO MESAS (S) — Mesas + Venda Direta ==========
          <>
            <button
              className="dash-action primary"
              style={{ backgroundColor: tema.cor }}
              onClick={() => navigate('/mesas')}
            >
              <div className="dash-action-icon">{tema.icones.mesas}</div>
              <div className="dash-action-title">Mesas</div>
              <div className="dash-action-subtitle">Ver e fechar mesas</div>
            </button>

            <button
              className="dash-action"
              onClick={() => navigate('/venda-direta')}
            >
              <div className="dash-action-icon">🛒</div>
              <div className="dash-action-title">Venda Direta</div>
              <div className="dash-action-subtitle">Balcão rápido</div>
            </button>
          </>
        )}

          {permissoes.visualizarHistorico && (
            <button
              className="dash-action"
              onClick={() => navigate('/historico')}
            >
              <div className="dash-action-icon">🧾</div>
              <div className="dash-action-title">Histórico</div>
              <div className="dash-action-subtitle">Vendas do dia</div>
            </button>
          )}

          <button className="dash-action" onClick={() => navigate('/notas')}>
            <div className="dash-action-icon">🧾</div>
            <div className="dash-action-title">Notas Fiscais</div>
            <div className="dash-action-subtitle">Emitidas, cancelar, inutilizar</div>
          </button>

          <button className="dash-action" onClick={() => navigate('/diagnostico')}>
            <div className="dash-action-icon">🔍</div>
            <div className="dash-action-title">Diagnóstico</div>
            <div className="dash-action-subtitle">Produtos com cadastro incompleto</div>
          </button>

          <button className="dash-action" onClick={() => navigate('/jobs')}>
            <div className="dash-action-icon">⚙️</div>
            <div className="dash-action-title">Automações</div>
            <div className="dash-action-subtitle">Jobs de manutenção</div>
          </button>

          {permissoes.visualizarRelatorios && (
            <button
              className="dash-action"
              onClick={() => navigate('/relatorios')}
            >
              <div className="dash-action-icon">{tema.icones.dashboard}</div>
              <div className="dash-action-title">Relatórios</div>
              <div className="dash-action-subtitle">Análise de vendas</div>
            </button>
          )}

         {permissoes.visualizarCaixa && (
            <button className="dash-action" onClick={() => navigate('/caixa')}>
              <div className="dash-action-icon">💵</div>
              <div className="dash-action-title">Caixa</div>
              <div className="dash-action-subtitle">Movimento do dia</div>
            </button>
          )}

          

          {permissoes.visualizarConfiguracoes && (
            <button
              className="dash-action"
              onClick={() => navigate('/config')}
            >
              <div className="dash-action-icon">{tema.icones.config}</div>
              <div className="dash-action-title">Configurações</div>
              <div className="dash-action-subtitle">IP, empresa, tema</div>
            </button>
          )}
        </div>
      </div>

      <div className="dash-footer">
        {tema.icone} WDS Food PDV • {tema.nome} • v1.0.0
      </div>
    </div>
  );
}