// src/components/CaixaFechamentoModal.jsx
import React, { useState } from 'react';
import { useTema } from '../hooks/useTema';
import { caixaService } from '../services/caixaService';
import './CaixaFechamentoModal.css';

const fmt = (v) => `R$ ${Number(v || 0).toFixed(2).replace('.', ',')}`;

export default function CaixaFechamentoModal({ caixa, usuario, loteAtivo, onClose, onSucesso }) {
  const tema = useTema();
  const [valor, setValor] = useState(String(loteAtivo?.saldo_atual || 0).replace('.', ','));
  const [historico, setHistorico] = useState('Fechamento de caixa via PDV');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  const parseNum = (s) => parseFloat(String(s).replace(',', '.')) || 0;

  const confirmar = async () => {
    setLoading(true);
    setErro('');
    try {
      const r = await caixaService.caixaFechar({
        caixa,
        usuario,
        valorFechamento: parseNum(valor),
        historico,
      });
      if (r.sucesso) {
        onSucesso?.(r);
      } else {
        setErro(r.erro || 'Erro ao fechar');
      }
    } catch (e) {
      setErro(e.response?.data?.erro || e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cfm-overlay" onClick={onClose}>
      <div
        className="cfm-content"
        style={{ '--tema-cor': tema.cor, '--tema-cor-suave': tema.corSuave }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="cfm-header">
          <div className="cfm-icon">🔒</div>
          <h2 className="cfm-title">Fechar Caixa</h2>
          <div className="cfm-sub">Caixa {caixa}</div>
        </div>

        <div className="cfm-body">
          <div className="cfm-info">
            <div className="cfm-info-linha">
              <span>Aberto em</span>
              <strong>{loteAtivo?.data_abertura} {loteAtivo?.hora_abertura}</strong>
            </div>
            <div className="cfm-info-linha">
              <span>Valor de abertura</span>
              <strong>{fmt(loteAtivo?.valor_abertura)}</strong>
            </div>
            <div className="cfm-info-linha cfm-info-destaque">
              <span>Saldo calculado</span>
              <strong>{fmt(loteAtivo?.saldo_atual)}</strong>
            </div>
          </div>

          <label className="cfm-label">Valor de fechamento (R$)</label>
          <input
            type="text"
            inputMode="decimal"
            className="cfm-input"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            placeholder="0,00"
          />
          <div className="cfm-hint">
            Sugerido pelo sistema. Ajuste se houver divergência física.
          </div>

          <label className="cfm-label">Histórico</label>
          <input
            type="text"
            className="cfm-input"
            value={historico}
            onChange={(e) => setHistorico(e.target.value)}
            maxLength={150}
          />

          {erro && <div className="cfm-erro">{erro}</div>}
        </div>

        <div className="cfm-footer">
          <button className="cfm-btn cfm-btn-cinza" onClick={onClose} disabled={loading}>
            Cancelar
          </button>
          <button className="cfm-btn cfm-btn-perigo" onClick={confirmar} disabled={loading}>
            {loading ? 'Fechando...' : '✓ Fechar Caixa'}
          </button>
        </div>
      </div>
    </div>
  );
}