// src/components/PdvFullScreen.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTema } from '../hooks/useTema';
import { pedidoService } from '../services/pedidoService';
import { produtoService } from '../services/produtoService';
import FinalizarVendaModal from './FinalizarVendaModal';
import SuccessModal from './SuccessModal';
import ConfirmModal from './ConfirmModal';
import BotaoImprimirCupom from './BotaoImprimirCupom';
import './PdvFullScreen.css';
import AutorizarCancelamentoModal from './AutorizarCancelamentoModal';
import { usePermissoes } from '../hooks/usePermissoes';

const fmt = (v) => `R$ ${Number(v || 0).toFixed(2).replace('.', ',')}`;

const AJUDA = [
  ['F1', 'Ajuda'],
  ['F2', 'Focar quantidade'],
  ['F3', 'Focar busca'],
  ['F4', 'Remover último item'],
  ['F9', 'Finalizar venda'],
  ['F10', 'Cancelar venda'],
  ['F12', 'Sair do PDV'],
  ['ESC', 'Limpar busca'],
  ['Enter', 'Adicionar produto'],
];

export default function PdvFullScreen({ venda, onFechar, onRenovarVenda }) {
  const { user } = useAuth();
  const tema = useTema();

  const [itens, setItens] = useState([]);
  const [busca, setBusca] = useState('');
  const [qtd, setQtd] = useState('1');
  const [produtos, setProdutos] = useState([]);
  const [adicionando, setAdicionando] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [itemParaRemover, setItemParaRemover] = useState(null);
  const [modalFinalizar, setModalFinalizar] = useState(false);
  const [modalCancelarVenda, setModalCancelarVenda] = useState(false);
  const [modalAjuda, setModalAjuda] = useState(false);
  const [sucessoModal, setSucessoModal] = useState(null);
  const [modalAutorizar, setModalAutorizar] = useState(null); // { acao: 'cancelarVenda' | 'removerItem', payload } 
  const permissoes = usePermissoes();
  const [modoTela, setModoTela] = useState('QTD');   // 'QTD' | 'VALOR'

  const [produtoSemPreco, setProdutoSemPreco] = useState(null); // { produto, qtd }
  const [precoManual, setPrecoManual] = useState('');
  const precoManualRef = useRef(null);

  const buscaRef = useRef(null);
  const qtdRef = useRef(null);
  const debounceRef = useRef(null);

  const parseNum = (s) => parseFloat(String(s).replace(',', '.')) || 0;

  const carregarItens = useCallback(async () => {
    try {
      const data = await pedidoService.listarItens(venda.venda);
      const lista = (Array.isArray(data) ? data : []).map((i, idx) => ({
        id: i.item || i.id || idx,
        item: i.item || idx,
        referencia: i.referencia,                      
        descricao: i.descricao || i.referencia,
        quantidade: parseFloat(i.quantidade) || 1,
        preco: parseFloat(i.preco) || 0,
        total: parseFloat(i.total_liquido) || 0,
      }));
      setItens(lista);
    } catch (e) {
      console.error('Erro ao carregar itens:', e);
    }
  }, [venda.venda]);

  useEffect(() => { carregarItens(); }, [carregarItens]);
  useEffect(() => { setTimeout(() => buscaRef.current?.focus(), 100); }, []);

  const pareceCodigo = (s) => {
    const limpo = String(s || '').replace(/\s/g, '');
    return /^\d{8,}$/.test(limpo);
  };
  const pareceBalanca = (s) => {
    const limpo = String(s || '').replace(/\s/g, '');
    return /^2\d{12}$/.test(limpo);
  };

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!busca.trim()) { setProdutos([]); return; }

    debounceRef.current = setTimeout(async () => {
      const termo = busca.trim();

      if (pareceBalanca(termo)) {
        try {
          const r = await produtoService.buscarPorBalança(termo);
          if (r.sucesso) {
            await adicionarItem(r.produto, r.quantidade, parseFloat(r.produto.vista) || 0);
            return;
          }
        } catch (e) {}
      }

      // 🔵 BIPE: código de barras exato (8+ dígitos)
      if (pareceCodigo(termo)) {
          try {
            const r = await produtoService.buscarExato(termo);
            if (r.sucesso && r.produto) {
              const resultado = calcularQtdPreco(r.produto);

              if (resultado.bloqueado) {
                setFeedback({ tipo: 'erro', msg: resultado.motivo });
                setProdutos([]);
                setBusca('');
                setTimeout(() => setFeedback(null), 3500);
                return;
              }
              
              if (resultado.preco <= 0) {
                setProdutoSemPreco({ produto: r.produto, qtd: resultado.qtd });
                setPrecoManual('');
                setTimeout(() => precoManualRef.current?.focus(), 100);
                setProdutos([]);
                setBusca('');
                return;
              }
            await adicionarItem(r.produto, resultado.qtd, resultado.preco);
              return;
            } else {
              setFeedback({ tipo: 'erro', msg: `Código ${termo} não cadastrado` });
              setTimeout(() => setFeedback(null), 3000);
              setBusca('');
              return;
            }
          } catch (e) {}
        }

      try {
        const data = await produtoService.listar(termo);
        setProdutos((Array.isArray(data) ? data : []).slice(0, 8));
      } catch (e) {
        setProdutos([]);
      }
    }, 200);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [busca, qtd]);

  const adicionarItem = async (produto, quantidade, preco) => {
    setAdicionando(true);
    try {
      await pedidoService.adicionarItem({
        venda: venda.venda,
        referencia: produto.referencia,
        descricao: produto.descricao,
        quantidade,
        preco,
        observacao: '',
        vendedor: user?.codigoFuncionario || user?.id || 1,
      });

      setFeedback({
        tipo: 'ok',
        msg: `+${quantidade}x ${produto.descricao}  →  ${fmt(quantidade * preco)}`,
      });
      setTimeout(() => setFeedback(null), 2000);

      setBusca('');
      setProdutos([]);
      setQtd(modoTela === 'VALOR' ? '' : '1');
      await carregarItens();
      buscaRef.current?.focus();
    } catch (e) {
      setFeedback({ tipo: 'erro', msg: e.message || 'Erro ao adicionar' });
      setTimeout(() => setFeedback(null), 3000);
    } finally {
      setAdicionando(false);
    }
  };

  const confirmarPrecoManual = async () => {
    const p = parseNum(precoManual);
    if (p <= 0) {
      setFeedback({ tipo: 'erro', msg: 'Informe um valor válido' });
      setTimeout(() => setFeedback(null), 3000);
      return;
    }
    const ctx = produtoSemPreco;
    setProdutoSemPreco(null);
    setPrecoManual('');
    await adicionarItem(ctx.produto, ctx.qtd, p);
  };

  // Interpreta o campo QTD/Valor de acordo com o modo E o produto
  // Retorna { qtd, preco } OU { bloqueado: true, motivo }
  const calcularQtdPreco = (produto) => {
    const preco = parseFloat(produto.vista) || 0;
    const valorDigitado = parseNum(qtd);

    // venda_unidade = 'S' → só aceita venda por unidade (QTD)
    const soUnidade = String(produto.venda_unidade || '').toUpperCase() === 'S';

    // 🔴 Opção C: bloqueia se for só-unidade e o operador estiver em R$
    if (soUnidade && modoTela === 'VALOR') {
      return {
        bloqueado: true,
        motivo: `"${produto.descricao}" só aceita venda por unidade. Troque para o modo QTD.`,
      };
    }

    // QTD (padrão) OU produto só-unidade (já garantido que está em QTD)
    if (modoTela === 'QTD' || soUnidade) {
      return { qtd: valorDigitado > 0 ? valorDigitado : 1, preco };
    }

    // Modo VALOR (R$): calcula qtd = valor / preço
    if (preco > 0 && valorDigitado > 0) {
      const q = Math.round((valorDigitado / preco) * 1000) / 1000;
      return { qtd: q, preco };
    }

    return { qtd: 1, preco };
  };

  const handleBuscaEnter = (e) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    if (pareceCodigo(busca)) return;
    if (produtos.length === 0 || adicionando) return;

    const p = produtos[0];
    const resultado = calcularQtdPreco(p);

    if (resultado.bloqueado) {
      setFeedback({ tipo: 'erro', msg: resultado.motivo });
      setProdutos([]);        // ← fecha dropdown
      setBusca('');           // ← limpa busca
      setTimeout(() => setFeedback(null), 3500);
      return;
    }
    
    if (resultado.preco <= 0) {
      setProdutoSemPreco({ produto: p, qtd: resultado.qtd });
      setPrecoManual('');
      setTimeout(() => precoManualRef.current?.focus(), 100);
      setProdutos([]);
      setBusca('');
      return;
    }
    adicionarItem(p, resultado.qtd, resultado.preco);
  };

  const handleProdutoClick = (produto) => {
    const resultado = calcularQtdPreco(produto);

    if (resultado.bloqueado) {
      setFeedback({ tipo: 'erro', msg: resultado.motivo });
      setProdutos([]);
      setBusca('');
      setTimeout(() => setFeedback(null), 3500);
      return;
    }

    if (resultado.preco <= 0) {
      setProdutoSemPreco({ produto, qtd: resultado.qtd });
      setPrecoManual('');
      setTimeout(() => precoManualRef.current?.focus(), 100);
      return;
    }
    adicionarItem(produto, resultado.qtd, resultado.preco);
  };

  const confirmarRemover = async () => {
    if (!itemParaRemover) return;
    try {
      await pedidoService.removerItem(
        venda.venda,
        itemParaRemover.item,
        itemParaRemover.referencia          // ← passa a referência
      );
      setItemParaRemover(null);
      await carregarItens();
      buscaRef.current?.focus();
    } catch (e) {
      alert('Erro ao remover');
    }
  };

  const handleRemoverUltimo = () => {
    if (itens.length === 0) return;
    setItemParaRemover(itens[itens.length - 1]);
  };

  const handleCancelarVenda = async () => {
    try {
      await pedidoService.cancelarMesa(venda.venda, user?.codigoFuncionario || user?.id || 1);
      setModalCancelarVenda(false);
      onRenovarVenda?.();
    } catch (e) {
      alert('Erro ao cancelar venda');
    }
  };

  const total = itens.reduce((s, i) => s + i.total, 0);
  const totalItens = itens.reduce((s, i) => s + i.quantidade, 0);

  const handleFinalizar = () => {
    if (itens.length === 0) return;
    setModalFinalizar(true);
  };

  const handleSucessoFinalizacao = (r) => {
    setModalFinalizar(false);
    const extras = [];
    if (r.nfce?.sucesso) extras.push({ label: 'NFC-e', valor: `✅ #${r.nfce.numero_nfce}` });
    else if (r.nfce) extras.push({ label: 'NFC-e', valor: '⚠️ Pendente' });
    setSucessoModal({ ...r, detalhesExtras: extras });
  };

  const handleFecharSucesso = () => {
    setSucessoModal(null);
    onRenovarVenda?.();
  };

  const handleSolicitarCancelamento = () => {
  if (permissoes.cancelarVenda === true) {
    setModalCancelarVenda(true);   // vai direto pro ConfirmModal
  } else {
    setModalAutorizar({ acao: 'cancelarVenda' });
  }
};

  const handleAutorizado = (supervisor) => {
    setFeedback({
      tipo: 'ok',
      msg: `Autorizado por ${supervisor.nomeFuncionario || supervisor.nome}`,
    });
    setTimeout(() => setFeedback(null), 3000);

    if (modalAutorizar?.acao === 'cancelarVenda') {
      setModalAutorizar(null);
      setModalCancelarVenda(true);
    } else if (modalAutorizar?.acao === 'removerItem') {
      setModalAutorizar(null);
      confirmarRemover();
    }
  };

  useEffect(() => {
    const handler = (e) => {
      if (modalFinalizar || sucessoModal || itemParaRemover || modalCancelarVenda) return;

      switch (e.key) {
        case 'F1':  e.preventDefault(); setModalAjuda(true); break;
        case 'F2': e.preventDefault(); qtdRef.current?.focus(); qtdRef.current?.select(); break;
        case 'F3':  e.preventDefault(); buscaRef.current?.focus(); buscaRef.current?.select(); break;
        case 'F4':  e.preventDefault(); handleRemoverUltimo(); break;
        case 'F9':  e.preventDefault(); handleFinalizar(); break;
        case 'F10':
          e.preventDefault();
          if (itens.length > 0) handleSolicitarCancelamento();
          break;
        case 'F12':
          e.preventDefault();
          if (itens.length === 0) onFechar?.();
          else handleSolicitarCancelamento();
          break;
        case 'Escape': setBusca(''); setProdutos([]); buscaRef.current?.focus(); break;
        default: break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [itens, modalFinalizar, sucessoModal, itemParaRemover, modalCancelarVenda]);

  console.log('[PDV] permissoes:', permissoes);
  console.log('[PDV] cancelarVenda:', permissoes?.cancelarVenda, 'typeof:', typeof permissoes?.cancelarVenda);

  return (
    <>
      <div className="pfs-container">

        {/* ============ HEADER ============ */}
        <header className="pfs-header" style={{ backgroundColor: tema.cor }}>
          <div className="pfs-header-esq">
            <div className="pfs-header-titulo">🛒 PDV</div>
            <div className="pfs-header-user">
              {user?.nomeFuncionario || user?.nome || 'Operador'} · Venda #{venda.venda}
            </div>
          </div>
          <div className="pfs-header-dir">
            <div className="pfs-header-itens">
              <span className="pfs-header-label">ITENS</span>
              <span className="pfs-header-num">{totalItens.toFixed(0)}</span>
            </div>
            <div className="pfs-header-total">
              <span className="pfs-header-label">TOTAL</span>
              <span className="pfs-header-num">{fmt(total)}</span>
            </div>
          </div>
        </header>

        {/* ============ MAIN: SIDEBAR + CONTEÚDO ============ */}
        <div className="pfs-main">

          {/* SIDEBAR */}
          <aside className="pfs-sidebar">
            <div className="pfs-cart-visual">
              <div
                className="pfs-cart-circle"
                style={{ backgroundColor: tema.corSuave }}
              >
                🛒
              </div>
              <div className="pfs-cart-label" style={{ color: tema.cor }}>
                {venda.descricao || 'VENDA'}
              </div>
            </div>

            <div className="pfs-sidebar-stats">
              <div className="pfs-stat">
                <span className="pfs-stat-label">ITENS</span>
                <span className="pfs-stat-valor">{totalItens.toFixed(0)}</span>
              </div>
              <div className="pfs-stat pfs-stat-destaque">
                <span className="pfs-stat-label">SUBTOTAL</span>
                <span className="pfs-stat-valor" style={{ color: tema.cor }}>
                  {fmt(total)}
                </span>
              </div>
            </div>

            <div className="pfs-sidebar-info">
              <div><span>Operador</span><strong>{user?.nomeFuncionario || user?.nome || '-'}</strong></div>
              <div><span>Venda</span><strong>#{venda.venda}</strong></div>
            </div>

            <div className="pfs-sidebar-hint">
              <div className="pfs-hint-titulo">💡 Dica</div>
              <div>
                Bipe o código de barras ou digite o nome e pressione <strong>Enter</strong>.
                Use <strong>F1</strong> para ver todos os atalhos.
              </div>
            </div>
          </aside>

          {/* CONTEÚDO */}
          <section className="pfs-content">

            {/* Linha de entrada */}
            <div className="pfs-entrada">
              <div className="pfs-qtd-bloco">
                <div className="pfs-qtd-header">
                  <label className="pfs-mini-label">
                    {modoTela === 'VALOR' ? 'VALOR R$' : 'QTD'}{' '}
                    <span className="pfs-mini-atalho">[F2]</span>
                  </label>
                  <div className="pfs-modo-toggle">
                    <button
                      type="button"
                      className={`pfs-modo-btn ${modoTela === 'QTD' ? 'ativo' : ''}`}
                      onClick={() => { setModoTela('QTD'); setQtd('1'); qtdRef.current?.focus(); }}
                      title="Quantidade"
                    >QTD</button>
                    <button
                      type="button"
                      className={`pfs-modo-btn ${modoTela === 'VALOR' ? 'ativo' : ''}`}
                      onClick={() => { setModoTela('VALOR'); setQtd(''); qtdRef.current?.focus(); }}
                      title="Valor em R$"
                    >R$</button>
                  </div>
                </div>
                <input
                  ref={qtdRef}
                  type="text"
                  inputMode="decimal"
                  className="pfs-qtd-campo"
                  value={qtd}
                  onChange={(e) => setQtd(e.target.value)}
                  onFocus={(e) => e.target.select()}
                  onKeyDown={(e) => { if (e.key === 'Enter') buscaRef.current?.focus(); }}
                  placeholder={modoTela === 'VALOR' ? '0,00' : '1'}
                />
              </div>

              <div className="pfs-busca-bloco">
                <div className="pfs-qtd-header">
                  <label className="pfs-mini-label">
                    PRODUTO <span className="pfs-mini-atalho">[F3]</span>
                  </label>
                  {/* Espaço vazio à direita pra alinhar com o toggle do QTD */}
                  <div className="pfs-modo-toggle pfs-modo-toggle-ghost" aria-hidden="true">
                    <span className="pfs-modo-btn pfs-modo-btn-ghost">QTD</span>
                    <span className="pfs-modo-btn pfs-modo-btn-ghost">R$</span>
                  </div>
                </div>
                <div className="pfs-busca-wrap">
                  <input
                    ref={buscaRef}
                    type="text"
                    className="pfs-busca-input"
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    onKeyDown={handleBuscaEnter}
                    placeholder="Bipe ou digite o nome e pressione ENTER"
                    autoComplete="off"
                    autoFocus
                  />
                  {produtos.length > 0 && (
                    <div className="pfs-resultados">
                      {produtos.map((p, idx) => (
                        <button
                          key={p.referencia}
                          className={`pfs-produto ${idx === 0 ? 'primeiro' : ''}`}
                          onClick={() => handleProdutoClick(p)}
                          disabled={adicionando}
                        >
                          <span className="pfs-produto-nome">{p.descricao}</span>
                          <span className="pfs-produto-ref">{p.referencia}</span>
                          <span className="pfs-produto-preco">
                            {parseFloat(p.vista || 0) > 0 ? fmt(p.vista) : '⚠️ Sem preço'}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {feedback && (
              <div className={`pfs-feedback pfs-feedback-${feedback.tipo}`}>
                {feedback.msg}
              </div>
            )}

            <div className="pfs-itens-wrap">
              {itens.length === 0 ? (
                <div className="pfs-vazio">
                  <div className="pfs-vazio-icon">📦</div>
                  <div className="pfs-vazio-msg">Bipe o primeiro produto</div>
                  <div className="pfs-vazio-dica">
                    Pressione <strong>F1</strong> para ver os atalhos
                  </div>
                </div>
              ) : (
                itens.map((i) => (
                  <div key={i.id} className="pfs-item">
                    <div className="pfs-item-qtd">
                      {i.quantidade.toFixed(3).replace(/\.?0+$/, '')}x
                    </div>
                    <div className="pfs-item-desc">{i.descricao}</div>
                    <div className="pfs-item-unit">{fmt(i.preco)}</div>
                    <div className="pfs-item-total">{fmt(i.total)}</div>
                    <button
                      className="pfs-item-remover"
                      onClick={() => setItemParaRemover(i)}
                      title="Remover"
                      >
                      ✕
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        {/* ============ FOOTER ============ */}
        <footer className="pfs-footer" style={{ borderTopColor: tema.cor }}>
          <div className="pfs-footer-esq">
            <div className="pfs-footer-label">TOTAL</div>
            <div className="pfs-footer-valor" style={{ color: tema.cor }}>
              {fmt(total)}
            </div>
          </div>

          <div className="pfs-footer-acoes">
            <button className="pfs-btn-atalho" onClick={() => setModalAjuda(true)} title="Ajuda (F1)">
              <span className="pfs-btn-tecla">F1</span>
              <span className="pfs-btn-desc">❓ Ajuda</span>
            </button>
            <button className="pfs-btn-atalho" onClick={handleRemoverUltimo} disabled={itens.length === 0} title="Remover último (F4)">
              <span className="pfs-btn-tecla">F4</span>
              <span className="pfs-btn-desc">🗑️ Remover</span>
            </button>
            <button
              className="pfs-btn-atalho pfs-btn-perigo"
              onClick={handleSolicitarCancelamento}
              disabled={itens.length === 0}
              title="Cancelar venda (F10)"
            >
              <span className="pfs-btn-tecla">F10</span>
              <span className="pfs-btn-desc">❌ Cancelar</span>
            </button>
            <button
              className="pfs-btn-finalizar"
              style={{ backgroundColor: tema.cor }}
              onClick={handleFinalizar}
              disabled={itens.length === 0}
              title="Finalizar venda (F9)"
            >
              <span className="pfs-btn-tecla pfs-btn-tecla-branco">F9</span>
              <span className="pfs-btn-desc pfs-btn-desc-branco">💰 FINALIZAR</span>
            </button>
          </div>
        </footer>
      </div>

      {/* ============ MODAIS ============ */}
      {modalCancelarVenda && (
        <ConfirmModal
          titulo="Cancelar Venda?"
          mensagem={<>A venda #{venda.venda} com <strong>{itens.length} itens</strong> será cancelada. Continuar?</>}
          icone="❌"
          corIcone="#c0392b"
          textoConfirmar="Sim, cancelar"
          textoCancelar="Não, voltar"
          corBotaoConfirmar="#c0392b"
          onConfirmar={handleCancelarVenda}
          onCancelar={() => setModalCancelarVenda(false)}
        />
      )}

      {modalAutorizar && (
        <AutorizarCancelamentoModal
          motivo={
            modalAutorizar.acao === 'cancelarVenda'
              ? `Você precisa de autorização para cancelar a venda #${venda.venda}.`
              : 'Você precisa de autorização para esta ação.'
          }
          onAutorizado={handleAutorizado}
          onCancelar={() => setModalAutorizar(null)}
        />
      )}

      {itemParaRemover && (
        <ConfirmModal
          titulo="Remover Item"
          mensagem={<>Remover <strong>{itemParaRemover.descricao}</strong>?</>}
          icone="🗑️"
          corIcone="#e74c3c"
          textoConfirmar="Remover"
          textoCancelar="Cancelar"
          corBotaoConfirmar="#e74c3c"
          onConfirmar={confirmarRemover}
          onCancelar={() => setItemParaRemover(null)}
        />
      )}

      {modalFinalizar && (
        <FinalizarVendaModal
          mesa={venda}
          total={total}
          onClose={() => setModalFinalizar(false)}
          onSucesso={handleSucessoFinalizacao}
        />
      )}

      {sucessoModal && (
        <SuccessModal
          titulo={`Venda #${sucessoModal.venda} fechada!`}
          subtitulo="Pagamento registrado com sucesso"
          detalhes={[
            { label: 'Total pago', valor: fmt(sucessoModal.total), destaque: true },
            ...(sucessoModal.troco > 0 ? [{ label: 'Troco', valor: fmt(sucessoModal.troco), tipo: 'troco' }] : []),
            ...(sucessoModal.detalhesExtra || sucessoModal.detalhesExtras || []),
          ]}
          textoBotao="NOVA VENDA (ESC)"
          autoFecharMs={6000}
          onClose={handleFecharSucesso}
        >
          {sucessoModal?.nfce?.sucesso && sucessoModal.nfce.numero_nfce && (
            <BotaoImprimirCupom numeroNfce={sucessoModal.nfce.numero_nfce} className="suc-btn-imprimir" />
          )}
        </SuccessModal>
      )}

      {modalAjuda && (
        <div className="pfs-ajuda-overlay" onClick={() => setModalAjuda(false)}>
          <div className="pfs-ajuda-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="pfs-ajuda-titulo">⌨️ Atalhos do PDV</h2>
            <table className="pfs-ajuda-tabela">
              <tbody>
                {AJUDA.map(([tecla, desc]) => (
                  <tr key={tecla}>
                    <td className="pfs-ajuda-tecla">{tecla}</td>
                    <td className="pfs-ajuda-desc">{desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button
              className="pfs-ajuda-btn"
              style={{ backgroundColor: tema.cor }}
              onClick={() => setModalAjuda(false)}
            >
              Fechar
            </button>
          </div>
        </div>
      )}

            {produtoSemPreco && (
        <div className="pfs-preco-overlay" onClick={() => setProdutoSemPreco(null)}>
          <div className="pfs-preco-content" onClick={(e) => e.stopPropagation()}>
            <div className="pfs-preco-icon">💲</div>
            <h3 className="pfs-preco-titulo">{produtoSemPreco.produto.descricao}</h3>
            <div className="pfs-preco-sub">Produto sem preço cadastrado</div>

            <label className="pfs-preco-label">Preço unitário (R$)</label>
            <input
              ref={precoManualRef}
              type="text"
              inputMode="decimal"
              className="pfs-preco-input"
              value={precoManual}
              onChange={(e) => setPrecoManual(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') confirmarPrecoManual();
                if (e.key === 'Escape') setProdutoSemPreco(null);
              }}
              placeholder="0,00"
            />

            <div className="pfs-preco-total">
              <span>QTD {produtoSemPreco.qtd}</span>
              <strong>
                R$ {((parseNum(precoManual) || 0) * produtoSemPreco.qtd).toFixed(2).replace('.', ',')}
              </strong>
            </div>

            <div className="pfs-preco-acoes">
              <button className="pfs-preco-btn pfs-preco-btn-cinza" onClick={() => setProdutoSemPreco(null)}>
                Cancelar
              </button>
              <button
                className="pfs-preco-btn pfs-preco-btn-primario"
                style={{ backgroundColor: tema.cor }}
                onClick={confirmarPrecoManual}
              >
                ✓ Adicionar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}