// src/components/FinalizarVendaModal.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { pagamentoService } from '../services/pagamentoService';
import { usePermissoes } from '../hooks/usePermissoes';
import ClienteModal from './ClienteModal';
import TefModal from './TefModal';
import { tefService } from '../services/tefService';
import './FinalizarVendaModal.css';
import { useTema } from '../hooks/useTema';

const emCentavos = (v) => Math.round((parseFloat(v) || 0) * 100);
const deCentavos = (c) => c / 100;

const soDigitos = (v) => String(v || '').replace(/\D/g, '');

const formatarCpf = (v) => {
  const d = soDigitos(v).slice(0, 11);
  if (d.length <= 3)  return d;
  if (d.length <= 6)  return `${d.slice(0,3)}.${d.slice(3)}`;
  if (d.length <= 9)  return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6)}`;
  return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6,9)}-${d.slice(9)}`;
};

const validarCpf = (v) => {
  const d = soDigitos(v);
  if (d.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(d)) return false;
  let s = 0;
  for (let i = 0; i < 9; i++) s += parseInt(d[i], 10) * (10 - i);
  let r = (s * 10) % 11; if (r === 10) r = 0;
  if (r !== parseInt(d[9], 10)) return false;
  s = 0;
  for (let i = 0; i < 10; i++) s += parseInt(d[i], 10) * (11 - i);
  r = (s * 10) % 11; if (r === 10) r = 0;
  return r === parseInt(d[10], 10);
};

const FORMA_DINHEIRO = 1;
const LIMITE_CPF_OBRIGATORIO = 1000.0;

// ✅ Formas que disparam TEF — códigos do ERP (batem com lista de formas do backend)
const FORMAS_TEF = [4, 5, 117]; // Crédito, Débito, PIX

