// src/components/SuccessModal.jsx
import React, { useEffect } from 'react';
import './SuccessModal.css';
import { useTema } from '../hooks/useTema';

export default function SuccessModal({
  titulo = 'Venda Finalizada!',
  subtitulo = 'O pagamento foi registrado com sucesso',
  detalhes = [],
  textoBotao = 'OK',
  autoFecharMs = 0,
  onClose,
  children,             // ✅ NOVO
}) {
  const tema = useTema(); 

  useEffect(() => {
    if (!autoFecharMs || autoFecharMs <= 0) return;
    const timer = setTimeout(() => {
      if (onClose) onClose();
    }, autoFecharMs);
    return () => clearTimeout(timer);
  }, [autoFecharMs, onClose]);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape' && onClose) onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div className="suc-overlay" onClick={onClose}>
      <div
        className="suc-content"
        style={{
          '--tema-cor': tema.cor,
          '--tema-cor-suave': tema.corSuave,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="suc-icon-wrap">
          <span className="suc-icon-check">✓</span>
        </div>

        <h2 className="suc-title">{titulo}</h2>
        <div className="suc-subtitle">{subtitulo}</div>

        {detalhes && detalhes.length > 0 && (
          <div className="suc-detalhes">
            {detalhes.map((d, i) => (
              <div key={i} className="suc-detalhe-linha">
                <span className="suc-detalhe-label">{d.label}</span>
                <span
                  className={`suc-detalhe-valor ${d.destaque ? 'destaque' : ''} ${d.tipo || ''}`}
                >
                  {d.valor}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* ✅ Renderiza o botão de imprimir (children) */}
        {children && (
          <div className="suc-children">
            {children}
          </div>
        )}

        <button className="suc-btn" onClick={onClose}>
          {textoBotao}
        </button>

        {autoFecharMs > 0 && (
          <div className="suc-progress">
            <div
              className="suc-progress-bar"
              style={{ '--auto-fechar-ms': `${autoFecharMs}ms` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}