// src/components/CancelarNotaModal.jsx
import React, { useState } from 'react';
import { notaService } from '../services/notaService';
import './CancelarNotaModal.css';

export default function CancelarNotaModal({ numeroNfce, usuario, onClose, onSucesso }) {
  const [justificativa, setJustificativa] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  const handleConfirmar = async () => {
    if (justificativa.trim().length < 15) {
      setErro('Justificativa deve ter no mínimo 15 caracteres');
      return;
    }
    setLoading(true);
    setErro('');
    try {
      const resultado = await notaService.cancelar(numeroNfce, justificativa, usuario);
      onSucesso?.(resultado);
    } catch (err) {
      setErro(err.message || 'Erro ao cancelar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cnm-overlay" onClick={onClose}>
      <div className="cnm-content" onClick={(e) => e.stopPropagation()}>
        <h2 className="cnm-title">Cancelar NFC-e #{numeroNfce}</h2>
        <div className="cnm-aviso">
          ⚠️ O cancelamento é um evento fiscal <strong>irreversível</strong>.
          Prazo legal: 30 minutos após autorização.
        </div>

        <label className="cnm-label">Justificativa (mínimo 15 caracteres)</label>
        <textarea
          className="cnm-input"
          rows="4"
          maxLength="255"
          placeholder="Descreva o motivo do cancelamento..."
          value={justificativa}
          onChange={(e) => setJustificativa(e.target.value)}
        />
        <div className="cnm-contador">{justificativa.length}/255</div>

        {erro && <div className="cnm-erro">{erro}</div>}

        <div className="cnm-footer">
          <button className="cnm-btn cnm-btn-cinza" onClick={onClose} disabled={loading}>
            Cancelar
          </button>
          <button
            className="cnm-btn cnm-btn-vermelho"
            onClick={handleConfirmar}
            disabled={loading || justificativa.trim().length < 15}
          >
            {loading ? 'Cancelando...' : '❌ Confirmar Cancelamento'}
          </button>
        </div>
      </div>
    </div>
  );
}