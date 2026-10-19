// src/components/InutilizarModal.jsx
import React, { useState } from 'react';
import { notaService } from '../services/notaService';
import './InutilizarModal.css';

export default function InutilizarModal({ numeroInicial, onClose, onSucesso }) {
  const [numeroIni, setNumeroIni] = useState(numeroInicial || '');
  const [numeroFim, setNumeroFim] = useState(numeroInicial || '');
  const [serie, setSerie] = useState(1);
  const [justificativa, setJustificativa] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  const handleConfirmar = async () => {
    if (!numeroIni || !numeroFim) { setErro('Informe os números'); return; }
    if (parseInt(numeroIni) > parseInt(numeroFim)) { setErro('Nº inicial maior que o final'); return; }
    if (justificativa.trim().length < 15) { setErro('Justificativa mínima: 15 caracteres'); return; }

    setLoading(true);
    setErro('');
    try {
      const resultado = await notaService.inutilizar({
        numeroIni: parseInt(numeroIni),
        numeroFim: parseInt(numeroFim),
        serie: parseInt(serie),
        justificativa,
      });
      onSucesso?.(resultado);
    } catch (err) {
      setErro(err.message || 'Erro ao inutilizar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="inm-overlay" onClick={onClose}>
      <div className="inm-content" onClick={(e) => e.stopPropagation()}>
        <h2 className="inm-title">Inutilizar Numeração</h2>
        <div className="inm-aviso">
          ⚠️ A inutilização é um evento fiscal <strong>irreversível</strong>.
          Use somente para números que não foram emitidos.
        </div>

        <div className="inm-grid">
          <div>
            <label className="inm-label">Nº inicial</label>
            <input type="number" className="inm-input" value={numeroIni} onChange={(e) => setNumeroIni(e.target.value)} />
          </div>
          <div>
            <label className="inm-label">Nº final</label>
            <input type="number" className="inm-input" value={numeroFim} onChange={(e) => setNumeroFim(e.target.value)} />
          </div>
          <div>
            <label className="inm-label">Série</label>
            <input type="number" className="inm-input" value={serie} onChange={(e) => setSerie(e.target.value)} />
          </div>
        </div>

        <label className="inm-label">Justificativa (mínimo 15 caracteres)</label>
        <textarea
          className="inm-input" rows="3" maxLength="255"
          placeholder="Motivo da inutilização..."
          value={justificativa} onChange={(e) => setJustificativa(e.target.value)}
        />
        <div className="inm-contador">{justificativa.length}/255</div>

        {erro && <div className="inm-erro">{erro}</div>}

        <div className="inm-footer">
          <button className="inm-btn inm-btn-cinza" onClick={onClose} disabled={loading}>Cancelar</button>
          <button className="inm-btn inm-btn-laranja" onClick={handleConfirmar} disabled={loading}>
            {loading ? 'Inutilizando...' : '🚫 Confirmar Inutilização'}
          </button>
        </div>
      </div>
    </div>
  );
}