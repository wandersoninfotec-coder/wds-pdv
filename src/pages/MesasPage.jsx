// src/pages/MesasPage.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTema } from '../hooks/useTema';
import { usePermissoes } from '../hooks/usePermissoes';
import { configService } from '../services/configService';
import { mesaService } from '../services/mesaService';
import MesaDetalhesModal2 from '../components/MesaDetalhesModal2';
import ConfirmModal from '../components/ConfirmModal';
import MesasFooterPanel from '../components/MesasFooterPanel';
import RelogioHeader from '../components/RelogioHeader';
import './MesasPage.css';
import { logoUrl } from '../assets';
// src/pages/MesasPage.jsx
import { caixaService } from '../services/caixaService';
import CaixaAberturaModal from '../components/CaixaAberturaModal';
import CaixaFechamentoModal from '../components/CaixaFechamentoModal';

export default function MesasPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const tema = useTema();
  const permissoes = usePermissoes();
  const [mesas, setMesas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [mesaSelecionada, setMesaSelecionada] = useState(null);
  const [mesaParaAbrir, setMesaParaAbrir] = useState(null);
  const [abrindoMesa, setAbrindoMesa] = useState(false);
  const [empresaNome, setEmpresaNome] = useState('');
  const [caixaGuard, setCaixaGuard] = useState(null);
  // null = ainda checando, { pode: true } = liberado, { pode: false, ... } = bloqueado
  const [modalAbrir, setModalAbrir] = useState(false);
  const [modalFechar, setModalFechar] = useState(false);

  const intervalRef = useRef(null);

  const carregarMesas = useCallback(async (mostrarLoading = false) => {
    if (mostrarLoading) setLoading(true);
    else setAtualizando(true);

    try {
      const data = await mesaService.listar();

      let lista = [];
      if (Array.isArray(data)) lista = data;
      else if (data && typeof data === 'object') {
        lista = data.mesas || data.data || Object.values(data);
      }

      const normalizadas = lista.map((m, index) => {
        const vendaRaw = m.venda ?? m.venda_atual ?? m.nro_venda ?? 0;
        const vendaNum = parseInt(vendaRaw) || 0;
        const temVendaAberta = vendaNum > 0;
        const numeroRaw =
          m.mesa_codigo ?? m.mesa_comanda ?? m.numero ?? m.mesa ?? index + 1;

        return {
          id: numeroRaw,
          numero: String(numeroRaw),
          descricao: m.mesa_descricao ?? m.descricao ?? `Mesa ${numeroRaw}`,
          status: temVendaAberta ? 'ocupada' : 'livre',
          venda: temVendaAberta ? vendaNum : null,
          total: parseFloat(m.total) || 0,
          vendedor: m.vendedor || null,
        };
      });

      setMesas(normalizadas);
    } catch (error) {
      console.error('❌ Erro ao carregar mesas:', error);
    } finally {
      setLoading(false);
      setAtualizando(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const r = await caixaService.podeVender('1');
        setCaixaGuard(r);
      } catch (e) {
        // Falha na consulta → não bloqueia (fail-open)
        setCaixaGuard({ pode: true, info: null, erroConsulta: e.message });
      }
    })();
  }, []);

  useEffect(() => {
    carregarMesas(true);
    intervalRef.current = setInterval(() => carregarMesas(false), 10000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [carregarMesas]);

  useEffect(() => {
    configService.carregar().then((cfg) => {
      if (cfg?.empresaNome) setEmpresaNome(cfg.empresaNome);
    });
  }, []);

  const calcularTamanhoCard = () => {
    const total = mesas.length;
    if (total <= 20) return { size: '160px', gap: '18px' };
    if (total <= 40) return { size: '130px', gap: '14px' };
    if (total <= 60) return { size: '110px', gap: '12px' };
    return { size: '95px', gap: '10px' };
  };

  const { size, gap } = calcularTamanhoCard();

  // ✅ Clicar em mesa: livre abre confirmação, ocupada abre detalhes
  const handleMesaClick = (mesa) => {
    if (mesa.status === 'livre') {
      setMesaParaAbrir(mesa);
    } else {
      setMesaSelecionada(mesa);
    }
  };

  // ✅ Abrir mesa (livre)
  const handleConfirmarAbrirMesa = async () => {
    if (!mesaParaAbrir) return;

    setAbrindoMesa(true);
    try {
      const resultado = await mesaService.abrirMesa(
        mesaParaAbrir.numero,
        user?.codigoFuncionario || user?.id || 1
      );

      const vendaId = resultado?.venda || resultado?.id;
      const jaAberta = resultado?.ja_aberta === true;

      if (!vendaId || vendaId <= 0) {
        throw new Error('A API não retornou o ID da venda');
      }

      const mesaComVenda = {
        ...mesaParaAbrir,
        status: 'ocupada',
        venda: vendaId,
        total: 0,
      };

      setMesaParaAbrir(null);
      await carregarMesas(false);
      setMesaSelecionada(mesaComVenda);

      if (jaAberta) {
        // eslint-disable-next-line no-alert
        alert(`Atenção: esta mesa já possuía a venda #${vendaId} aberta.`);
      }
    } catch (error) {
      console.error('Erro ao abrir mesa:', error);
      throw new Error(error.message || 'Falha ao abrir mesa');
    } finally {
      setAbrindoMesa(false);
    }
  };

  const handleCancelarAbrirMesa = () => {
    if (abrindoMesa) return;
    setMesaParaAbrir(null);
  };

  const handleFecharModal = (sucesso = false) => {
    setMesaSelecionada(null);
    carregarMesas(sucesso ? true : false);
  };

  const contadores = {
    livres: mesas.filter((m) => m.status === 'livre').length,
    ocupadas: mesas.filter((m) => m.status === 'ocupada').length,
    total: mesas.length,
  };

    // Enquanto consulta o caixa, mostra loading
  if (!caixaGuard) {
    return (
      <div className="mesas-container">
        <div style={{ padding: 40, textAlign: 'center', color: '#7f8c8d' }}>
          Verificando caixa...
        </div>
      </div>
    );
  }

  // Bloqueio: caixa fechado (manual)
  if (!caixaGuard.pode) {
    const ehAbertoOntem = caixaGuard.precisaFecharOntem;
    return (
      <>
        <div className="mesas-container">
          <header className="dash-header">
            <div className="dash-header-left">
              <button className="mesas-header-back" onClick={() => navigate('/dashboard')}>←</button>
              <div className="mesas-header-logo-circle">
                <img src="/logo.png" alt="WDS Food" className="mesas-header-logo-img" />
              </div>
              <div>
                <h1 className="dash-header-title">Mesas</h1>
                <div className="dash-header-subtitle">Caixa não está pronto</div>
              </div>
            </div>
          </header>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh',
            padding: 40,
            textAlign: 'center',
            gap: 16,
          }}>
            <div style={{ fontSize: 56 }}>{ehAbertoOntem ? '⚠️' : '🔒'}</div>
            <h2 style={{ margin: 0, color: '#2c3e50' }}>
              {ehAbertoOntem ? 'Caixa pendente de fechamento' : 'Caixa fechado'}
            </h2>
            <p style={{ color: '#7f8c8d', maxWidth: 480, margin: 0 }}>
              {ehAbertoOntem
                ? `O caixa foi aberto em ${caixaGuard.info?.loteAtivo?.data_abertura}. Feche-o antes de abrir um novo para hoje.`
                : 'Para vender, é necessário abrir o caixa.'}
            </p>

            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <button
                className="mesas-btn-voltar"
                onClick={() => navigate('/caixa')}
                style={{ padding: '12px 20px', background: '#ecf0f1', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}
              >
                Ir para Caixa
              </button>

              {ehAbertoOntem ? (
                <button
                  onClick={() => setModalFechar(true)}
                  style={{ padding: '12px 20px', background: '#c0392b', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}
                >
                  🔒 Fechar Caixa de Ontem
                </button>
              ) : (
                <button
                  onClick={() => setModalAbrir(true)}
                  style={{ padding: '12px 20px', background: tema.cor, color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}
                >
                  🔓 Abrir Caixa
                </button>
              )}
            </div>
          </div>
        </div>

        {modalAbrir && (
          <CaixaAberturaModal
            caixa="1"
            usuario={user?.codigoFuncionario || user?.id || 1}
            valorSugerido={caixaGuard.info?.sugestaoValorAbertura || 0}
            onClose={() => setModalAbrir(false)}
            onSucesso={() => {
              setModalAbrir(false);
              // Re-verifica
              caixaService.podeVender('1').then(setCaixaGuard);
            }}
          />
        )}

        {modalFechar && (
          <CaixaFechamentoModal
            caixa="1"
            usuario={user?.codigoFuncionario || user?.id || 1}
            loteAtivo={caixaGuard.info?.loteAtivo}
            onClose={() => setModalFechar(false)}
            onSucesso={() => {
              setModalFechar(false);
              caixaService.podeVender('1').then(setCaixaGuard);
            }}
          />
        )}
      </>
    );
  }

  const iniciais = (user?.nomeFuncionario || user?.nome || 'US')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="mesas-container">
           <header className="mesas-header">
        <div className="mesas-header-left">
          <button
            className="mesas-header-back"
            onClick={() => navigate('/dashboard')}
            title="Voltar para o Dashboard"
          >
            ←
          </button>
          <div className="mesas-header-logo-circle">
            <img src={logoUrl} alt="WDS Food" className="mesas-header-logo-img" />
          </div>
          <div>
            <h1 className="mesas-header-title">Mesas</h1>
            <div className="mesas-header-user">
              {empresaNome ? `${empresaNome} • ` : ''}
              {tema.nome}
            </div>
          </div>
        </div>

        <div className="mesas-header-right">
          {/* ✅ Relógio em tempo real */}
          <RelogioHeader cor={tema.cor} />

          {/* ✅ Nome + Avatar juntos */}
          <div className="mesas-user-bloco">            
            <div className="mesas-header-user-name">
              {user?.nomeFuncionario || user?.nome || 'Usuário'}
            </div>
          </div>
          <div
              className="mesas-user-avatar"
              style={{ backgroundColor: tema.cor }}
            >
              {iniciais}
          </div>
          <button className="mesas-btn-sair" onClick={logout}>
            Sair
          </button>
        </div>
      </header>
      
      <div className="mesas-contadores">
        <div className="contador-item livres">
          <div className="contador-numero">{contadores.livres}</div>
          <div className="contador-label">LIVRES</div>
        </div>

        <div className="contador-item ocupadas">
          <div className="contador-numero">{contadores.ocupadas}</div>
          <div className="contador-label">OCUPADAS</div>
        </div>

        <div
          className="contador-item total"
          style={{ backgroundColor: tema.corSuave }}
        >
          <div className="contador-numero" style={{ color: tema.cor }}>
            {contadores.total}
          </div>
          <div className="contador-label" style={{ color: tema.cor }}>
            TOTAL
          </div>
        </div>

        <div className="live-indicator">
          <div className={`live-dot ${atualizando ? 'atualizando' : ''}`} />
          {atualizando ? 'Atualizando...' : 'Ao vivo • 10s'}
        </div>
      </div>
      

      {loading ? (
        <div className="mesas-loading">
          <div
            className="mesas-loading-spinner"
            style={{ borderTopColor: tema.cor }}
          />
          Carregando mesas...
        </div>
      ) : (
        <div
          className="mesas-grid"
          style={{
            '--mesa-size': size,
            '--gap-size': gap,
          }}
        >
          {mesas.length === 0 ? (
            <div className="mesas-vazio">
              <div className="mesas-vazio-icon">{tema.icones.mesas}</div>
              <div className="mesas-vazio-titulo">Nenhuma mesa encontrada</div>
              <div>Verifique a conexão com o servidor</div>
            </div>
          ) : (
            mesas.map((mesa) => (
              <div
                key={mesa.id}
                className={`mesa-card ${mesa.status}`}
                onClick={() => handleMesaClick(mesa)}
                title={
                  mesa.status === 'livre'
                    ? 'Clique para abrir esta mesa'
                    : 'Clique para ver o pedido'
                }
              >
                <div className="mesa-numero">{mesa.numero}</div>
                <div className="mesa-icone">
                  {mesa.status === 'ocupada'
                    ? tema.icones.pedidos
                    : tema.icones.mesas}
                </div>
                <div className="mesa-status-badge">
                  {mesa.status === 'ocupada' ? 'OCUP' : 'LIVRE'}
                </div>
                {mesa.status === 'ocupada' &&
                  mesa.total > 0 &&
                  permissoes.visualizarRelatorios && (
                    <div className="mesa-total">
                      R$ {mesa.total.toFixed(2)}
                    </div>
                  )}
              </div>
            ))
          )}
        </div>
      )}

      {/* ✅ PAINEL INFERIOR - Resumo do Dia + Últimas Vendas */}
      {!loading && <MesasFooterPanel />}

      {/* ✅ MODAL DE DETALHES (mesa ocupada) */}
      {mesaSelecionada && (
        <MesaDetalhesModal2
          mesa={mesaSelecionada}
          onClose={handleFecharModal}
        />
      )}

      {/* ✅ MODAL DE CONFIRMAÇÃO (abrir mesa livre) */}
      {mesaParaAbrir && (
        <ConfirmModal
          titulo="Abrir Mesa"
          mensagem={
            <>
              Deseja abrir a <strong>{mesaParaAbrir.descricao}</strong>?
            </>
          }
          icone={tema.icones.mesas}
          corIcone={tema.cor}
          corIconeFundo={tema.corSuave}
          textoConfirmar="✓ Abrir Mesa"
          textoCancelar="Cancelar"
          corBotaoConfirmar={tema.cor}
          loading={abrindoMesa}
          onConfirmar={handleConfirmarAbrirMesa}
          onCancelar={handleCancelarAbrirMesa}
        />
      )}
    </div>
  );
}