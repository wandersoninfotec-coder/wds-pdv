// src/components/BotaoImprimirCupom.jsx
import React, { useState } from 'react';
import { impressaoService } from '../services/impressaoService';

export default function BotaoImprimirCupom({ numeroNfce, className = '', children }) {
  const [imprimindo, setImprimindo] = useState(false);

  const handleImprimir = async () => {
    if (!numeroNfce || imprimindo) return;
    setImprimindo(true);
    try {
      await impressaoService.imprimirCupom(numeroNfce, { silent: true });
    } catch (err) {
      console.error('Erro ao imprimir:', err);
      alert('Erro ao imprimir: ' + err.message);
    } finally {
      setImprimindo(false);
    }
  };

  return (
    <button className={className} onClick={handleImprimir} disabled={imprimindo}>
      {imprimindo ? '⏳ Imprimindo...' : (children || '🖨️ Imprimir Cupom')}
    </button>
  );
}