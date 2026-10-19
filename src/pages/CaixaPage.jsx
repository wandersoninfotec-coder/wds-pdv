// src/pages/CaixaPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTema } from '../hooks/useTema';
import { usePermissoes } from '../hooks/usePermissoes';
import { caixaService } from '../services/caixaService';
import { configService } from '../services/configService';
import RelogioHeader from '../components/RelogioHeader';
import './CaixaPage.css';
import { logoUrl } from '../assets';
import CaixaAberturaModal from '../components/CaixaAberturaModal';
import CaixaFechamentoModal from '../components/CaixaFechamentoModal';


const fmt = (v) => `R$ ${Number(v || 0).toFixed(2).replace('.', ',')}`;
const hoje = () => new Date().toISOString().slice(0, 10);

export default function CaixaPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const tema = useTema();
  const permissoes = usePermissoes();

  const [empresaNome, setEmpresaNome] = useState('');
  const [caixa, setCaixa] = useState('1');
  const [data, setData]   = useState(hoje());
  const [movimentos, setMovimentos] = useState([]);
  const [rodape, setRodape] = useState({ quantidade: 0, entradas: 0, saidas: 0, saldo: 0 });
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  const [caixaInfo, setCaixaInfo] = useState(null);
  const [modalAbrir, setModalAbrir] = useState(false);
  const [modalFechar, setModalFechar] = useState(false);

  const carregarCaixaInfo = async () => {
    try {
      const r = await caixaService.caixaInfo(caixa);
      if (r.sucesso) setCaixaInfo(r);
    } catch (e) {
      console.warn('[Caixa] info:', e.message);
    }
  };

  useEffect(() => { carregarCaixaInfo(); }, [caixa]);

  const iniciais = (user?.nomeFuncionario || user?.nome || 'US')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  useEffect(() => {
    configService.carregar().then((cfg) => {
      if (cfg?.empresaNome) setEmpresaNome(cfg.empresaNome);
    });
  }, []);

  const buscar = async () => {
    setLoading(true);
    setErro('');
    try {
      const r = await caixaService.listar({ caixa, data });
      if (r.sucesso) {
        setMovimentos(r.movimentos);
        setRodape(r.rodape);
      } else {
        setErro(r.erro || 'Erro ao buscar movimentos');
      }
    } catch (e) {
      setErro(e.response?.data?.erro || e.message);
    } finally {
      setLoading(false);
    }
  };



  useEffect(() => { buscar(); }, []);

  return (
    <div className="cx-container">
      <header className="dash-header">
        <div className="dash-header-left">
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
            <h1 className="dash-header-title">Movimento de Caixa</h1>
            <div className="dash-header-subtitle">
              {empresaNome ? `${empresaNome} • ` : ''}
              {tema.nome}
            </div>
          </div>
        </div>

        <div className="mesas-header-right">
          <RelogioHeader cor={tema.cor} />
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

      {/* Banner de status */}
            {caixaInfo && (
        <div className="cx-status-banner">
          {caixaInfo.loteAtivo ? (
            <div className="cx-status cx-status-aberto">
              <span className="cx-status-dot" style={{ background: tema.cor }} />
              <span className="cx-status-texto">
                <strong>Caixa {caixaInfo.caixa} ABERTO</strong>
                {' • desde '}
                {caixaInfo.loteAtivo.data_abertura} {caixaInfo.loteAtivo.hora_abertura}
                {!caixaInfo.loteAtivo.ehDeHoje && (
                  <span className="cx-status-alerta">
                    {' '}⚠️ Aberto há {caixaInfo.loteAtivo.dias_em_aberto} dia(s) — feche antes de abrir um novo
                  </span>
                )}
                {' • Saldo atual: '}
                <strong style={{ color: tema.cor }}>
                  R$ {Number(caixaInfo.loteAtivo.saldo_atual).toFixed(2)}
                </strong>
              </span>
            </div>
          ) : (
            <div className="cx-status cx-status-fechado">
              <span className="cx-status-dot" style={{ background: '#c0392b' }} />
              <span className="cx-status-texto">
                <strong>Caixa {caixaInfo.caixa} FECHADO</strong>
                {caixaInfo.controlaManual
                  ? (caixaInfo.sugestaoValorAbertura > 0
                      ? ` • Sugestão de abertura: R$ ${Number(caixaInfo.sugestaoValorAbertura).toFixed(2)}`
                      : ' • Abra manualmente para começar')
                  : ' • Abrirá automaticamente na 1ª venda'}
              </span>
            </div>
          )}

          <div className="cx-status-acoes">
            {/* Em modo manual: só ABRIR se NÃO tem lote ativo */}
            {caixaInfo.controlaManual && !caixaInfo.loteAtivo && permissoes.abrirCaixa && (
              <button
                className="cx-status-btn cx-status-btn-abrir"
                style={{ background: tema.cor }}
                onClick={() => setModalAbrir(true)}
              >
                🔓 Abrir Caixa
              </button>
            )}

            {/* Em modo manual: só FECHAR se TEM lote ativo (hoje ou ontem) */}
            {caixaInfo.controlaManual && caixaInfo.loteAtivo && permissoes.abrirCaixa && (
              <button
                className={`cx-status-btn ${caixaInfo.precisaFecharOntem ? 'cx-status-btn-perigo-pulse' : 'cx-status-btn-fechar'}`}
                onClick={() => setModalFechar(true)}
              >
                🔒 Fechar Caixa
                {caixaInfo.precisaFecharOntem && ' (pendente de ontem)'}
              </button>
            )}
          </div>
        </div>
      )}  

      <div className="cx-filtros">
        <label>
          <span>Caixa</span>
          <input
            type="text"
            value={caixa}
            onChange={(e) => setCaixa(e.target.value)}
            placeholder="Nº do caixa"
            maxLength={6}
          />
        </label>
        <label>
          <span>Data</span>
          <input
            type="date"
            value={data}
            onChange={(e) => setData(e.target.value)}
          />
        </label>
        <button
          className="cx-btn-buscar"
          style={{ backgroundColor: tema.cor }}
          onClick={buscar}
          disabled={loading}
          type="button"
        >
          {loading ? 'Buscando...' : '🔍 Buscar Movimento'}
        </button>
      </div>

      {erro && <div className="cx-erro">{erro}</div>}

      <div className="cx-grid-wrap">
        <table className="cx-grid">
          <thead>
            <tr>
              <th>Ordem</th>
              <th>Tipo</th>
              <th>Nº Doc</th>
              <th>Forma Pgto</th>
              <th>Histórico</th>
              <th className="cx-right">Valor</th>
              <th>Usuário</th>
              <th>Origem</th>
              <th>Hora</th>
              <th>Lote</th>
            </tr>
          </thead>
          <tbody>
            {movimentos.length === 0 && !loading && (
              <tr>
                <td colSpan="10" className="cx-vazio">
                  Nenhum movimento para o período
                </td>
              </tr>
            )}
            {movimentos.map((m) => (
              <tr
                key={m.ordem}
                className={m.estornado === 1 ? 'cx-linha-estornada' : ''}
              >
                <td>{m.ordem}</td>
                <td>{m.tipo_lancamento}</td>
                <td>{m.nrodocumento}</td>
                <td>{m.formapgto}</td>
                <td className="cx-historico" title={m.historico}>
                  {m.historico}
                </td>
                <td
                  className={`cx-right ${
                    m.debitocredito === 'D' ? 'cx-saida' : 'cx-entrada'
                  }`}
                >
                  {m.debitocredito === 'D' ? '−' : '+'} {fmt(m.valor)}
                </td>
                <td>{m.usuario_label}</td>
                <td>{m.origem}</td>
                <td>{m.hora}</td>
                <td>{m.codigoloteabertura}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="cx-rodape">
        <div>
          <span>Qtde:</span>
          <strong>{rodape.quantidade}</strong>
        </div>
        <div>
          <span>Entradas:</span>
          <strong className="cx-entrada">{fmt(rodape.entradas)}</strong>
        </div>
        <div>
          <span>Saídas:</span>
          <strong className="cx-saida">{fmt(rodape.saidas)}</strong>
        </div>
        <div>
          <span>Saldo:</span>
          <strong style={{ color: tema.cor }}>{fmt(rodape.saldo)}</strong>
        </div>
      </div>

      <div className="cx-acoes">
        {permissoes.lancarCaixa && (
          <button
            className="cx-btn cx-btn-primario"
            style={{ backgroundColor: tema.cor }}
            type="button"
          >
            ➕ Novo Lançamento
          </button>
        )}
        {permissoes.estornarCaixa && (
          <button className="cx-btn cx-btn-cinza" type="button">
            ↩️ Estornar
          </button>
        )}
        {permissoes.excluirCaixa && (
          <button className="cx-btn cx-btn-vermelho" type="button">
            🗑️ Excluir
          </button>
        )}
        {permissoes.liberarCaixa && (
          <button className="cx-btn cx-btn-cinza" type="button">
            🔓 Liberar
          </button>
        )}
        {permissoes.abrirCaixa && (
          <button className="cx-btn cx-btn-cinza" type="button">
            🔒 Fechamento
          </button>
        )}
        {permissoes.relatorioCaixa && (
          <button className="cx-btn cx-btn-cinza" type="button">
            📊 Resumo
          </button>
        )}
      </div>
      {modalAbrir && (
        <CaixaAberturaModal
          caixa={caixa}
          usuario={user?.codigoFuncionario || user?.id || 1}
          valorSugerido={caixaInfo?.sugestaoValorAbertura || 0}   // ← AJUSTE
          onClose={() => setModalAbrir(false)}
          onSucesso={() => { setModalAbrir(false); carregarCaixaInfo(); buscar(); }}
        />
      )}

      {modalFechar && (
        <CaixaFechamentoModal
          caixa={caixa}
          usuario={user?.codigoFuncionario || user?.id || 1}
          loteAtivo={caixaInfo?.loteAtivo}
          onClose={() => setModalFechar(false)}
          onSucesso={() => { setModalFechar(false); carregarCaixaInfo(); buscar(); }}
        />
      )}
    </div>
  );
}