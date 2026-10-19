// src/components/AlertaContingencia.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { pagamentoService } from '../services/pagamentoService';
import './AlertaContingencia.css';

const INTERVALO_MS = 5 * 60 * 1000; // 5 minutos


export default function AlertaContingencia() {
  const [status, setStatus] = useState(null);
  const [reprocessando, setReprocessando] = useState(false);
  const [ultimoCheck, setUltimoCheck] = useState(null);
  const [autoReprocessando, setAutoReprocessando] = useState(false);

  const consultar = useCallback(async () => {
    const resultado = await pagamentoService.statusSefaz();
    setStatus(resultado);
    setUltimoCheck(new Date());
  }, []);

  useEffect(() => {
    consultar(); // primeira consulta imediata
    const timer = setInterval(consultar, INTERVALO_MS);
    return () => clearInterval(timer);
  }, [consultar]);

  const handleReprocessar = async () => {
    if (reprocessando) return;
    setReprocessando(true);
    try {
      const resultado = await pagamentoService.reprocessarContingencia();
      alert(
        `Reprocessamento concluído:\n` +
        `Total: ${resultado.total}\n` +
        `Autorizadas: ${resultado.autorizadas}\n` +
        `Rejeitadas: ${resultado.rejeitadas}`
      );
      await consultar(); // atualiza status
    } catch (err) {
      alert('Erro ao reprocessar: ' + err.message);
    } finally {
      setReprocessando(false);
    }
  };

  // ✅ Auto-reprocessar quando SEFAZ voltar e houver pendentes
  useEffect(() => {
    if (!status) return;
    if (!status.online) return;              // sefaz ainda offline, não faz nada
    if (status.contingencia_pendentes === 0) return;  // nada pendente
    if (autoReprocessando || reprocessando) return;   // já em andamento

    console.log('[Auto-contingência] SEFAZ voltou. Reprocessando', status.contingencia_pendentes, 'nota(s)...');
    setAutoReprocessando(true);

    pagamentoService.reprocessarContingencia(20)
      .then((resultado) => {
        console.log('[Auto-contingência] Resultado:', resultado);
        // Atualiza o status (recarrega contadores)
        return consultar();
      })
      .catch((err) => {
        console.error('[Auto-contingência] Erro:', err);
      })
      .finally(() => {
        setAutoReprocessando(false);
      });
  }, [status, autoReprocessando, reprocessando, consultar]);

  // Sem status ainda (primeira consulta)
  if (!status) return null;

  // Tudo ok — sem alerta
  if (status.online && status.contingencia_pendentes === 0) {
    return null;
  }

  // Offline — faixa vermelha
  if (!status.online) {
    return (
      <div className="ac-faixa ac-faixa-vermelha">
        <span className="ac-icone">⚠️</span>
        <div className="ac-texto">
          <strong>SEFAZ OFFLINE</strong> — NFC-e será emitida em contingência.
          {status.contingencia_pendentes > 0 && (
            <> {status.contingencia_pendentes} nota(s) pendente(s).</>
          )}
        </div>
        <div className="ac-motivo">{status.xMotivo || status.mensagem}</div>
      </div>
    );
  }

  // Online mas com pendentes — faixa amarela
  return (
    <div className="ac-faixa ac-faixa-amarela">
      <span className="ac-icone">⚠️</span>
      <div className="ac-texto">
        <strong>{status.contingencia_pendentes} NFC-e(s) em contingência</strong> aguardando transmissão.
      </div>
      <button
        className="ac-btn-reprocessar"
        onClick={handleReprocessar}
        disabled={reprocessando}
      >
        {reprocessando ? '⏳ Reprocessando...' : '🔄 Reprocessar agora'}
      </button>
    </div>
  );
}