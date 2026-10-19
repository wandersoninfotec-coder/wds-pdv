// src/pages/JobsPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTema } from '../hooks/useTema';
import { configService } from '../services/configService';
import { jobService } from '../services/jobService';
import RelogioHeader from '../components/RelogioHeader';
import './JobsPage.css';
import { logoUrl } from '../assets';

const fmtDataBR = (dataISO) => {
  if (!dataISO) return '-';
  const [y, m, d] = String(dataISO).split('-');
  return `${d}/${m}/${y}`;
};

export default function JobsPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const tema = useTema();

  const [empresaNome, setEmpresaNome] = useState('');
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(false);
  const [executando, setExecutando] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [dias, setDias] = useState(7);

  useEffect(() => {
    configService.carregar().then((cfg) => {
      if (cfg?.empresaNome) setEmpresaNome(cfg.empresaNome);
    });
  }, []);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const result = await jobService.status(dias);
      setDados(result);
    } catch (err) {
      console.error(err);
      setDados(null);
    } finally {
      setLoading(false);
    }
  }, [dias]);

  useEffect(() => { carregar(); }, [carregar]);

  const handleExecutar = async (tipo) => {
    if (executando) return;
    setExecutando(tipo);
    setFeedback(null);
    try {
      let res;
      if (tipo === 'contingencia') {
        res = await jobService.dispararContingencia();
        setFeedback({ tipo: 'ok', msg: `Contingência: ${res.total || 0} processadas (${res.autorizadas || 0} autorizadas)` });
      } else if (tipo === 'rejeitadas') {
        res = await jobService.dispararRejeitadas(false, 30);
        const r = res.retransmitidas || {};
        const i = res.inutilizadas || {};
        setFeedback({
          tipo: 'ok',
          msg: `Rejeitadas: ${r.autorizadas || 0} autorizadas de ${r.total || 0} • Inutilizadas: ${i.sucesso || 0} de ${i.total || 0}`,
        });
      } else if (tipo === 'rejeitadas_forcar') {
        res = await jobService.dispararRejeitadas(true, 30);
        const i = res.inutilizadas || {};
        setFeedback({
          tipo: 'ok',
          msg: `Forçado: ${i.sucesso || 0} inutilizadas de ${i.total || 0}`,
        });
      }
      await carregar();
    } catch (err) {
      setFeedback({ tipo: 'erro', msg: 'Erro: ' + (err.response?.data?.erro || err.message) });
    } finally {
      setExecutando('');
    }
  };

  const iniciais = (user?.nomeFuncionario || user?.nome || 'US')
    .split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();

  const jobs = dados?.jobs || {};

  return (
    <div className="jobs-container">
      <header className="dash-header">
        <div className="dash-header-left">
          <button className="notas-btn-voltar" onClick={() => navigate('/dashboard')}>← Voltar</button>
          <div className="mesas-header-logo-circle">
             <img src={logoUrl} alt="WDS Food" className="mesas-header-logo-img" />
          </div>
          <div>
            <h1 className="dash-header-title">Automações</h1>
            <div className="dash-header-subtitle">
              {empresaNome ? `${empresaNome} • ` : ''}
              Jobs de manutenção
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
          <div className="mesas-user-avatar" style={{ backgroundColor: tema.cor }}>{iniciais}</div>
          <button className="mesas-btn-sair" onClick={logout}>Sair</button>
        </div>
      </header>

      {feedback && (
        <div className={`jobs-feedback jobs-feedback-${feedback.tipo}`}>
          {feedback.msg}
        </div>
      )}

      {/* Cards de ação */}
      <div className="jobs-acoes">
        <div className="jobs-card">
          <div className="jobs-card-header">
            <span className="jobs-card-icone">🔄</span>
            <div>
              <div className="jobs-card-titulo">Reprocessar Contingência</div>
              <div className="jobs-card-desc">Transmite NFC-e emitidas em contingência (status 8)</div>
            </div>
          </div>
          <div className="jobs-card-ultima">
            Última: {jobs.contingencia?.ultima?.executado
              ? `${fmtDataBR(jobs.contingencia.ultima.data)} — ${jobs.contingencia.ultima.resumo}`
              : 'nunca executado'}
          </div>
          <button
            className="jobs-btn jobs-btn-azul"
            onClick={() => handleExecutar('contingencia')}
            disabled={!!executando}
          >
            {executando === 'contingencia' ? '⏳ Executando...' : '▶️ Executar agora'}
          </button>
        </div>

        <div className="jobs-card">
          <div className="jobs-card-header">
            <span className="jobs-card-icone">🔁</span>
            <div>
              <div className="jobs-card-titulo">Reprocessar Rejeitadas</div>
              <div className="jobs-card-desc">Regerar e retransmitir rejeitadas do mês atual</div>
            </div>
          </div>
          <div className="jobs-card-ultima">
            Última: {jobs.rejeitadas?.ultima?.executado
              ? `${fmtDataBR(jobs.rejeitadas.ultima.data)} — ${jobs.rejeitadas.ultima.resumo}`
              : 'nunca executado'}
          </div>
          <button
            className="jobs-btn jobs-btn-laranja"
            onClick={() => handleExecutar('rejeitadas')}
            disabled={!!executando}
          >
            {executando === 'rejeitadas' ? '⏳ Executando...' : '▶️ Executar agora'}
          </button>
        </div>

        <div className="jobs-card">
          <div className="jobs-card-header">
            <span className="jobs-card-icone">🚫</span>
            <div>
              <div className="jobs-card-titulo">Inutilizar (forçado)</div>
              <div className="jobs-card-desc">Inutiliza anteriores <strong>ignorando dia configurado</strong></div>
            </div>
          </div>
          <div className="jobs-card-ultima">
            ⚠️ Use apenas quando precisar forçar fora do dia programado
          </div>
          <button
            className="jobs-btn jobs-btn-vermelho"
            onClick={() => handleExecutar('rejeitadas_forcar')}
            disabled={!!executando}
          >
            {executando === 'rejeitadas_forcar' ? '⏳ Executando...' : '⚠️ Forçar inutilização'}
          </button>
        </div>
      </div>

      {/* Histórico */}
      <div className="jobs-historico-wrap">
        <div className="jobs-historico-header">
          <div className="jobs-historico-titulo">📅 Histórico</div>
          <select value={dias} onChange={(e) => setDias(parseInt(e.target.value, 10))}>
            <option value={7}>Últimos 7 dias</option>
            <option value={15}>Últimos 15 dias</option>
            <option value={30}>Últimos 30 dias</option>
          </select>
        </div>

        {loading ? (
          <div className="jobs-vazio">Carregando...</div>
        ) : (
          <table className="jobs-tabela">
            <thead>
              <tr>
                <th>Data</th>
                <th>Job</th>
                <th>Executado</th>
                <th>Resumo</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(jobs).map(([chave, job]) =>
                (job.historico || []).map((h) => (
                  <tr key={`${chave}-${h.data}`}>
                    <td>{fmtDataBR(h.data)}</td>
                    <td className="jobs-col-job">{job.label}</td>
                    <td>
                      {h.executado ? (
                        <span className="jobs-badge jobs-badge-ok">✓</span>
                      ) : (
                        <span className="jobs-badge jobs-badge-off">—</span>
                      )}
                    </td>
                    <td className="jobs-col-resumo">{h.resumo || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}