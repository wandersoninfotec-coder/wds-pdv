// src/hooks/useTema.js
import { useState, useEffect } from 'react';
import { configService } from '../services/configService';
import { getTema, TEMAS, RAMO_PADRAO } from '../config/themes';

export function useTema() {
  const [tema, setTema] = useState(TEMAS[RAMO_PADRAO]);

  useEffect(() => {
    carregarTema();

    // Escuta mudanças no localStorage (se outro componente alterar)
    const handleStorage = (e) => {
      if (e.key === '@app:config') carregarTema();
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const carregarTema = async () => {
    try {
      const config = await configService.carregar();
      const ramo = config?.ramo || RAMO_PADRAO;
      setTema(getTema(ramo));
    } catch (error) {
      console.error('Erro ao carregar tema:', error);
      setTema(TEMAS[RAMO_PADRAO]);
    }
  };

  return tema;
}