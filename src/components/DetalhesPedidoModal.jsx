// src/components/DetalhesPedidoModal.jsx
import React, { useState, useEffect } from 'react';
import { historicoService } from '../services/historicoService';
import './DetalhesPedidoModal.css';
import { useTema } from '../hooks/useTema';






export default function DetalhesPedidoModal({ venda, onClose, formatarData }) {
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(true);
  const tema = useTema();    

  useEffect(() => {
    carregarDetalhes();
  }, [venda]);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const carregarDetalhes = async () => {
    try {
      setLoading(true);
      const resultado = await historicoService.detalhes(venda);
      setDados(resultado);
    } catch (error) {
      console.error('Erro ao carregar detalhes:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatarDataLocal = (dataStr, hora) => {
    if (formatarData) return formatarData(dataStr, hora);
    return `${dataStr} ${hora || ''}`;
  };

  return (
    <div className="dpm-overlay" onClick={onClose}>
      <div
        className="dpm-content"
        style={{
          '--tema-cor': tema.cor,
          '--tema-cor-suave': tema.corSuave,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {loading ? (
          <div className="dpm-loading">Carregando...</div>
        ) : !dados ? (
          <div className="dpm-vazio">Não foi possível carregar os detalhes.</div>
        ) : (
          <>
            <div className="dpm-header">
              <div className="dpm-header-info">
                <div className="dpm-venda">Pedido #{dados.cabecalho.venda}</div>
                <div className="dpm-mesa">
                  {dados.cabecalho.mesa_descricao}
                </div>
              </div>
              <button className="dpm-close" onClick={onClose}>
                ✕
              </button>
            </div>

            <div className="dpm-body">
              <div className="dpm-info-grid">
                <div className="dpm-info-item">
                  <span className="dpm-info-label">Data/Hora</span>
                  <span className="dpm-info-valor">
                    {formatarDataLocal(
                      dados.cabecalho.data,
                      dados.cabecalho.hora
                    )}
                  </span>
                </div>
                <div className="dpm-info-item">
                  <span className="dpm-info-label">Atendido por</span>
                  <span className="dpm-info-valor">
                    {dados.cabecalho.vendedor_nome ||
                      `#${dados.cabecalho.vendedor}`}
                  </span>
                </div>
                <div className="dpm-info-item">
                  <span className="dpm-info-label">Status</span>
                  <span
                    className={`dpm-status ${
                      dados.cabecalho.status === 1 ? 'fechada' : 'cancelada'
                    }`}
                  >
                    {dados.cabecalho.status_label}
                  </span>
                </div>
                <div className="dpm-info-item">
                  <span className="dpm-info-label">Origem</span>
                  <span className="dpm-info-valor">
                    {dados.cabecalho.origem || '-'}
                  </span>
                </div>
              </div>

              <div className="dpm-section-title">
                Itens do pedido ({dados.itens.length})
              </div>

              {dados.itens.length === 0 ? (
                <div className="dpm-vazio">Nenhum item registrado</div>
              ) : (
                dados.itens.map((item) => {
                  const cancelado = item.cancelado === 1;
                  return (
                    <div
                      key={item.item}
                      className={`dpm-item ${cancelado ? 'cancelado' : ''}`}
                    >
                      <div className="dpm-item-qtd">{item.quantidade}x</div>
                      <div className="dpm-item-info">
                        <div
                          className={`dpm-item-nome ${cancelado ? 'cancelado' : ''}`}
                        >
                          {item.descricao}
                          {cancelado ? ' (cancelado)' : ''}
                        </div>
                        <div className="dpm-item-preco">
                          R$ {parseFloat(item.preco).toFixed(2)} cada
                        </div>
                        {item.observacao && (
                          <div className="dpm-item-obs">
                            📝 {item.observacao}
                          </div>
                        )}
                      </div>
                      <div className="dpm-item-total">
                        R$ {parseFloat(item.total).toFixed(2)}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="dpm-footer">
              <span className="dpm-footer-label">Total</span>
              <span className="dpm-footer-total">
                R$ {parseFloat(dados.cabecalho.total).toFixed(2)}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}