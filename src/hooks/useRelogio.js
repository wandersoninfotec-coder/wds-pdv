// src/hooks/useRelogio.js
import { useState, useEffect } from 'react';

export function useRelogio() {
  const [agora, setAgora] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setAgora(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Formata data: "23/09/2026"
  const dataFormatada = agora.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  // Formata hora: "14:30:45"
  const horaFormatada = agora.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  // Dia da semana: "Quarta-feira"
  const diaSemana = agora.toLocaleDateString('pt-BR', {
    weekday: 'long',
  });

  return {
    agora,
    dataFormatada,
    horaFormatada,
    diaSemana: diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1),
  };
}