export default function FinalizarVendaModal({ mesa, total, onClose, onSucesso }) {
  const tema = useTema();
  const { user } = useAuth();
  const permissoes = usePermissoes();
  const [formas, setFormas] = useState([]);
  const [desconto, setDesconto] = useState(''); 
  const [pagamentos, setPagamentos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [tefCancelando, setTefCancelando] = useState(null);

  const [formaAtual, setFormaAtual] = useState(FORMA_DINHEIRO);
  const [valorAtual, setValorAtual] = useState('');

  // ✅ Cliente
  const [cliente, setCliente] = useState(null);
  const [clienteModalAberto, setClienteModalAberto] = useState(false);

  // ✅ TEF
  const [usaTef, setUsaTef] = useState(false);
  const [tefParams, setTefParams] = useState(null);
  const [tefAberto, setTefAberto] = useState(null); // { valor, codigoFormaErp }
  const [ordemTef, setOrdemTef] = useState(1);
  // ✅ CPF avulso (não persiste em vendas — vai só no payload da NFC-e)
  const [cpfNfce, setCpfNfce] = useState('');

  // ✅ Ref para evitar closure stale no callback do TefModal
  const tefAbertoRef = useRef(null);
  useEffect(() => { tefAbertoRef.current = tefAberto; }, [tefAberto]);

  useEffect(() => {
    carregarFormas();

    // Inicia com Consumidor Final
    setCliente({
      codigo: 1,
      razao: 'CONSUMIDOR FINAL',
      fantasia: 'Consumidor Final',
      cpf: '',
      tipo: 1,
      tipo_label: 'Física',
    });

    // ✅ Carrega config TEF
    (async () => {
      try {
        const ativo = await tefService.verificarAtivo();
        const usa = !!ativo?.usa_tef;
        setUsaTef(usa);
        if (usa) {
          const params = await tefService.buscarParametros();
          setTefParams(params);
        }
      } catch (err) {
        console.warn('[TEF] Não foi possível carregar config TEF:', err);
        setUsaTef(false);
      }
    })();
  }, []);

  // ✅ Bug 2/3: normaliza códigos de forma como Number
  const carregarFormas = async () => {
    const lista = await pagamentoService.listarFormas();
    const normalizada = (lista || []).map((f) => ({
      ...f,
      codigo: Number(f.codigo),
    }));
    setFormas(normalizada);
    if (normalizada.length > 0) setFormaAtual(normalizada[0].codigo);
  };

  // Cálculos em centavos
  const totalCent = emCentavos(total);
  const descontoCent = emCentavos(desconto);
  const totalFinalCent = Math.max(0, totalCent - descontoCent);
  const somaPagoCent = pagamentos.reduce(
    (sum, p) => sum + emCentavos(p.valor),
    0
  );
  const faltaCent = totalFinalCent - somaPagoCent;
  const trocoTotalCent = pagamentos.reduce(
    (sum, p) => sum + emCentavos(p.troco || 0),
    0
  );

  const descontoMaximoPerc = permissoes.descontoMaximo || 0;
  const descontoMaximoCent = Math.round((totalCent * descontoMaximoPerc) / 100);
  const descontoExcedeLimite =
    permissoes.temLimiteDesconto && descontoCent > descontoMaximoCent;

    // ============================================================
  // ✅ CPF na nota — regra fiscal
  //   - Cliente cadastrado com CPF → usa o do cliente, input oculto
  //   - CONSUMIDOR FINAL + total >= 1000 → CPF avulso OBRIGATÓRIO
  //   - CONSUMIDOR FINAL + total <  1000 → CPF avulso OPCIONAL (bônus MT)
  // ============================================================
  const cpfNfceDigitos   = soDigitos(cpfNfce);
  const cpfNfceValido    = validarCpf(cpfNfceDigitos);
  const cpfNfcePreenchido= cpfNfceDigitos.length > 0;
  const cpfNfceInvalido  = cpfNfcePreenchido && !cpfNfceValido;

  const clienteCadastrado = cliente && Number(cliente.codigo) !== 1;
  const clienteTemCpf     = clienteCadastrado
                            && cliente?.cpf
                            && soDigitos(cliente.cpf).length === 11;

  const totalFinal = deCentavos(totalFinalCent);
  const cpfObrigatorio = totalFinal >= LIMITE_CPF_OBRIGATORIO && !clienteTemCpf;
  const mostrarInputCpf = !clienteTemCpf;  // esconde se cliente cadastrado tem CPF

  const cpfOk = clienteTemCpf || cpfNfceValido;
  const faltaCpf = cpfObrigatorio && !cpfOk;

  useEffect(() => {
    if (faltaCent <= 1) {
      setValorAtual('');
      return;
    }
    setValorAtual(deCentavos(faltaCent).toFixed(2));
  }, [faltaCent]);

  // ✅ Bug 3: robusto a tipo
  const formaInfo = (codigo) =>
    formas.find((f) => Number(f.codigo) === Number(codigo));

  const valorAtualCent = emCentavos(valorAtual);
  // ✅ Bug 2: coage tipo
  const ehDinheiro = Number(formaAtual) === FORMA_DINHEIRO;
  const trocoPreviewCent =
    ehDinheiro && valorAtualCent > faltaCent
      ? valorAtualCent - faltaCent
      : 0;

  const handleAdicionarForma = () => {
    if (tefAberto) return; // ✅ Bug 6: bloqueia se TEF aberto
    setErro('');

    if (descontoExcedeLimite) {
      setErro(
        `Desconto máximo permitido: ${descontoMaximoPerc}% (R$ ${deCentavos(
          descontoMaximoCent
        ).toFixed(2)})`
      );
      return;
    }
    if (valorAtualCent <= 0) {
      setErro('Informe um valor válido');
      return;
    }
    if (!ehDinheiro && valorAtualCent > faltaCent) {
      setErro(
        `Valor maior que o que falta pagar (R$ ${deCentavos(faltaCent).toFixed(2)})`
      );
      return;
    }

    // ✅ TEF: se for Crédito/Débito/PIX e usa_tef, abre o modal TEF
    if (usaTef && FORMAS_TEF.includes(Number(formaAtual))) {
      if (!tefParams) {
        setErro('Parâmetros TEF não carregados. Verifique /app/tefParametros.');
        return;
      }
      const valorAbatidoCent = Math.min(valorAtualCent, faltaCent);
      setTefAberto({
        valor: deCentavos(valorAbatidoCent),
        codigoFormaErp: Number(formaAtual),
      });
      return;
    }

    // Fluxo normal (dinheiro e demais formas)
    const info = formaInfo(formaAtual);
    const valorAbatidoCent = Math.min(valorAtualCent, faltaCent);
    const trocoCent =
      ehDinheiro && valorAtualCent > faltaCent
        ? valorAtualCent - faltaCent
        : 0;

    setPagamentos([
      ...pagamentos,
      {
        codigo: Number(formaAtual),
        nome: info?.nome || 'Pagamento',
        icone: info?.icone || '💰',
        valor: deCentavos(valorAbatidoCent),
        valorRecebido: deCentavos(valorAtualCent),
        troco: deCentavos(trocoCent),
      },
    ]);
    setValorAtual('');
  };

  // ✅ TEF: sucesso
  const handleTefSucesso = (dadosTef) => {
    const atual = tefAbertoRef.current;
    if (!atual) return;

    const info = formaInfo(atual.codigoFormaErp);
    const ordemAtual = ordemTef;

    setPagamentos((prev) => [
      ...prev,
      {
        codigo: atual.codigoFormaErp,
        nome: info?.nome || 'TEF',
        icone: info?.icone || '💳',
        valor: atual.valor,
        valorRecebido: atual.valor,
        troco: 0,
        // Dados TEF (já foram gravados em vendas_tef pelo TefModal)
        tef: dadosTef,
        ordem: ordemAtual,
      },
    ]);

    setOrdemTef(ordemAtual + 1);
    setTefAberto(null);
    setValorAtual('');
  };

  const handleTefCancelar = () => {
    setTefAberto(null);
  };

  const handleTefErro = (msg) => {
    setErro(typeof msg === 'string' ? msg : 'Falha na transação TEF');
    setTefAberto(null);
  };

  const handleTefCancelSucesso = () => {
    const ctx = tefCancelando;
    if (!ctx) return;
    setPagamentos((prev) => prev.filter((_, i) => i !== ctx.index));
    setTefCancelando(null);
    setErro('');
  };

  const handleTefCancelErro = (msg) => {
    setErro(typeof msg === 'string' ? msg : 'Falha no cancelamento TEF');
    setTefCancelando(null);
  };

  const handleTefCancelAbortar = () => {
    setTefCancelando(null);
  };

  // ✅ Bug 4: bloqueia remoção de pagamento já processado via TEF
  const handleRemoverPagamento = (index) => {
    if (tefAberto || tefCancelando) return;
    const p = pagamentos[index];

    // Pagamento TEF: abre modal de cancelamento TEF
    if (p?.tef) {
      setTefCancelando({
        index,
        valor: p.valor,
        codigoFormaErp: p.codigo,
        dadosOriginais: p.tef,
        ordem: p.ordem || 1,
      });
      return;
    }

    setPagamentos(pagamentos.filter((_, i) => i !== index));
  };

  const handleFinalizar = async () => {
    if (loading || tefAberto) return; // ✅ Bug 6
    setErro('');

    if (descontoExcedeLimite) {
      setErro('Desconto excede o limite permitido');
      return;
    }
    if (faltaCent > 1) {
      setErro(`Ainda falta R$ ${deCentavos(faltaCent).toFixed(2)} para completar`);
      return;
    }

        // ✅ Validação CPF (front — defesa em profundidade)
    if (cpfNfceInvalido) {
      setErro('CPF inválido — verifique os dígitos');
      return;
    }
    if (faltaCpf) {
      setErro(
        `Vendas a partir de R$ ${LIMITE_CPF_OBRIGATORIO.toFixed(2)} exigem CPF/CNPJ do cliente ` +
        `(obrigatório em MT — NT 2024.001). Informe o CPF no campo acima ou troque o cliente.`
      );
      return;
    }

    setLoading(true);
    try {
      const { venda, nfce } = await pagamentoService.finalizarEEmitir({
        venda: mesa.venda,
        usuario: user?.codigoFuncionario || user?.id || 1,
        formas: pagamentos.map((p) => ({
          codigo: p.codigo,
          valor: p.valor,
          valor_recebido: p.valorRecebido,
          tef: p.tef
            ? {
                nsu: p.tef.nsu,
                autorizacao: p.tef.autorizacao,
                bandeira: p.tef.bandeira,
                bandeira_nome: p.tef.bandeiraNome,
                credenciadora: p.tef.credenciadora,
                codigo_transacao: p.tef.codigoTransacao,
                tipo: p.tef.tipo,
                forma_pgto: p.tef.formaPagto,
                id_terminal: p.tef.idTerminal,
                codigo_controle: p.tef.cupomFiscal,
                data_cartao: p.tef.dataCartao,
                hora_cartao: p.tef.horaCartao,
                tipo_finan: p.tef.tipoFinan,
                modalidade: p.tef.modalidade,
              }
            : null,
          ordem: p.ordem || null,
        })),
        valorDesconto: deCentavos(descontoCent),
        cliente: cliente?.codigo || 1,
        cpf_nfce: cpfNfceValido ? cpfNfceDigitos : '',   // ✅ NOVO
        origem: 'FACILIT',
      });

      if (venda.sucesso) {
        if (onSucesso) onSucesso({ ...venda, nfce });
      } else {
        setErro(venda.erro || 'Erro ao finalizar');
      }
    } catch (error) {
      setErro(error.response?.data?.erro || error.message || 'Erro ao finalizar');
    } finally {
      setLoading(false);
    }
  };

  const podeFinalizar =
    pagamentos.length > 0 &&
    faltaCent <= 1 &&
    !descontoExcedeLimite &&
    !loading &&
    !tefAberto &&
    !tefCancelando &&
    !faltaCpf &&
    !cpfNfceInvalido;

  const handleValorKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdicionarForma();
    }
  };

  const handleSelecionarCliente = (novoCliente) => {
    setCliente(novoCliente);
    setClienteModalAberto(false);
    setErro('');
  };

  // ✅ Bug 7: fecha overlay só se TEF não estiver aberto
  const handleOverlayClick = () => {
    if (tefAberto) return;
    onClose();
  };

  return (
    <>
      <div className="fv-overlay" onClick={handleOverlayClick}>
        <div
          className="fv-content"
          style={{
            '--tema-cor': tema.cor,
            '--tema-cor-suave': tema.corSuave,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="fv-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 26 }}>{tema.icones?.pedidos || '💰'}</span>
              <div>
                <h2 className="fv-title">Finalizar Venda</h2>
                <div className="fv-subtitle">
                  {mesa.descricao} • Pedido #{mesa.venda}
                </div>
              </div>
            </div>
            <button
              className="fv-close"
              onClick={handleOverlayClick}
              disabled={!!tefAberto}
            >
              ✕
            </button>
          </div>

          <div className="fv-body">
            {/* Total */}
            <div className="fv-total-box">
              <div className="fv-total-label">Total a Pagar</div>
              <div className="fv-total-valor">
                R$ {deCentavos(totalFinalCent).toFixed(2)}
              </div>
            </div>

            {/* ✅ CLIENTE */}
            <div className="fv-cliente-box">
              <div className="fv-cliente-info">
                <div className="fv-cliente-label">
                  {cliente?.codigo === 1 ? '👤 Cliente' : '👤 Cliente Selecionado'}
                </div>
                <div className="fv-cliente-nome">{cliente?.razao}</div>
                {cliente?.cpf && cliente.codigo !== 1 && (
                  <div className="fv-cliente-cpf">{cliente.cpf}</div>
                )}
              </div>
              <button
                className="fv-btn-trocar-cliente"
                onClick={() => setClienteModalAberto(true)}
                disabled={loading || !!tefAberto}
              >
                Trocar
              </button>
            </div>

                       {/* ✅ CPF na nota (avulso) */}
            {mostrarInputCpf && (
              <div className="fv-cpf-box">
                <label className="fv-label">
                  {cpfObrigatorio
                    ? 'CPF na nota (obrigatório para vendas a partir de R$ 1.000,00)'
                    : 'CPF na nota (opcional — concorra aos bônus de MT)'}
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  className={`fv-input ${cpfNfceInvalido ? 'fv-input-erro' : ''}`}
                  value={cpfNfce}
                  onChange={(e) => setCpfNfce(formatarCpf(e.target.value))}
                  onBlur={() => {
                    if (cpfNfcePreenchido && !cpfNfceValido) {
                      setErro('CPF inválido — verifique os dígitos');
                    }
                  }}
                  placeholder="000.000.000-00"
                  maxLength={14}
                  disabled={loading || !!tefAberto || !!tefCancelando}
                />
                {cpfNfceInvalido && (
                  <div className="fv-cpf-aviso erro">⚠️ CPF inválido</div>
                )}
                {!cpfNfceInvalido && cpfNfceValido && (
                  <div className="fv-cpf-aviso ok">✓ CPF válido</div>
                )}
                {cpfObrigatorio && !cpfNfcePreenchido && (
                  <div className="fv-cpf-aviso alerta">
                    ⚠️ Vendas a partir de R$ 1.000,00 exigem CPF/CNPJ (NT 2024.001)
                  </div>
                )}
              </div>
            )}

            {/* Desconto */}
            <label className="fv-label">Desconto (opcional)</label>
            <input
              type="number"
              className={`fv-input ${descontoExcedeLimite ? 'fv-input-erro' : ''}`}
              value={desconto}
              onChange={(e) => setDesconto(e.target.value)}
              placeholder="0.00"
              step="0.01"
              min="0"
              disabled={pagamentos.length > 0 || !!tefAberto}
              title={
                pagamentos.length > 0
                  ? 'Remova os pagamentos para alterar o desconto'
                  : ''
              }
            />

            {permissoes.temLimiteDesconto && (
              <div
                className={`fv-desconto-aviso ${
                  descontoExcedeLimite ? 'fv-desconto-aviso-erro' : ''
                }`}
              >
                {descontoExcedeLimite ? (
                  <>
                    ⚠️ Desconto máximo permitido:{' '}
                    <strong>{descontoMaximoPerc}%</strong> (R${' '}
                    {deCentavos(descontoMaximoCent).toFixed(2)})
                  </>
                ) : (
                  <>
                    💡 Desconto máximo permitido:{' '}
                    <strong>{descontoMaximoPerc}%</strong> (R${' '}
                    {deCentavos(descontoMaximoCent).toFixed(2)})
                  </>
                )}
              </div>
            )}

            {/* Pagamentos adicionados */}
            {pagamentos.length > 0 && (
              <>
                <div className="fv-section-title" style={{ marginTop: 20 }}>
                  Pagamentos Adicionados
                </div>
                <div className="fv-pagamentos-lista">
                  {pagamentos.map((p, i) => (
                    <div key={i} className="fv-pagamento-item">
                      <div className="fv-pagamento-icone">{p.icone}</div>
                      <div className="fv-pagamento-info">
                        <div className="fv-pagamento-nome">
                          {p.nome}
                          {p.tef && (
                            <span
                              style={{
                                marginLeft: 8,
                                fontSize: 11,
                                color: '#27ae60',
                                fontWeight: 600,
                              }}
                              title={`NSU ${p.tef.nsu} • Aut ${p.tef.autorizacao}`}
                            >
                              ✓ TEF
                            </span>
                          )}
                        </div>
                        {p.troco > 0 && (
                          <div className="fv-pagamento-troco">
                            Recebido: R$ {parseFloat(p.valorRecebido).toFixed(2)}{' '}
                            • Troco: R$ {parseFloat(p.troco).toFixed(2)}
                          </div>
                        )}
                      </div>
                      <div className="fv-pagamento-valor">
                        R$ {parseFloat(p.valor).toFixed(2)}
                      </div>
                      <button
                        className="fv-pagamento-remover"
                        onClick={() => handleRemoverPagamento(i)}
                        disabled={loading || !!tefAberto || !!tefCancelando}
                        title={p.tef ? 'Cancelar transação TEF' : 'Remover'}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Falta pagar / Ok */}
            {pagamentos.length > 0 && faltaCent > 1 && (
              <div className="fv-status falta">
                <span className="fv-status-label">Falta pagar</span>
                <span className="fv-status-valor">
                  R$ {deCentavos(faltaCent).toFixed(2)}
                </span>
              </div>
            )}

            {pagamentos.length > 0 && faltaCent <= 1 && (
              <div className="fv-status ok">
                <span className="fv-status-label">Total pago</span>
                <span className="fv-status-valor">✓</span>
              </div>
            )}

            {/* Adicionar forma */}
            {faltaCent > 1 && !descontoExcedeLimite && (
              <>
                <div className="fv-section-title" style={{ marginTop: 20 }}>
                  Adicionar Pagamento
                </div>

                <div className="fv-formas">
                  {formas.map((f) => (
                    <button
                      key={f.codigo}
                      className={`fv-forma ${
                        Number(formaAtual) === Number(f.codigo) ? 'ativa' : ''
                      }`}
                      onClick={() => setFormaAtual(Number(f.codigo))}
                      type="button"
                      disabled={loading || !!tefAberto}
                    >
                      <span className="fv-forma-icone">{f.icone}</span>
                      <span className="fv-forma-nome">{f.nome}</span>
                      {usaTef && FORMAS_TEF.includes(Number(f.codigo)) && (
                        <span
                          style={{
                            marginLeft: 6,
                            fontSize: 10,
                            opacity: 0.7,
                          }}
                          title="Será processado via TEF"
                        >
                          💳
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                <div className="fv-input-group">
                  <input
                    type="number"
                    className="fv-input"
                    value={valorAtual}
                    onChange={(e) => setValorAtual(e.target.value)}
                    onKeyDown={handleValorKeyDown}
                    onFocus={(e) => e.target.select()}
                    placeholder={`R$ ${deCentavos(faltaCent).toFixed(2)}`}
                    step="0.01"
                    min="0"
                    disabled={loading || !!tefAberto}
                  />
                  <button
                    type="button"
                    className="fv-btn-adicionar"
                    onClick={handleAdicionarForma}
                    disabled={loading || !valorAtual || !!tefAberto}
                  >
                    + Adicionar
                  </button>
                </div>

                {trocoPreviewCent > 0 && (
                  <div className="fv-troco-preview">
                    <span className="fv-troco-preview-label">💵 Troco</span>
                    <span className="fv-troco-preview-valor">
                      R$ {deCentavos(trocoPreviewCent).toFixed(2)}
                    </span>
                  </div>
                )}
              </>
            )}

            {trocoTotalCent > 0 && (
              <div className="fv-troco">
                <span className="fv-troco-label">Troco Total</span>
                <span className="fv-troco-valor">
                  R$ {deCentavos(trocoTotalCent).toFixed(2)}
                </span>
              </div>
            )}

            {erro && <div className="fv-erro">{erro}</div>}
          </div>

          <div className="fv-footer">
            <button
              className="fv-btn fv-btn-secundario"
              onClick={onClose}
              disabled={loading || !!tefAberto}
            >
              Cancelar
            </button>
            <button
              className="fv-btn fv-btn-primario"
              onClick={handleFinalizar}
              disabled={!podeFinalizar}
            >
              {loading ? 'Finalizando...' : '✓ Confirmar Pagamento'}
            </button>
          </div>
        </div>
      </div>

      {/* ✅ MODAL DE CLIENTE */}
      {clienteModalAberto && (
        <ClienteModal
          onSelecionar={handleSelecionarCliente}
          onClose={() => setClienteModalAberto(false)}
        />
      )}

      {/* ✅ Bug 5: TefModal como sibling, fora do fv-overlay */}
      {tefAberto && (
        <TefModal
          valor={tefAberto.valor}
          codigoFormaErp={tefAberto.codigoFormaErp}
          operador={user?.nome || user?.codigoFuncionario || 'OPERADOR'}
          numeroVenda={String(Date.now())}
          venda={mesa.venda}
          ordem={ordemTef}
          parametros={tefParams}
          onSucesso={handleTefSucesso}
          onCancelar={handleTefCancelar}
          onErro={handleTefErro}
        />
      )}

      {tefCancelando && (
      <TefModal
        valor={tefCancelando.valor}
        codigoFormaErp={tefCancelando.codigoFormaErp}
        operador={user?.nome || user?.codigoFuncionario || 'OPERADOR'}
        numeroVenda={String(Date.now())}
        venda={mesa.venda}
        ordem={tefCancelando.ordem}
        parametros={tefParams}
        modo="cancelar"
        dadosOriginais={tefCancelando.dadosOriginais}
        onSucesso={handleTefCancelSucesso}
        onCancelar={handleTefCancelAbortar}
        onErro={handleTefCancelErro}
      />
    )}
    </>
  );
}