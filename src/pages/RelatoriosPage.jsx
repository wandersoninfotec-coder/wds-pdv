// src/pages/RelatoriosPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTema } from '../hooks/useTema';
import { configService } from '../services/configService';
import { relatorioService } from '../services/relatorioService';
import './RelatoriosPage.css';
import { logoUrl } from '../assets';

const PERIODOS = [
  { id: 'hoje', label: 'Hoje' },
  { id: '7dias', label: '7 dias' },
  { id: 'mes', label: 'Este mês' },
  { id: 'todos', label: 'Todos' },
];

export default function RelatoriosPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const tema = useTema();
  const [periodo, setPeriodo] = useState('hoje');
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(true);
  const [empresaNome, setEmpresaNome] = useState('');

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const resultado = await relatorioService.vendas(periodo);
      setDados(resultado);
    } catch (error) {
      console.error('Erro ao carregar relatório:', error);
      setDados(null);
    } finally {
      setLoading(false);
    }
  }, [periodo]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  useEffect(() => {
    configService.carregar().then((cfg) => {
      if (cfg?.empresaNome) setEmpresaNome(cfg.empresaNome);
    });
  }, []);

  const formatarMoeda = (v) => {
    return `R$ ${parseFloat(v || 0).toFixed(2)}`;
  };

  const iniciais = (user?.nomeFuncionario || user?.nome || 'US')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  // Cálculos auxiliares
  const resumo = dados?.resumo || { quantidade: 0, total: 0, ticket_medio: 0 };
  const porForma = dados?.por_forma || [];
  const topProdutos = dados?.top_produtos || [];
  const porDia = dados?.por_dia || [];

  const maiorTotalForma = Math.max(...porForma.map((f) => f.total), 1);
  const maiorDiaTotal = Math.max(...porDia.map((d) => d.total), 1);

  return (
    <div className="rel-container">
      <header className="rel-header">
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

        <div className="rel-header-right">
          <div className="rel-user-info">
            <div className="rel-user-name">
              {user?.nomeFuncionario || user?.nome || 'Usuário'}
            </div>
            <div className="rel-user-role">Empresa {user?.empresa || 1}</div>
          </div>
          <div
            className="rel-user-avatar"
            style={{ backgroundColor: tema.cor }}
          >
            {iniciais}
          </div>
          <button className="rel-btn-sair" onClick={logout}>
            Sair
          </button>
        </div>
      </header>

      {/* Filtros */}
      <div className="rel-filtros">
        <span className="rel-filtro-label">Período:</span>
        {PERIODOS.map((p) => (
          <button
            key={p.id}
            className={`rel-chip ${periodo === p.id ? 'ativo' : ''}`}
            style={periodo === p.id ? { backgroundColor: tema.cor } : {}}
            onClick={() => setPeriodo(p.id)}
            type="button"
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="rel-content">
        {loading ? (
          <div className="rel-loading">Carregando relatório...</div>
        ) : (
          <>
            {/* Cards de resumo */}
            <div className="rel-cards">
              <div className="rel-card" style={{ borderLeftColor: tema.cor }}>
                <div className="rel-card-icon">🧾</div>
                <div className="rel-card-label">Vendas</div>
                <div className="rel-card-valor" style={{ color: tema.cor }}>
                  {resumo.quantidade}
                </div>
              </div>

              <div className="rel-card" style={{ borderLeftColor: '#27ae60' }}>
                <div className="rel-card-icon">💰</div>
                <div className="rel-card-label">Faturamento</div>
                <div
                  className="rel-card-valor"
                  style={{ color: '#27ae60' }}
                >
                  {formatarMoeda(resumo.total)}
                </div>
              </div>

              <div className="rel-card" style={{ borderLeftColor: '#f39c12' }}>
                <div className="rel-card-icon">📊</div>
                <div className="rel-card-label">Ticket Médio</div>
                <div
                  className="rel-card-valor"
                  style={{ color: '#f39c12' }}
                >
                  {formatarMoeda(resumo.ticket_medio)}
                </div>
              </div>
            </div>

            {/* Grid de seções */}
            <div className="rel-grid">
              {/* Por forma de pagamento */}
              <div className="rel-section">
                <div className="rel-section-title">
                  💳 Vendas por Forma de Pagamento
                </div>

                {porForma.length === 0 ? (
                  <div className="rel-vazio">
                    Nenhuma venda no período
                  </div>
                ) : (
                  porForma.map((f) => {
                    const perc =
                      resumo.total > 0 ? (f.total / resumo.total) * 100 : 0;
                    const larguraBarra =
                      (f.total / maiorTotalForma) * 100;
                    return (
                      <div key={f.codigo} className="rel-forma-item">
                        <div className="rel-forma-icone">{f.icone}</div>
                        <div className="rel-forma-info">
                          <div className="rel-forma-nome">{f.nome}</div>
                          <div className="rel-forma-qtd">
                            {f.quantidade}{' '}
                            {f.quantidade === 1 ? 'venda' : 'vendas'}
                          </div>
                          <div
                            style={{
                              height: 4,
                              backgroundColor: '#f0f3f7',
                              borderRadius: 2,
                              marginTop: 6,
                              overflow: 'hidden',
                            }}
                          >
                            <div
                              style={{
                                height: '100%',
                                width: `${larguraBarra}%`,
                                backgroundColor: tema.cor,
                                borderRadius: 2,
                                transition: 'width 0.4s ease',
                              }}
                            />
                          </div>
                        </div>
                        <div>
                          <div className="rel-forma-valor">
                            {formatarMoeda(f.total)}
                          </div>
                          <div className="rel-forma-perc">
                            {perc.toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Top produtos */}
              <div className="rel-section">
                <div className="rel-section-title">
                  🏆 Top 10 Produtos
                </div>

                {topProdutos.length === 0 ? (
                  <div className="rel-vazio">
                    Nenhum produto vendido no período
                  </div>
                ) : (
                  topProdutos.map((p, i) => (
                    <div key={p.referencia} className="rel-produto-item">
                      <div className="rel-produto-rank">{i + 1}</div>
                      <div className="rel-produto-info">
                        <div className="rel-produto-nome">{p.descricao}</div>
                        <div className="rel-produto-qtd">
                          {p.quantidade} unidades
                        </div>
                      </div>
                      <div className="rel-produto-valor">
                        {formatarMoeda(p.total)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Gráfico por dia */}
            {porDia.length > 0 && (
              <div className="rel-section" style={{ marginTop: 20 }}>
                <div className="rel-section-title">
                  📈 Vendas por Dia
                </div>

                <div className="rel-grafico">
                  {porDia.map((d) => {
                    const altura = (d.total / maiorDiaTotal) * 100;
                    const data = new Date(d.dia + 'T12:00:00');
                    const dia = String(data.getDate()).padStart(2, '0');
                    const mes = String(data.getMonth() + 1).padStart(2, '0');
                    return (
                      <div
                        key={d.dia}
                        className="rel-grafico-barra"
                        title={`${dia}/${mes}: R$ ${d.total.toFixed(2)}`}
                      >
                        <div className="rel-grafico-barra-valor">
                          {d.quantidade}
                        </div>
                        <div
                          className="rel-grafico-barra-fill"
                          style={{
                            height: `${Math.max(altura, 4)}%`,
                            backgroundColor: tema.cor,
                          }}
                        />
                        <div className="rel-grafico-barra-label">
                          {dia}/{mes}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}