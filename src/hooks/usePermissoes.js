// src/hooks/usePermissoes.js
import { useAuth } from '../context/AuthContext';

export function usePermissoes() {
  const { user } = useAuth();

  // Fallback: SEM permissões do backend → nega tudo (segurança)
  const p = user?.permissoes || {};

  const descontoMaximo = parseFloat(user?.descontoMaximo ?? 0);

  return {
    // Relatórios / Config
    visualizarRelatorios:    p.visualizarRelatorios    === true,
    cancelarVenda:           p.cancelarVenda           === true,
    visualizarConfiguracoes: p.visualizarConfiguracoes === true,
    visualizarHistorico:     p.visualizarHistorico     === true,

    // Caixa
    visualizarCaixa:         p.visualizarCaixa         === true,
    lancarCaixa:             p.lancarCaixa             === true,
    estornarCaixa:           p.estornarCaixa           === true,
    excluirCaixa:            p.excluirCaixa            === true,
    liberarCaixa:            p.liberarCaixa            === true,
    verSaldosCaixa:          p.verSaldosCaixa          === true,
    manutAberturaCaixa:      p.manutAberturaCaixa      === true,
    manutCentroCustoCaixa:   p.manutCentroCustoCaixa   === true,
    cadastrarContaCaixa:     p.cadastrarContaCaixa     === true,
    abrirCaixa:              p.abrirCaixa              === true,
    relatorioCaixa:          p.relatorioCaixa          === true,

    // Desconto
    descontoMaximo,
    temLimiteDesconto: descontoMaximo > 0,
  };
}