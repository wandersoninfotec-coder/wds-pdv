// src/components/MesasFooterPanel.jsx
import React, { useState, useEffect } from 'react';
import { useTema } from '../hooks/useTema';
import { usePermissoes } from '../hooks/usePermissoes';
import { relatorioService } from '../services/relatorioService';
import { historicoService } from '../services/historicoService';
import './MesasFooterPanel.css';

export default function MesasFooterPanel() {
  const tema = useTema();
  const permissoes = usePermissoes();
  const [resumo, setResumo] = useState({
    quantidade: 0,
    total: 0,
    ticket_medio: 0,
  });
  const [ultimasVendas, setUltimasVendas] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ Regra: precisa ter permissão de relatórios para ver totais
  const podeVerTotais = permissoes.visualizarRelatorios;

  useEffect(() => {
    carregarDados();
    const interval = setInterval(carregarDados, 30000);
    return () => clearInterval(interval);
  }, []);

  const carregarDados = async () => {
    try {
      setLoading(true);

      const dadosResumo = await relatorioService.vendas('hoje');
      if (dadosResumo?.resumo) {
        setResumo(dadosResumo.resumo);
      }

      const vendas = await historicoService.listar('hoje', 'fechadas');
      setUltimasVendas((vendas || []).slice(0, 5));
    } catch (error) {
      console.error('Erro ao carregar dados do painel:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatarHora = (hora) => {
    if (!hora) return '';
    return hora.substring(0, 5);
  };

  const formatarMoeda = (v) => {
    return `R$ ${parseFloat(v || 0).toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="mfp-container">
        <div className="mfp-section">
          <div className="mfp-loading">Carregando resumo do dia...</div>
        </div>
        <div className="mfp-section">
          <div className="mfp-loading">Carregando últimas vendas...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="mfp-container">
      {/* Resumo do Dia */}
      <div className="mfp-section">
        <div className="mfp-section-title">📊 Resumo do Dia</div>

        {podeVerTotais ? (
          // ✅ COM permissão: mostra 3 cards completos
          <div className="mfp-cards">
            <div
              className="mfp-card"
              style={{ backgroundColor: tema.corSuave }}
            >
              <div className="mfp-card-icon">🧾</div>
              <div className="mfp-card-label" style={{ color: tema.cor }}>
                Vendas
              </div>
              <div className="mfp-card-valor" style={{ color: tema.cor }}>
                {resumo.quantidade}
              </div>
            </div>

            <div className="mfp-card" style={{ backgroundColor: '#eaf9f1' }}>
              <div className="mfp-card-icon">💰</div>
              <div className="mfp-card-label" style={{ color: '#27ae60' }}>
                Faturamento
              </div>
              <div className="mfp-card-valor" style={{ color: '#27ae60' }}>
                {formatarMoeda(resumo.total)}
              </div>
            </div>

            <div className="mfp-card" style={{ backgroundColor: '#fef3e5' }}>
              <div className="mfp-card-icon">📈</div>
              <div className="mfp-card-label" style={{ color: '#f39c12' }}>
                Ticket Médio
              </div>
              <div className="mfp-card-valor" style={{ color: '#f39c12' }}>
                {formatarMoeda(resumo.ticket_medio)}
              </div>
            </div>
          </div>
        ) : (
          // ✅ SEM permissão: mostra só a contagem de vendas
          <div className="mfp-resumo-simples" style={{ backgroundColor: tema.corSuave }}>
            <div className="mfp-resumo-simples-icon">🧾</div>
            <div className="mfp-resumo-simples-info">
              <div className="mfp-resumo-simples-numero" style={{ color: tema.cor }}>
                {resumo.quantidade}
              </div>
              <div className="mfp-resumo-simples-label" style={{ color: tema.cor }}>
                {resumo.quantidade === 1 ? 'venda hoje' : 'vendas hoje'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Últimas Vendas */}
      <div className="mfp-section">
        <div className="mfp-section-title">🕐 Últimas Vendas</div>

        {ultimasVendas.length === 0 ? (
          <div className="mfp-vazio">
            <div className="mfp-vazio-icon">📭</div>
            <div>Nenhuma venda fechada hoje</div>
          </div>
        ) : (
          <div className="mfp-vendas-lista">
            {ultimasVendas.map((v) => (
              <div key={v.venda} className="mfp-venda-item">
                <div className="mfp-venda-numero">#{v.venda}</div>
                <div className="mfp-venda-mesa">
                  {v.mesa_descricao || `Mesa ${v.mesa}`}
                </div>
                <div className="mfp-venda-hora">{formatarHora(v.hora)}</div>

                {/* ✅ Só mostra o valor se tiver permissão */}
                {podeVerTotais && (
                  <div className="mfp-venda-total">
                    {formatarMoeda(v.total)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}