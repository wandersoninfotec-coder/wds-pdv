// src/components/MesaDetalhesModal2.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { pedidoService } from '../services/pedidoService';
import { produtoService } from '../services/produtoService';
import FinalizarVendaModal from './FinalizarVendaModal';
import SuccessModal from './SuccessModal';
import ConfirmModal from './ConfirmModal';
import BotaoImprimirCupom from './BotaoImprimirCupom';
import './MesaDetalhesModal2.css';
import { useTema } from '../hooks/useTema';  

export default function MesaDetalhesModal2({ mesa, onClose }) {
  const tema = useTema();                                    // ← ADICIONAR
  const { user } = useAuth();
  const [itens, setItens] = useState([]);
  const [loadingItens, setLoadingItens] = useState(true);
  const [busca, setBusca] = useState('');
  const [produtos, setProdutos] = useState([]);
  const [loadingProdutos, setLoadingProdutos] = useState(false);
  const [adicionando, setAdicionando] = useState(null);
  const [modalFinalizarAberto, setModalFinalizarAberto] = useState(false);
  const [sucessoModal, setSucessoModal] = useState(null);

  // Mini-modal de quantidade
  const [produtoSelecionado, setProdutoSelecionado] = useState(null);
  const [quantidadeInput, setQuantidadeInput] = useState('1');
  const [precoInput, setPrecoInput] = useState('');         // ✅ NOVO

  // Remover item
  const [itemParaRemover, setItemParaRemover] = useState(null);
  const [removendo, setRemovendo] = useState(false);

  // Sair com itens
  const [confirmandoSaida, setConfirmandoSaida] = useState(false);

  // ✅ NOVO: cancelar mesa
  const [confirmandoCancelar, setConfirmandoCancelar] = useState(false);
  const [cancelandoMesa, setCancelandoMesa] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const searchInputRef = useRef(null);
  const qtdInputRef = useRef(null);
  const debounceRef = useRef(null);

  // ============ CARREGAR ITENS ============
  const carregarItens = useCallback(async () => {
    try {
      setLoadingItens(true);
      const data = await pedidoService.listarItens(mesa.venda);
      const normalizados = (Array.isArray(data) ? data : []).map((item, index) => ({
        id: item.item || item.id || index,
        item: item.item || index,
        referencia: item.referencia,
        descricao: item.descricao || item.referencia,
        quantidade: parseFloat(item.quantidade) || 1,
        preco: parseFloat(item.preco) || 0,
        total: parseFloat(item.total_liquido) || 0,
      }));
      setItens(normalizados);
    } catch (error) {
      console.error('Erro ao carregar itens:', error);
    } finally {
      setLoadingItens(false);
    }
  }, [mesa.venda]);

  // ============ BUSCAR PRODUTOS ============
  const buscarProdutos = useCallback(async (termo) => {
    if (!termo || termo.trim().length < 1) {
      setProdutos([]);
      return;
    }
    setLoadingProdutos(true);
    try {
      const data = await produtoService.listar(termo.trim());
      const lista = Array.isArray(data) ? data : [];
      setProdutos(lista.slice(0, 30));
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
      setProdutos([]);
    } finally {
      setLoadingProdutos(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!busca.trim()) { setProdutos([]); return; }
    debounceRef.current = setTimeout(() => buscarProdutos(busca), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [busca, buscarProdutos]);

  useEffect(() => { carregarItens(); }, [carregarItens]);

  useEffect(() => {
    setTimeout(() => {
      if (searchInputRef.current) searchInputRef.current.focus();
    }, 200);
  }, []);

  // ============ PARSE ============
  const parseNumero = (str) => {
    if (!str) return 0;
    const normalizado = String(str).replace(',', '.');
    const v = parseFloat(normalizado);
    return isNaN(v) ? 0 : v;
  };
  const formatarNumero = (n) => {
    const arr = Math.round(n * 1000) / 1000;
    return String(arr).replace('.', ',');
  };
  const formatarPreco = (n) => Number(n).toFixed(2).replace('.', ',');

  const quantidade = parseNumero(quantidadeInput);
  const preco = parseNumero(precoInput);
  const totalSelecionado = preco * quantidade;

  // ============ ADICIONAR ============
  const adicionarItem = async (produto, qtd, precoFinal) => {
    const ref = produto.referencia;
    setAdicionando(ref);
    const inicio = Date.now();
    const DELAY_MINIMO = 400;

    try {
      await pedidoService.adicionarItem({
        venda: mesa.venda,
        referencia: ref,
        descricao: produto.descricao,
        quantidade: qtd,
        preco: precoFinal,
        observacao: '',
        vendedor: user?.codigoFuncionario || user?.id || 1,
      });

      const tempoDecorrido = Date.now() - inicio;
      if (tempoDecorrido < DELAY_MINIMO) {
        await new Promise((resolve) => setTimeout(resolve, DELAY_MINIMO - tempoDecorrido));
      }

      setBusca('');
      setProdutos([]);
      await carregarItens();
      if (searchInputRef.current) searchInputRef.current.focus();
    } catch (error) {
      console.error('Erro ao adicionar item:', error);
      alert('Erro ao adicionar: ' + (error.message || 'desconhecido'));
    } finally {
      setAdicionando(null);
    }
  };

  const handleProdutoClick = (produto) => {
    if (adicionando) return;
    const precoProduto = parseFloat(produto.vista) || 0;
    setProdutoSelecionado(produto);
    setQuantidadeInput('1');
    setPrecoInput(precoProduto > 0 ? formatarPreco(precoProduto) : '');
    setTimeout(() => {
      if (qtdInputRef.current) {
        qtdInputRef.current.focus();
        qtdInputRef.current.select();
      }
    }, 150);
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter' && produtos.length > 0 && !adicionando) {
      e.preventDefault();
      const p = produtos[0];
      const precoP = parseFloat(p.vista) || 0;
      adicionarItem(p, 1, precoP);
    }
    if (e.key === 'Escape') setBusca('');
  };

  const handleConfirmarQuantidade = async () => {
    if (!produtoSelecionado || quantidade <= 0 || adicionando) return;
    if (preco <= 0) {
      alert('Informe um preço válido');
      return;
    }
    const produto = produtoSelecionado;
    const qtd = quantidade;
    const p = preco;
    setProdutoSelecionado(null);
    await adicionarItem(produto, qtd, p);
  };

  const handleQtdKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); handleConfirmarQuantidade(); }
    if (e.key === 'Escape') {
      setProdutoSelecionado(null);
      if (searchInputRef.current) searchInputRef.current.focus();
    }
  };

  const handleMenos = () => {
    const novo = quantidade - 1;
    if (novo < 0.1) setQuantidadeInput('0,1');
    else setQuantidadeInput(formatarNumero(novo));
  };
  const handleMais = () => setQuantidadeInput(formatarNumero(quantidade + 1));

  const handleQtdChange = (e) => {
    const v = e.target.value;
    if (/^\d*[.,]?\d{0,3}$/.test(v) || v === '') setQuantidadeInput(v);
  };

  const handlePrecoChange = (e) => {
    const v = e.target.value;
    if (/^\d*[.,]?\d{0,2}$/.test(v) || v === '') setPrecoInput(v);
  };

  // ============ REMOVER ITEM ============
  const handleRemoverItem = (item) => setItemParaRemover(item);

  const handleConfirmarRemover = async () => {
    if (!itemParaRemover) return;
    setRemovendo(true);
    try {
      await pedidoService.removerItem(mesa.venda, itemParaRemover.item);
      await carregarItens();
      setItemParaRemover(null);
    } catch (error) {
      console.error('Erro ao remover:', error);
      throw new Error('Erro ao remover item');
    } finally {
      setRemovendo(false);
    }
  };
  const handleCancelarRemover = () => { if (removendo) return; setItemParaRemover(null); };

  // ============ FINALIZAR ============
  const calcularTotal = () => itens.reduce((sum, i) => sum + i.total, 0);
  const calcularTotalItens = () => itens.reduce((sum, i) => sum + i.quantidade, 0);

  const handleFinalizar = () => {
    if (itens.length === 0 || modalFinalizarAberto) return;
    setModalFinalizarAberto(true);
  };

  const handleSucessoFinalizacao = (resultado) => {
    setModalFinalizarAberto(false);
    const detalhesExtras = [];
    if (resultado.nfce?.sucesso) {
      detalhesExtras.push({ label: 'NFC-e', valor: `✅ Autorizada (#${resultado.nfce.numero_nfce})` });
      if (resultado.nfce.protocolo) detalhesExtras.push({ label: 'Protocolo', valor: resultado.nfce.protocolo });
      if (resultado.nfce.chave) detalhesExtras.push({ label: 'Chave', valor: String(resultado.nfce.chave).slice(-8) });
    } else if (resultado.nfce) {
      detalhesExtras.push({ label: 'NFC-e', valor: '⚠️ Pendente' });
    }
    setSucessoModal({ ...resultado, detalhesExtras });
  };

  const handleFecharSucesso = () => { setSucessoModal(null); onClose(true); };

  // ============ FECHAR ============
  const handleSolicitarFechar = () => {
    if (itens.length > 0) setConfirmandoSaida(true);
    else onClose();
  };
  const handleConfirmarFechar = () => { setConfirmandoSaida(false); onClose(); };
  const handleCancelarFechar = () => setConfirmandoSaida(false);

  // ============ CANCELAR MESA (NOVO) ============
  const handleCancelarMesa = async () => {
    setCancelandoMesa(true);
    setFeedback(null);
    try {
      const res = await pedidoService.cancelarMesa(mesa.venda, user?.codigoFuncionario || user?.id || 1);
      if (res.sucesso) {
        setConfirmandoCancelar(false);
        setFeedback({ tipo: 'ok', msg: 'Mesa cancelada com sucesso' });
        setTimeout(() => onClose(true), 1200);
      } else {
        setFeedback({ tipo: 'erro', msg: res.erro || 'Erro ao cancelar' });
        setCancelandoMesa(false);
      }
    } catch (err) {
      setFeedback({ tipo: 'erro', msg: err.response?.data?.erro || err.message });
      setCancelandoMesa(false);
    }
  };

  // ============ ESC ============
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') {
        if (produtoSelecionado) setProdutoSelecionado(null);
        else if (itemParaRemover) setItemParaRemover(null);
        else if (confirmandoCancelar) setConfirmandoCancelar(false);
        else if (confirmandoSaida) setConfirmandoSaida(false);
        else if (!modalFinalizarAberto && !sucessoModal) handleSolicitarFechar();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalFinalizarAberto, produtoSelecionado, itemParaRemover, confirmandoCancelar, confirmandoSaida, sucessoModal, itens.length]);

  const precoProdutoOriginal = parseFloat(produtoSelecionado?.vista) || 0;
  const precoEditavel = precoProdutoOriginal === 0;

  return (
    <>
      <div className="mdm-overlay" onClick={handleSolicitarFechar}>
        <div className="mdm-content" onClick={(e) => e.stopPropagation()}
            style={{                                             // ← ADICIONAR
            '--tema-cor': tema.cor,
            '--tema-cor-suave': tema.corSuave,
          }}
        >
          <div className="mdm-header">
            <div className="mdm-header-left">
              <div className="mdm-header-icon"></div>
              <div>
                <h2 className="mdm-title">{mesa.descricao}</h2>
                <div className="mdm-subtitle">
                  Pedido #{mesa.venda} • {calcularTotalItens().toFixed(2)}{' '}
                  {calcularTotalItens() === 1 ? 'item' : 'itens'}
                </div>
              </div>
            </div>
            <button className="mdm-close" onClick={handleSolicitarFechar}>✕</button>
          </div>

          {feedback && (
            <div className={`mdm-feedback mdm-feedback-${feedback.tipo}`}>{feedback.msg}</div>
          )}

          <div className="mdm-search">
            <span className="mdm-search-icon">🔍</span>
            <input
              ref={searchInputRef}
              type="text"
              className="mdm-search-input"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Código de barras ou nome do produto..."
              autoComplete="off"
            />
            {busca && (
              <button className="mdm-search-clear" onClick={() => { setBusca(''); searchInputRef.current?.focus(); }}>✕</button>
            )}
          </div>

          {!busca && (
            <div className="mdm-search-hint">
              💡 Passe o leitor (Enter adiciona 1) ou clique no produto (escolher quantidade)
            </div>
          )}

          <div className="mdm-body">
            <div className="mdm-col">
              <div className="mdm-col-header">
                {busca ? `Resultados (${produtos.length})` : 'Digite para buscar produtos'}
              </div>
              <div className="mdm-col-body">
                {loadingProdutos ? (
                  <div className="mdm-loading">Buscando...</div>
                ) : produtos.length === 0 && busca ? (
                  <div className="mdm-empty">
                    <div className="mdm-empty-icon">🔍</div>
                    <div className="mdm-empty-titulo">Nenhum produto encontrado</div>
                    <div className="mdm-empty-sub">Tente outro código ou nome</div>
                  </div>
                ) : produtos.length === 0 ? (
                  <div className="mdm-empty">
                    <div className="mdm-empty-icon">📦</div>
                    <div className="mdm-empty-titulo">Pesquise um produto</div>
                    <div className="mdm-empty-sub">Ou passe o leitor de código de barras</div>
                  </div>
                ) : (
                  produtos.map((p) => (
                    <button
                      key={p.referencia}
                      className="mdm-produto"
                      onClick={() => handleProdutoClick(p)}
                      disabled={adicionando === p.referencia || adicionando !== null}
                    >
                      <div className="mdm-produto-info">
                        <div className="mdm-produto-nome">{p.descricao}</div>
                        <div className="mdm-produto-ref">Ref: {p.referencia}</div>
                      </div>
                      <div className="mdm-produto-preco">
                        {adicionando === p.referencia ? '...' : (
                          parseFloat(p.vista || 0) > 0
                            ? `R$ ${parseFloat(p.vista).toFixed(2)}`
                            : '⚠️ Definir preço'
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="mdm-col">
              <div className="mdm-col-header">Itens da Mesa ({itens.length})</div>
              <div className="mdm-col-body">
                {loadingItens ? (
                  <div className="mdm-loading">Carregando...</div>
                ) : itens.length === 0 ? (
                  <div className="mdm-empty">
                    <div className="mdm-empty-icon">📭</div>
                    <div className="mdm-empty-titulo">Mesa vazia</div>
                    <div className="mdm-empty-sub">Adicione produtos pela busca</div>
                  </div>
                ) : (
                  itens.map((item) => (
                    <div key={item.id} className="mdm-item">
                      <div className="mdm-item-qtd">
                        {item.quantidade.toFixed(2).replace(/\.?0+$/, '')}x
                      </div>
                      <div className="mdm-item-info">
                        <div className="mdm-item-nome">{item.descricao}</div>
                        <div className="mdm-item-preco">R$ {item.preco.toFixed(2)} cada</div>
                      </div>
                      <div className="mdm-item-total">R$ {item.total.toFixed(2)}</div>
                      <button
                        className="mdm-item-remove"
                        onClick={() => handleRemoverItem(item)}
                        title="Remover item"
                      >✕</button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="mdm-resumo">
            <div>
              <div className="mdm-resumo-info">Total do Pedido</div>
              <div className="mdm-resumo-info" style={{ marginTop: 2 }}>
                {calcularTotalItens().toFixed(2)}{' '}
                {calcularTotalItens() === 1 ? 'item' : 'itens'}
              </div>
            </div>
            <div className="mdm-resumo-total">R$ {calcularTotal().toFixed(2)}</div>
          </div>

          <div className="mdm-footer">
            <button
              className="mdm-btn mdm-btn-perigo"
              onClick={() => setConfirmandoCancelar(true)}
              disabled={cancelandoMesa}
            >
              ❌ Cancelar Mesa
            </button>
            <button className="mdm-btn mdm-btn-secundario" onClick={handleSolicitarFechar}>
              Fechar
            </button>
            <button
              className="mdm-btn mdm-btn-primario"
              onClick={handleFinalizar}
              disabled={itens.length === 0 || modalFinalizarAberto}
            >
              💰 Finalizar Mesa
            </button>
          </div>
        </div>
      </div>

      {/* ========== MINI-MODAL DE QUANTIDADE + PREÇO ========== */}
      {produtoSelecionado && (
        <div
          className="mdm-qtd-overlay"
          onClick={() => {
            if (adicionando) return;
            setProdutoSelecionado(null);
            searchInputRef.current?.focus();
          }}
        >
          <div className="mdm-qtd-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="mdm-qtd-title">{produtoSelecionado.descricao}</h3>
            <div className="mdm-qtd-subtitle">
              {precoProdutoOriginal > 0
                ? `R$ ${precoProdutoOriginal.toFixed(2)} cada`
                : '⚠️ Produto sem preço cadastrado'}
            </div>

            <label className="mdm-qtd-label">Quantidade</label>
            <div className="mdm-qtd-controls">
              <button
                className="mdm-qtd-btn mdm-qtd-btn-menos"
                onClick={handleMenos}
                disabled={quantidade <= 0.1 || adicionando !== null}
              >−</button>
              <input
                ref={qtdInputRef}
                type="text"
                inputMode="decimal"
                className="mdm-qtd-input"
                value={quantidadeInput}
                onChange={handleQtdChange}
                onKeyDown={handleQtdKeyDown}
                placeholder="0"
                autoComplete="off"
                disabled={adicionando !== null}
              />
              <button
                className="mdm-qtd-btn mdm-qtd-btn-mais"
                onClick={handleMais}
                disabled={adicionando !== null}
              >+</button>
            </div>
            <div className="mdm-qtd-hint">
              💡 Digite a quantidade (aceita decimal — ex: 0,5 para meio quilo)
            </div>

            {/* ✅ NOVO: campo de preço */}
            <label className="mdm-qtd-label" style={{ marginTop: 12 }}>
              Preço unitário {precoEditavel && <span style={{ color: '#e67e22' }}>(obrigatório)</span>}
            </label>
            <input
              type="text"
              inputMode="decimal"
              className="mdm-qtd-input mdm-preco-input"
              value={precoInput}
              onChange={handlePrecoChange}
              onKeyDown={(e) => { if (e.key === 'Enter') handleConfirmarQuantidade(); }}
              placeholder="0,00"
              disabled={!precoEditavel || adicionando !== null}
              title={precoEditavel ? 'Produto sem preço — informe o valor' : 'Preço do cadastro (não editável)'}
            />

            <div className="mdm-qtd-total">
              <span className="mdm-qtd-total-label">Total</span>
              <span className="mdm-qtd-total-valor">R$ {totalSelecionado.toFixed(2)}</span>
            </div>

            <div className="mdm-qtd-footer">
              <button
                className="mdm-qtd-btn-acao mdm-qtd-btn-cancelar"
                onClick={() => {
                  if (adicionando) return;
                  setProdutoSelecionado(null);
                  searchInputRef.current?.focus();
                }}
                disabled={adicionando !== null}
              >Cancelar</button>
              <button
                className="mdm-qtd-btn-acao mdm-qtd-btn-confirmar"
                onClick={handleConfirmarQuantidade}
                disabled={adicionando !== null || quantidade <= 0 || preco <= 0}
              >
                {adicionando ? '⏳ Adicionando...' : '✓ Adicionar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========== CONFIRMAÇÃO: REMOVER ITEM ========== */}
      {itemParaRemover && (
        <ConfirmModal
          titulo="Remover Item"
          mensagem={<>Deseja remover <strong>{itemParaRemover.descricao}</strong> da mesa?</>}
          icone="🗑️"
          corIcone="#e74c3c"
          corIconeFundo="#fdecea"
          textoConfirmar="🗑️ Remover"
          textoCancelar="Cancelar"
          corBotaoConfirmar="#e74c3c"
          loading={removendo}
          onConfirmar={handleConfirmarRemover}
          onCancelar={handleCancelarRemover}
        />
      )}

      {/* ========== CONFIRMAÇÃO: SAIR COM ITENS ========== */}
      {confirmandoSaida && (
        <ConfirmModal
          titulo="Sair da Mesa?"
          mensagem={
            <>
              Esta mesa possui <strong>{itens.length}</strong>{' '}
              {itens.length === 1 ? 'item lançado' : 'itens lançados'}.
              <br /><br />
              Se você sair agora, o pedido continua salvo. Você pode voltar
              depois para finalizar.
            </>
          }
          icone="⚠️"
          corIcone="#f39c12"
          corIconeFundo="#fef3e5"
          textoConfirmar="Sim, sair"
          textoCancelar="Continuar aqui"
          corBotaoConfirmar="#f39c12"
          onConfirmar={handleConfirmarFechar}
          onCancelar={handleCancelarFechar}
        />
      )}

      {/* ========== CONFIRMAÇÃO: CANCELAR MESA (NOVO) ========== */}
      {confirmandoCancelar && (
        <ConfirmModal
          titulo="Cancelar Mesa?"
          mensagem={
            <>
              Esta ação vai <strong>cancelar permanentemente</strong> a venda
              #{mesa.venda}
              {itens.length > 0 && (
                <> com <strong>{itens.length}</strong> {itens.length === 1 ? 'item' : 'itens'}</>
              )}.
              <br /><br />
              Os itens serão marcados como cancelados e não poderão ser
              recuperados nesta venda.
            </>
          }
          icone="❌"
          corIcone="#c0392b"
          corIconeFundo="#fdecea"
          textoConfirmar="Sim, cancelar mesa"
          textoCancelar="Não, voltar"
          corBotaoConfirmar="#c0392b"
          loading={cancelandoMesa}
          onConfirmar={handleCancelarMesa}
          onCancelar={() => setConfirmandoCancelar(false)}
        />
      )}

      {/* ========== MODAL DE SUCESSO ========== */}
      {sucessoModal && (
        <SuccessModal
          titulo={`Venda #${sucessoModal.venda} fechada!`}
          subtitulo="Pagamento registrado com sucesso"
          detalhes={[
            { label: 'Total pago', valor: `R$ ${sucessoModal.total.toFixed(2)}`, destaque: true },
            ...(sucessoModal.troco > 0 ? [{ label: 'Troco', valor: `R$ ${sucessoModal.troco.toFixed(2)}`, tipo: 'troco' }] : []),
            ...(sucessoModal.detalhesExtras || []),
          ]}
          textoBotao="OK"
          autoFecharMs={8000}
          onClose={handleFecharSucesso}
        >
          {sucessoModal?.nfce?.sucesso && sucessoModal.nfce.numero_nfce && (
            <BotaoImprimirCupom numeroNfce={sucessoModal.nfce.numero_nfce} className="suc-btn-imprimir" />
          )}
        </SuccessModal>
      )}

      {/* ========== MODAL DE FINALIZAR ========== */}
      {modalFinalizarAberto && (
        <FinalizarVendaModal
          mesa={mesa}
          total={calcularTotal()}
          onClose={() => setModalFinalizarAberto(false)}
          onSucesso={handleSucessoFinalizacao}
        />
      )}
    </>
  );
}