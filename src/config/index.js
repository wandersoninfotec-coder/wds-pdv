// src/config/index.js

export const API_CONFIG = {
  baseURL: '',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  endpoints: {
    login: '/app/login',
    ping: '/app/ping',

    mesasListar: '/vendas/listar',
    mesaLivre: '/vendas/verificaMesaLivre',
    vendaAbrir: '/app/vendaAbrir',
    vendaCancelar: '/vendas/cancelar',
    verificarStatus: '/app/verificarStatus',

    itemAdicionar: '/app/itemAdicionarSeguro',
    itemListar: '/vendas/itemlistar',
    itemCancelar: '/vendas/itemcancelar',

    produtosListar: '/produto/listarConsulta',
    gruposListar: '/produto/listarGrupos',
  },
};

// ============================================================
// Empresa (multi-empresa)
// ============================================================
// Compatibilidade: valor histórico (fallback).
// NÃO usar em código novo — sempre usar getEmpresa().
export const EMPRESA_PADRAO = 1;

const CONFIG_KEY = '@app:config';

/**
 * Lê a empresa escolhida na ConfigPage (localStorage).
 * Fallback para EMPRESA_PADRAO se não houver config ou valor inválido.clear
 */
export function getEmpresa() {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (!raw) return EMPRESA_PADRAO;

    const cfg = JSON.parse(raw);
    const empresa = parseInt(cfg?.empresa, 10);

    if (Number.isFinite(empresa) && empresa > 0) return empresa;
    return EMPRESA_PADRAO;
  } catch {
    return EMPRESA_PADRAO;
  }
}