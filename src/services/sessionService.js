// src/services/sessionService.js

const KEYS = {
  TOKEN: '@app:token',
  USER: '@app:user',
  EXPIRES_AT: '@app:expiresAt',
};

const DURACAO_SESSAO_MS = 7 * 24 * 60 * 60 * 1000; // 7 dias

// Wrapper para o localStorage (mesma API do AsyncStorage)
const storage = {
  getItem: (key) => Promise.resolve(localStorage.getItem(key)),
  setItem: (key, value) => Promise.resolve(localStorage.setItem(key, value)),
  removeItem: (key) => Promise.resolve(localStorage.removeItem(key)),
  multiSet: (pairs) => {
    pairs.forEach(([k, v]) => localStorage.setItem(k, v));
    return Promise.resolve();
  },
  multiGet: (keys) =>
    Promise.resolve(keys.map((k) => [k, localStorage.getItem(k)])),
  multiRemove: (keys) => {
    keys.forEach((k) => localStorage.removeItem(k));
    return Promise.resolve();
  },
};

export const sessionService = {
  salvarSessao: async (token, user) => {
    try {
      const expiresAt = Date.now() + DURACAO_SESSAO_MS;
      await storage.multiSet([
        [KEYS.TOKEN, token],
        [KEYS.USER, JSON.stringify(user)],
        [KEYS.EXPIRES_AT, String(expiresAt)],
      ]);
      console.log('✅ Sessão salva. Expira em:', new Date(expiresAt).toLocaleString());
      return true;
    } catch (error) {
      console.error('❌ Erro ao salvar sessão:', error);
      return false;
    }
  },

  carregarSessao: async () => {
    try {
      const valores = await storage.multiGet([
        KEYS.TOKEN,
        KEYS.USER,
        KEYS.EXPIRES_AT,
      ]);

      const token = valores[0][1];
      const userJson = valores[1][1];
      const expiresAtStr = valores[2][1];

      if (!token || !userJson || !expiresAtStr) return null;

      const expiresAt = parseInt(expiresAtStr);
      const agora = Date.now();

      if (agora > expiresAt) {
        console.log('⚠️ Sessão expirada. Limpando...');
        await sessionService.limparSessao();
        return null;
      }

      const faltaMs = expiresAt - agora;
      const faltaHoras = Math.round(faltaMs / 1000 / 60 / 60);
      console.log(`✅ Sessão válida. Expira em ~${faltaHoras}h`);

      return {
        token,
        user: JSON.parse(userJson),
        expiresAt,
        faltaMs,
      };
    } catch (error) {
      console.error('❌ Erro ao carregar sessão:', error);
      return null;
    }
  },

  renovarSessao: async () => {
    try {
      const sessao = await sessionService.carregarSessao();
      if (!sessao) return false;

      const novaExpiracao = Date.now() + DURACAO_SESSAO_MS;
      await storage.setItem(KEYS.EXPIRES_AT, String(novaExpiracao));
      return true;
    } catch (error) {
      return false;
    }
  },

  limparSessao: async () => {
    try {
      await storage.multiRemove([KEYS.TOKEN, KEYS.USER, KEYS.EXPIRES_AT]);
      console.log('🗑️ Sessão limpa');
      return true;
    } catch (error) {
      return false;
    }
  },

  getToken: async () => {
    return storage.getItem(KEYS.TOKEN);
  },
};