// src/services/configService.js

const CONFIG_KEY = '@app:config';

export const RECURSOS_PADRAO = {
  finalizarVenda: true,
  visualizarRelatorios: true,
  visualizarHistorico: true,
};

// Wrapper localStorage
const storage = {
  getItem: (key) => Promise.resolve(localStorage.getItem(key)),
  setItem: (key, value) => Promise.resolve(localStorage.setItem(key, value)),
  removeItem: (key) => Promise.resolve(localStorage.removeItem(key)),
};

export const configService = {
  salvar: async (config) => {
    try {
      await storage.setItem(CONFIG_KEY, JSON.stringify(config));
      return true;
    } catch (error) {
      console.error('Erro ao salvar config:', error);
      return false;
    }
  },

  carregar: async () => {
    try {
      const json = await storage.getItem(CONFIG_KEY);
      if (!json) return null;
      const config = JSON.parse(json);
      if (!config.recursos) config.recursos = { ...RECURSOS_PADRAO };
      return config;
    } catch (error) {
      return null;
    }
  },

  estaConfigurado: async () => {
    const config = await configService.carregar();
    return !!(config && config.ip && config.empresa);
  },

  limpar: async () => {
    await storage.removeItem(CONFIG_KEY);
  },

  atualizarRecurso: async (nomeRecurso, valor) => {
    try {
      const config = await configService.carregar();
      if (!config) return false;
      config.recursos = {
        ...RECURSOS_PADRAO,
        ...(config.recursos || {}),
        [nomeRecurso]: valor,
      };
      await configService.salvar(config);
      return true;
    } catch (error) {
      return false;
    }
  },

  testarConexao: async (ip, porta, caminhoApi = 'app_mesas_api') => {
    const portaStr = porta && porta !== '80' && porta !== '' ? `:${porta}` : '';
    const url = `http://${ip}${portaStr}/${caminhoApi}/app/ping`;

    console.log('🧪 Testando:', url);

    const fazerFetch = async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: { Accept: 'application/json' },
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (!response.ok) throw new Error(`Servidor respondeu ${response.status}`);
        const data = await response.json();
        return {
          sucesso: true,
          resposta: data,
          url: `http://${ip}${portaStr}/${caminhoApi}`,
        };
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    };

    const timeoutGarantido = () =>
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('TIMEOUT_FORCADO')), 9000)
      );

    try {
      return await Promise.race([fazerFetch(), timeoutGarantido()]);
    } catch (error) {
      if (error.name === 'AbortError' || error.message === 'TIMEOUT_FORCADO') {
        return { sucesso: false, erro: 'Tempo esgotado. Verifique o IP.' };
      }
      return { sucesso: false, erro: 'Erro: ' + (error.message || 'desconhecido') };
    }
  },


  buscarDadosEmpresa: async (ip, porta, caminhoApi, empresa) => {
    const portaStr = porta && porta !== '80' && porta !== '' ? `:${porta}` : '';
    const url = `http://${ip}${portaStr}/${caminhoApi}/app/dadosEmpresa`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ empresa: parseInt(empresa) }),
      });

      if (!response.ok) {
        return { sucesso: false, erro: `HTTP ${response.status}` };
      }

      return await response.json();
    } catch (error) {
      return { sucesso: false, erro: error.message };
    }
  }
};