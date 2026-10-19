// src/components/ConfirmModal.jsx
import React, { useEffect, useState } from 'react';
import './ConfirmModal.css';

export default function ConfirmModal({
  titulo = 'Confirmar',
  mensagem = 'Deseja continuar?',
  icone = '❓',
  corIcone = '#f39c12',
  corIconeFundo = '#fef3e5',
  textoConfirmar = 'Confirmar',
  textoCancelar = 'Cancelar',
  corBotaoConfirmar = '#27ae60',
  onConfirmar,
  onCancelar,
  loading = false,
}) {
  const [erro, setErro] = useState('');

  // ESC fecha
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape' && !loading) {
        onCancelar();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onCancelar, loading]);

  const handleConfirmar = async () => {
    setErro('');
    try {
      await onConfirmar();
    } catch (e) {
      setErro(e.message || 'Erro ao executar ação');
    }
  };

  return (
    <div
      className="conf-overlay"
      onClick={() => !loading && onCancelar()}
    >
      <div
        className="conf-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="conf-icon-wrap"
          style={{ backgroundColor: corIconeFundo }}
        >
          <span className="conf-icon" style={{ color: corIcone }}>
            {icone}
          </span>
        </div>

        <h2 className="conf-title">{titulo}</h2>
        <div className="conf-message">{mensagem}</div>

        {erro && <div className="conf-erro">{erro}</div>}

        <div className="conf-actions">
          <button
            className="conf-btn conf-btn-cancelar"
            onClick={onCancelar}
            disabled={loading}
          >
            {textoCancelar}
          </button>
          <button
            className="conf-btn conf-btn-confirmar"
            style={{ backgroundColor: corBotaoConfirmar }}
            onClick={handleConfirmar}
            disabled={loading}
            autoFocus
          >
            {loading ? 'Aguarde...' : textoConfirmar}
          </button>
        </div>
      </div>
    </div>
  );
}