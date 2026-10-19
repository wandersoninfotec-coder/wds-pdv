// src/components/MesaDetalhesModal.jsx
import React, { useState, useEffect } from 'react';
import { pedidoService } from '../services/pedidoService';
import './MesaDetalhesModal.css';

export default function MesaDetalhesModal({ mesa, onClose, onFinalizar }) {
  const [itens, setItens] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { carregarItens(); }, [mesa.venda]);

  const carregarItens = async () => {
    try {
      setLoading(true);
      const data = await pedidoService.listarItens(mesa.venda);
      const normalizados = (Array.isArray(data) ? data : []).map((item, index) => ({
        id: item.item || item.id || index,
        item: item.item || index,
        descricao: item.descricao || item.referencia,
        quantidade: parseFloat(item.quantidade) || 1,
        preco: parseFloat(item.preco) || 0,
        total: parseFloat(item.total_liquido) || 0,
        observacao: item.observacao || '',
      }));
      setItens(normalizados);
    } catch (error) {
      console.error('Erro ao carregar itens:', error);
    } finally {
      setLoading(false);
    }
  };

  const total = itens.reduce((s, i) => s + i.total, 0);
  const qtdItens = itens.reduce((s, i) => s + i.quantidade, 0);

  const handleFinalizar = () => {
    if (onFinalizar) {
      onFinalizar({ ...mesa, total, itens });
    } else {
      alert(`Em breve: fechamento.\nMesa ${mesa.numero} • R$ ${total.toFixed(2)}`);
    }
  };

  return (
    <div className="mdm-overlay" onClick={onClose}>
      <div className="mdm-modal" onClick={(e) => e.stopPropagation()}>

        {/* HEADER — fixo, compacto */}
        <header className="mdm-header">
          <div className="mdm-header-info">
            <span className="mdm-header-icon"></span>
            <div className="mdm-header-text">
              <h2 className="mdm-title" title={mesa.descricao}>{mesa.descricao}</h2>
              <div className="mdm-subtitle">
                #{mesa.venda} • {qtdItens} {qtdItens === 1 ? 'item' : 'itens'}
              </div>
            </div>
          </div>
          <button className="mdm-close" onClick={onClose} title="Fechar">✕</button>
        </header>

        {/* BODY — só a lista rola */}
        <div className="mdm-body">
          {loading ? (
            <div className="mdm-loading">Carregando itens...</div>
          ) : itens.length === 0 ? (
            <div className="mdm-vazio">
              <div className="mdm-vazio-icon">📭</div>
              <div>Nenhum item lançado</div>
            </div>
          ) : (
            <div className="mdm-lista">
              {itens.map((item) => (
                <div key={item.id} className="mdm-item">
                  <span className="mdm-item-qtd">{item.quantidade}x</span>
                  <span className="mdm-item-desc" title={item.descricao}>
                    {item.descricao}
                    {item.observacao && (
                      <span className="mdm-item-obs"> • {item.observacao}</span>
                    )}
                  </span>
                  <span className="mdm-item-unit">
                    R$ {item.preco.toFixed(2)}
                  </span>
                  <span className="mdm-item-total">
                    R$ {item.total.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* FOOTER — fixo, sempre visível */}
        <footer className="mdm-footer">
          <div className="mdm-resumo">
            <span className="mdm-resumo-label">
              {qtdItens} {qtdItens === 1 ? 'item' : 'itens'}
            </span>
            <span className="mdm-resumo-total">R$ {total.toFixed(2)}</span>
          </div>
          <div className="mdm-acoes">
            <button className="mdm-btn mdm-btn-secundario" onClick={onClose}>
              Fechar
            </button>
            <button
              className="mdm-btn mdm-btn-primario"
              onClick={handleFinalizar}
              disabled={itens.length === 0}
            >
              💰 Finalizar
            </button>
          </div>
        </footer>

      </div>
    </div>
  );
}