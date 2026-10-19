// src/pages/ConfigPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTema } from '../hooks/useTema';
import { configService } from '../services/configService';
import { LISTA_TEMAS, RAMO_PADRAO } from '../config/themes';
import './ConfigPage.css';
import { logoUrl } from '../assets';


export default function ConfigPage({ onConfigurado }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const tema = useTema();

  const [ip, setIp] = useState('');
  const [porta, setPorta] = useState('80');
  const [caminhoApi, setCaminhoApi] = useState('app_mesas_api');
  const [empresa, setEmpresa] = useState('1');
  const [empresaNome, setEmpresaNome] = useState('');
  const [ramo, setRamo] = useState(RAMO_PADRAO);

  const [testando, setTestando] = useState(false);
  const [testado, setTestado] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  const modoInicial = !user;

  useEffect(() => {
    carregarConfig();
  }, []);

  const carregarConfig = async () => {
    const config = await configService.carregar();
    if (config) {
      setIp(config.ip || '');
      setPorta(config.porta || '80');
      setCaminhoApi(config.caminhoApi || 'app_mesas_api');
      setEmpresa(String(config.empresa || '1'));
      setEmpresaNome(config.empresaNome || '');
      setRamo(config.ramo || RAMO_PADRAO);
      if (config.ip) setTestado(true);
    }
  };

  const handleTestar = async () => {
    setErro('');
    setSucesso('');
    setTestado(false);

    if (!ip) {
      setErro('Preencha o IP do servidor');
      return;
    }

    setTestando(true);
    try {
      const resultado = await configService.testarConexao(ip, porta, caminhoApi);

      if (!resultado.sucesso) {
        setErro(resultado.erro || 'Falha ao conectar');
        return;
      }

      // Busca nome da empresa
      let nomeEmpresa = '';
      if (empresa) {
        const dadosEmpresa = await configService.buscarDadosEmpresa(
          ip,
          porta,
          caminhoApi,
          empresa
        );

        if (dadosEmpresa.sucesso && dadosEmpresa.nome) {
          nomeEmpresa = dadosEmpresa.nome;
          setEmpresaNome(nomeEmpresa);
        }
      }

      setTestado(true);
      setSucesso(
        nomeEmpresa
          ? `Conectado! Empresa: ${nomeEmpresa}`
          : `Conectado em ${resultado.url}`
      );
    } catch (e) {
      setErro('Erro: ' + e.message);
    } finally {
      setTestando(false);
    }
  };

  const handleSalvar = async () => {
    setErro('');
    setSucesso('');

    if (!ip || !empresa) {
      setErro('Preencha IP e empresa');
      return;
    }

    if (!testado) {
      setErro('Teste a conexão antes de salvar');
      return;
    }

    setSalvando(true);

    const portaStr = porta && porta !== '80' ? `:${porta}` : '';
    const baseURL = `http://${ip}${portaStr}/${caminhoApi}`;

    const config = {
      ip,
      porta,
      caminhoApi,
      empresa: parseInt(empresa),
      empresaNome,
      baseURL,
      ramo,
      recursos: {
        finalizarVenda: true,
        visualizarRelatorios: true,
        visualizarHistorico: true,
      },
    };

    const ok = await configService.salvar(config);
    setSalvando(false);

    if (ok) {
      setSucesso('Configuração salva! Recarregando...');
      setTimeout(() => {
        if (onConfigurado) {
          onConfigurado();
        } else {
          window.location.reload();
        }
      }, 800);
    } else {
      setErro('Não foi possível salvar');
    }
  };

  return (
    <div className="cfg-container">
      <header className="cfg-header">
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
            <h1 className="dash-header-title">WDS Food PDV</h1>
            <div className="dash-header-subtitle">
              {empresaNome ? `${empresaNome} • ` : ''}
              {tema.nome}
            </div>
          </div>
        </div>
      </header>

      <div className="cfg-content">
        <div className="cfg-card">
          <div className="cfg-section-title">🌐 Servidor</div>

          <label className="cfg-label">IP ou domínio</label>
          <input
            type="text"
            className="cfg-input"
            value={ip}
            onChange={(e) => {
              setIp(e.target.value);
              setTestado(false);
            }}
            placeholder="Ex: 192.168.100.67"
            disabled={testando || salvando}
          />

          <label className="cfg-label">Porta (padrão: 80)</label>
          <input
            type="text"
            className="cfg-input"
            value={porta}
            onChange={(e) => {
              setPorta(e.target.value);
              setTestado(false);
            }}
            placeholder="80"
            disabled={testando || salvando}
          />

          <label className="cfg-label">Caminho da API</label>
          <input
            type="text"
            className="cfg-input"
            value={caminhoApi}
            onChange={(e) => {
              setCaminhoApi(e.target.value);
              setTestado(false);
            }}
            placeholder="app_mesas_api"
            disabled={testando || salvando}
          />

          <div className="cfg-section-title" style={{ marginTop: 24 }}>
            🏢 Empresa
          </div>

          <label className="cfg-label">Código da empresa</label>
          <input
            type="text"
            className="cfg-input"
            value={empresa}
            onChange={(e) => {
              setEmpresa(e.target.value);
              setTestado(false);
              setEmpresaNome('');
            }}
            placeholder="1"
            disabled={testando || salvando}
          />

          {empresaNome && (
            <div className="cfg-empresa-detectada">
              <div className="cfg-empresa-label">Empresa detectada:</div>
              <div className="cfg-empresa-nome">{empresaNome}</div>
            </div>
          )}

          <div className="cfg-section-title" style={{ marginTop: 24 }}>
            🎨 Tipo de Estabelecimento
          </div>
          <div className="cfg-help">
            Escolha o ramo para personalizar o PDV
          </div>

          <div className="cfg-temas-grid">
            {LISTA_TEMAS.map((t) => {
              const selecionado = ramo === t.id;
              return (
                <button
                  key={t.id}
                  className={`cfg-tema-card ${selecionado ? 'ativo' : ''}`}
                  style={
                    selecionado
                      ? {
                          borderColor: t.cor,
                          backgroundColor: t.corSuave,
                        }
                      : {}
                  }
                  onClick={() => setRamo(t.id)}
                  type="button"
                >
                  <div className="cfg-tema-icone">{t.icone}</div>
                  <div
                    className="cfg-tema-nome"
                    style={selecionado ? { color: t.cor } : {}}
                  >
                    {t.nome}
                  </div>
                  {selecionado && (
                    <div
                      className="cfg-tema-check"
                      style={{ backgroundColor: t.cor }}
                    >
                      ✓
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <div className="cfg-preview">
            <div className="cfg-preview-label">URL final:</div>
            <div className="cfg-preview-url">
              http://{ip || '...'}
              {porta && porta !== '80' ? `:${porta}` : ''}
              /{caminhoApi || '...'}
            </div>
          </div>

          {erro && <div className="cfg-erro">{erro}</div>}
          {sucesso && <div className="cfg-sucesso">{sucesso}</div>}

          <div className="cfg-actions">
            {!modoInicial && (
              <button
                className="cfg-btn cfg-btn-secundario"
                onClick={() => navigate('/dashboard')}
                disabled={testando || salvando}
              >
                Cancelar
              </button>
            )}
            <button
              className="cfg-btn cfg-btn-terciario"
              onClick={handleTestar}
              disabled={testando || salvando}
            >
              {testando ? 'Testando...' : '🔍 Testar Conexão'}
            </button>
            <button
              className="cfg-btn cfg-btn-primario"
              style={{ backgroundColor: tema.cor }}
              onClick={handleSalvar}
              disabled={!testado || salvando}
            >
              {salvando ? 'Salvando...' : '💾 Salvar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}