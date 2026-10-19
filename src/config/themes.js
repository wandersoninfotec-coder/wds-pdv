// src/config/themes.js

export const RAMO_PADRAO = 'restaurante';

export const TEMAS = {
  restaurante: {
    id: 'restaurante',
    nome: 'Restaurante',
    icone: '🍽️',
    cor: '#3498db',
    corSuave: '#eaf4fc',
    corTexto: '#2980b9',
    icones: {
      dashboard: '📊',
      mesas: '🪑',
      pedidos: '📋',
      cardapio: '📖',
      produtos: '🍽️',
      adicionar: '➕',
      dinheiro: '💰',
      cliente: '👤',
      config: '⚙️',
    },
  },

  lanches: {
    id: 'lanches',
    nome: 'Lanches',
    icone: '🍔',
    cor: '#e67e22',
    corSuave: '#fef3e5',
    corTexto: '#d35400',
    icones: {
      dashboard: '📊',
      mesas: '🍟',
      pedidos: '🍔',
      cardapio: '📖',
      produtos: '🍔',
      adicionar: '➕',
      dinheiro: '💰',
      cliente: '👤',
      config: '⚙️',
    },
  },

  sorveteria: {
    id: 'sorveteria',
    nome: 'Sorveteria',
    icone: '🍦',
    cor: '#9b59b6',
    corSuave: '#f4ebf8',
    corTexto: '#8e44ad',
    icones: {
      dashboard: '📊',
      mesas: '🍨',
      pedidos: '🍧',
      cardapio: '📖',
      produtos: '🍦',
      adicionar: '➕',
      dinheiro: '💰',
      cliente: '👤',
      config: '⚙️',
    },
  },

  espetinhos: {
    id: 'espetinhos',
    nome: 'Espetinhos',
    icone: '🍢',
    cor: '#e74c3c',
    corSuave: '#fdecea',
    corTexto: '#c0392b',
    icones: {
      dashboard: '📊',
      mesas: '🔥',
      pedidos: '🍢',
      cardapio: '📖',
      produtos: '🥩',
      adicionar: '➕',
      dinheiro: '💰',
      cliente: '👤',
      config: '⚙️',
    },
  },

  bar: {
    id: 'bar',
    nome: 'Bar',
    icone: '🍺',
    cor: '#8e44ad',
    corSuave: '#f2ebf7',
    corTexto: '#732d91',
    icones: {
      dashboard: '📊',
      mesas: '🍻',
      pedidos: '🥂',
      cardapio: '📖',
      produtos: '🍺',
      adicionar: '➕',
      dinheiro: '💰',
      cliente: '👤',
      config: '⚙️',
    },
  },
};

export const LISTA_TEMAS = Object.values(TEMAS);

export function getTema(id) {
  return TEMAS[id] || TEMAS[RAMO_PADRAO];
}