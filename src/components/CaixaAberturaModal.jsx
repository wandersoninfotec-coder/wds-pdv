// src/components/CaixaAberturaModal.jsx
import React, { useState } from 'react';
import { useTema } from '../hooks/useTema';
import { caixaService } from '../services/caixaService';
import './CaixaAberturaModal.css';

export default function CaixaAberturaModal({ caixa, usuario, valorSugerido = 0, onClose, onSucesso }) {
  const tema = useTema();
  const [valor, setValor] = useState(String(valorSugerido).replace('.', ','));
  const [historico, setHistorico] = useState('Abertura de caixa via PDV');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  const parseNum = (s) => parseFloat(String(s).replace(',', '.')) || 0;

  const confirmar = async () => {
    setLoading(true);
    setErro('');
    try {
      const r = await caixaService.caixaAbrir({
        caixa,
        usuario,
        valorAbertura: parseNum(valor),
        historico,
      });
      if (r.sucesso) {
        onSucesso?.(r);
      } else {
        setErro(r.erro || 'Erro ao abrir');
      }
    } catch (e) {
      setErro(e.response?.data?.erro || e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cab-overlay" onClick={onClose}>
      <div
        className="cab-content"
        style={{ '--tema-cor': tema.cor, '--tema-cor-suave': tema.corSuave }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="cab-header">
          <div className="cab-icon">🔓</div>
          <h2 className="cab-title">Abrir Caixa</h2>
          <div className="cab-sub">Caixa {caixa}</div>
        </div>

        <div className="cab-body">
          <label className="cab-label">Valor de abertura (R$)</label>
          <input
            type="text"
            inputMode="decimal"
            className="cab-input"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            placeholder="0,00"
            autoFocus
          />

          <label className="cab-label">Histórico</label>
          <input
            type="text"
            className="cab-input"
            value={historico}
            onChange={(e) => setHistorico(e.target.value)}
            maxLength={150}
          />

          {erro && <div className="cab-erro">{erro}</div>}
        </div>

        <div className="cab-footer">
          <button className="cab-btn cab-btn-cinza" onClick={onClose} disabled={loading}>
            Cancelar
          </button>
          <button
            className="cab-btn cab-btn-primario"
            onClick={confirmar}
            disabled={loading}
          >
            {loading ? 'Abrindo...' : '✓ Abrir Caixa'}
          </button>
        </div>
      </div>
    </div>
  );
}