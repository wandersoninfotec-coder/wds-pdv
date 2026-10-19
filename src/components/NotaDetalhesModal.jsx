// src/components/NotaDetalhesModal.jsx
import React, { useState, useEffect } from 'react';
import { notaService } from '../services/notaService';
import { useAuth } from '../context/AuthContext';
import { impressaoService } from '../services/impressaoService';
import CancelarNotaModal from './CancelarNotaModal';
import InutilizarModal from './InutilizarModal';
import './NotaDetalhesModal.css';

const STATUS_MAP = {
  0: 'Digitada', 1: 'Validada', 2: 'Processando', 3: 'Autorizada',
  4: 'Rejeitada', 5: 'Denegada', 6: 'Cancelada', 7: 'Inutilizada', 8: 'Contingência',
};

export default function NotaDetalhesModal({ nota, onClose, onAtualizar }) {
  const { user } = useAuth();
  const [detalhes, setDetalhes] = useState(null);
  const [diagnostico, setDiagnostico] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelando, setCancelando] = useState(false);
  const [inutilizando, setInutilizando] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    carregarDetalhes();
  }, [nota.numero]);

  const carregarDetalhes = async () => {
    setLoading(true);
    try {
      const [det, diag] = await Promise.all([
        notaService.detalhes(nota.numero),
        nota.status === 4 ? notaService.diagnostico(nota.numero) : Promise.resolve(null),
      ]);
      setDetalhes(det);
      setDiagnostico(diag);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReimprimir = async () => {
    try {
      await impressaoService.imprimirCupom(nota.numero, { silent: true });
    } catch (err) {
      setFeedback({ tipo: 'erro', msg: 'Erro ao imprimir: ' + err.message });
    }
  };

  const handleCancelarOk = (resultado) => {
    setCancelando(false);
    if (resultado.sucesso) {
      setFeedback({ tipo: 'ok', msg: 'NFC-e cancelada com sucesso' });
      onAtualizar?.();
      setTimeout(onClose, 1500);
    } else {
      setFeedback({ tipo: 'erro', msg: resultado.mensagem || 'Falha no cancelamento' });
    }
  };

  const handleInutilizarOk = (resultado) => {
    setInutilizando(false);
    if (resultado.sucesso) {
      setFeedback({ tipo: 'ok', msg: 'Faixa inutilizada com sucesso' });
      onAtualizar?.();
      setTimeout(onClose, 1500);
    } else {
      setFeedback({ tipo: 'erro', msg: resultado.mensagem || 'Falha na inutilização' });
    }
  };

  if (loading) {
    return (
      <div className="ndm-overlay" onClick={onClose}>
        <div className="ndm-content" onClick={(e) => e.stopPropagation()}>
          <div className="ndm-loading">Carregando...</div>
        </div>
      </div>
    );
  }

  const nfce = detalhes?.nfce || {};
  const emit = detalhes?.emitente || {};
  const dest = detalhes?.destinatario;
  const itens = detalhes?.itens || [];
  const formas = detalhes?.formas_pagamento || [];
  const totais = detalhes?.totais || {};

  const fmtMoney = (v) => parseFloat(v || 0).toFixed(2).replace('.', ',');

  return (
    <>
      <div className="ndm-overlay" onClick={onClose}>
        <div className="ndm-content" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="ndm-header">
            <div>
              <h2 className="ndm-title">NFC-e #{String(nota.numero).padStart(6, '0')}</h2>
              <div className="ndm-subtitle">
                Série {nota.serie} • {STATUS_MAP[nota.status] || '?'}
              </div>
            </div>
            <button className="ndm-close" onClick={onClose}>✕</button>
          </div>

          {/* Feedback */}
          {feedback && (
            <div className={`ndm-feedback ndm-feedback-${feedback.tipo}`}>
              {feedback.msg}
            </div>
          )}

          {/* Diagnóstico (se rejeitada) */}
          {diagnostico?.cStat && (
            <div className="ndm-diagnostico">
              <div className="ndm-diag-titulo">⚠️ {diagnostico.categoria}</div>
              <div className="ndm-diag-motivo">
                <strong>SEFAZ {diagnostico.cStat}:</strong> {diagnostico.xMotivo}
              </div>
              <div className="ndm-diag-dica">💡 {diagnostico.dica}</div>
              {diagnostico.acao === 'cadastrar_ncm' && (
                <div className="ndm-diag-acao">
                  Ação necessária: cadastrar NCM em <code>dfe_ncm_nbs_ibs_cbs</code>
                </div>
              )}
            </div>
          )}

          {/* Dados principais */}
          <div className="ndm-body">
            <div className="ndm-secao">
              <div className="ndm-secao-titulo">Chave de Acesso</div>
              <div className="ndm-chave">{nfce.chave || '-'}</div>
            </div>

            <div className="ndm-grid">
              <div><span className="ndm-label">Protocolo</span><span>{nfce.protocolo || '-'}</span></div>
              <div><span className="ndm-label">Data/Hora</span><span>{nfce.data_emissao} {nfce.hora_emissao}</span></div>
              <div><span className="ndm-label">Ambiente</span><span>{nfce.ambiente === 2 ? 'Homologação' : 'Produção'}</span></div>
              <div><span className="ndm-label">Total</span><span className="ndm-total">R$ {fmtMoney(totais.tot_icms_vNF)}</span></div>
            </div>

            <div className="ndm-secao">
              <div className="ndm-secao-titulo">Cliente</div>
              <div>
                {dest
                  ? <>{dest.dest_xNome} {dest.dest_cpf && `— CPF ${dest.dest_cpf}`} {dest.dest_cnpj && `— CNPJ ${dest.dest_cnpj}`}</>
                  : 'CONSUMIDOR FINAL'}
              </div>
            </div>

            <div className="ndm-secao">
              <div className="ndm-secao-titulo">Itens ({itens.length})</div>
              <table className="ndm-itens">
                <thead>
                  <tr><th>Cód.</th><th>Descrição</th><th>Qtd</th><th>Vl. Unit</th><th>Total</th></tr>
                </thead>
                <tbody>
                  {itens.map((i) => (
                    <tr key={i.prod_item}>
                      <td>{i.prod_cprod}</td>
                      <td>{i.prod_xProd}</td>
                      <td>{parseFloat(i.prod_qcom).toFixed(2)}</td>
                      <td>R$ {fmtMoney(i.prod_vUnCom)}</td>
                      <td>R$ {fmtMoney(i.prod_vProd)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="ndm-secao">
              <div className="ndm-secao-titulo">Formas de Pagamento</div>
              {formas.map((f, i) => (
                <div key={i} className="ndm-pag-linha">
                  <span>{f.tot_fp_descricao}</span>
                  <span>R$ {fmtMoney(f.tot_fp_valor)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Ações */}
          <div className="ndm-footer">
            {nota.status === 3 && (
              <>
                <button className="ndm-btn ndm-btn-azul" onClick={handleReimprimir}>
                  🖨️ Reimprimir
                </button>
                <button className="ndm-btn ndm-btn-vermelho" onClick={() => setCancelando(true)}>
                  ❌ Cancelar
                </button>
              </>
            )}
            {nota.status === 4 && (
              <button className="ndm-btn ndm-btn-laranja" onClick={() => setInutilizando(true)}>
                🚫 Inutilizar
              </button>
            )}
            {nota.status === 8 && (
              <button className="ndm-btn ndm-btn-azul" onClick={handleReimprimir}>
                🖨️ Reimprimir (contingência)
              </button>
            )}
            <button className="ndm-btn ndm-btn-cinza" onClick={onClose}>Fechar</button>
          </div>
        </div>
      </div>

      {cancelando && (
        <CancelarNotaModal
          numeroNfce={nota.numero}
          usuario={user?.nomeFuncionario || user?.nome}
          onClose={() => setCancelando(false)}
          onSucesso={handleCancelarOk}
        />
      )}

      {inutilizando && (
        <InutilizarModal
          numeroInicial={nota.numero}
          onClose={() => setInutilizando(false)}
          onSucesso={handleInutilizarOk}
        />
      )}
    </>
  );
}