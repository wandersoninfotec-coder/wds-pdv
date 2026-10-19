// src/components/ClienteModal.jsx
import React, { useState, useEffect, useRef } from 'react';
import { clienteService } from '../services/clienteService';
import './ClienteModal.css';

export default function ClienteModal({ onSelecionar, onClose }) {
  const [aba, setAba] = useState('buscar');
  const [busca, setBusca] = useState('');
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  // Formulário
  const [form, setForm] = useState({
    razao: '',
    fantasia: '',
    tipo: 1,
    cpf: '',
    telefone: '',
    endereco: '',
    numero: '',
    bairro: '',
    cidade: '',
    cidadeCodigo: null,
    uf: '',
    cep: '',
    email: '',
  });

  // ✅ Busca de município (autocomplete)
  const [buscaCidade, setBuscaCidade] = useState('');
  const [municipios, setMunicipios] = useState([]);
  const [mostrandoMunicipios, setMostrandoMunicipios] = useState(false);
  const [buscandoCidade, setBuscandoCidade] = useState(false);

  // ✅ CEP
  const [buscandoCep, setBuscandoCep] = useState(false);

  const buscaInputRef = useRef(null);
  const debounceRef = useRef(null);
  const debounceCidadeRef = useRef(null);

  // Carrega lista inicial
  useEffect(() => {
    carregarClientes('');
  }, []);

  // Debounce da busca de clientes
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      carregarClientes(busca);
    }, 350);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [busca]);

  // ✅ Debounce da busca de municípios
  useEffect(() => {
    if (debounceCidadeRef.current) clearTimeout(debounceCidadeRef.current);

    if (buscaCidade.length < 3) {
      setMunicipios([]);
      setMostrandoMunicipios(false);
      return;
    }

    setBuscandoCidade(true);
    debounceCidadeRef.current = setTimeout(async () => {
      const lista = await clienteService.buscarMunicipios(buscaCidade, form.uf);
      setMunicipios(lista);
      setMostrandoMunicipios(true);
      setBuscandoCidade(false);
    }, 400);

    return () => {
      if (debounceCidadeRef.current) clearTimeout(debounceCidadeRef.current);
    };
  }, [buscaCidade, form.uf]);

  // ESC fecha
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape' && !mostrandoMunicipios) onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose, mostrandoMunicipios]);

  const carregarClientes = async (texto) => {
    try {
      setLoading(true);
      setErro('');
      const data = await clienteService.listar(texto);
      setClientes(data);
    } catch (error) {
      setErro('Falha ao carregar clientes');
      setClientes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelecionar = (cliente) => {
    onSelecionar(cliente);
  };

  const handleChangeForm = (campo, valor) => {
    setForm((prev) => ({ ...prev, [campo]: valor }));
    setErro('');
  };

  // ✅ Formatação CPF/CNPJ
  const formatarCPF = (valor) => {
    const numeros = valor.replace(/\D/g, '');
    if (form.tipo === 2) {
      return numeros
        .slice(0, 14)
        .replace(/^(\d{2})(\d)/, '$1.$2')
        .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/\.(\d{3})(\d)/, '.$1/$2')
        .replace(/(\d{4})(\d)/, '$1-$2');
    }
    return numeros
      .slice(0, 11)
      .replace(/^(\d{3})(\d)/, '$1.$2')
      .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1-$2');
  };

  // ✅ Formatação CEP
  const formatarCEP = (valor) => {
    const numeros = valor.replace(/\D/g, '');
    return numeros.slice(0, 8).replace(/^(\d{5})(\d)/, '$1-$2');
  };

  // ✅ Busca CEP via ViaCEP
  const handleBuscarCep = async () => {
    const numeros = form.cep.replace(/\D/g, '');
    if (numeros.length !== 8) {
      setErro('CEP deve ter 8 dígitos');
      return;
    }

    setBuscandoCep(true);
    setErro('');

    try {
      const dados = await clienteService.buscarCep(numeros);

      if (!dados) {
        setErro('CEP não encontrado');
        return;
      }

      setForm((prev) => ({
        ...prev,
        endereco: dados.logradouro || prev.endereco,
        bairro: dados.bairro || prev.bairro,
        uf: dados.uf || prev.uf,
        cidade: dados.localidade || prev.cidade,
        cidadeCodigo: dados.ibge ? parseInt(dados.ibge) : prev.cidadeCodigo,
      }));
      setBuscaCidade(dados.localidade || '');

      // Foca no campo "número" automaticamente
      setTimeout(() => {
        const numInput = document.querySelector('input[data-campo="numero"]');
        if (numInput) numInput.focus();
      }, 200);
    } catch (error) {
      setErro('Erro ao buscar CEP');
    } finally {
      setBuscandoCep(false);
    }
  };

  // ✅ Seleciona município da lista
  const handleSelecionarMunicipio = (m) => {
    setForm((prev) => ({
      ...prev,
      cidade: m.nome,
      cidadeCodigo: m.codigo,
      uf: m.uf || prev.uf,
    }));
    setBuscaCidade(m.nome);
    setMostrandoMunicipios(false);
  };

  const handleSalvarNovo = async () => {
    setErro('');

    if (!form.razao.trim()) {
      setErro('Nome/Razão social é obrigatório');
      return;
    }
    if (!form.cpf.trim()) {
      setErro('CPF/CNPJ é obrigatório');
      return;
    }
    if (!form.cidadeCodigo) {
      setErro('Selecione a cidade (busque e clique na lista)');
      return;
    }

    setSalvando(true);
    try {
      const resultado = await clienteService.cadastrar({
        razao: form.razao.trim(),
        fantasia: form.fantasia.trim(),
        tipo: form.tipo,
        cpf: form.cpf.replace(/\D/g, ''),
        telefone: form.telefone.trim(),
        endereco: form.endereco.trim(),           // ✅ separado
        endereco_nro: form.numero.trim(),         // ✅ separado
        bairro: form.bairro.trim(),
        cidade: form.cidadeCodigo,
        uf: form.uf.trim().toUpperCase(),
        cep: form.cep.replace(/\D/g, ''),
        email: form.email.trim(),
        });

      if (resultado.sucesso && resultado.cliente) {
        onSelecionar(resultado.cliente);
      } else {
        setErro(resultado.erro || 'Erro ao cadastrar cliente');
      }
    } catch (error) {
      if (error.clienteExistente) {
        setErro(
          `Já existe cliente com este CPF/CNPJ: ${error.clienteExistente.razao} (código ${error.clienteExistente.codigo})`
        );
      } else {
        setErro(error.message || 'Erro ao cadastrar');
      }
    } finally {
      setSalvando(false);
    }
  };

  const handleNovoCliente = () => {
    setAba('novo');
    setErro('');
    setForm({
      razao: '',
      fantasia: '',
      tipo: 1,
      cpf: '',
      telefone: '',
      endereco: '',
      numero: '',
      bairro: '',
      cidade: '',
      cidadeCodigo: null,
      uf: '',
      cep: '',
      email: '',
    });
    setBuscaCidade('');
    setMunicipios([]);
  };

  const handleVoltarBusca = () => {
    setAba('buscar');
    setErro('');
    setTimeout(() => {
      if (buscaInputRef.current) buscaInputRef.current.focus();
    }, 150);
  };

  return (
    <div className="cli-overlay" onClick={onClose}>
      <div className="cli-content" onClick={(e) => e.stopPropagation()}>
        <div className="cli-header">
          <div>
            <h2 className="cli-title">Selecionar Cliente</h2>
            <div className="cli-subtitle">
              Padrão: Consumidor Final (cliente 1)
            </div>
          </div>
          <button className="cli-close" onClick={onClose}>✕</button>
        </div>

        <div className="cli-tabs">
          <button
            className={`cli-tab ${aba === 'buscar' ? 'ativo' : ''}`}
            onClick={handleVoltarBusca}
          >
            🔍 Buscar Existente
          </button>
          <button
            className={`cli-tab ${aba === 'novo' ? 'ativo' : ''}`}
            onClick={handleNovoCliente}
          >
            ➕ Novo Cliente
          </button>
        </div>

        {/* ABA BUSCAR */}
        {aba === 'buscar' && (
          <>
            <div className="cli-body">
              <div className="cli-busca">
                <span className="cli-busca-icon">🔍</span>
                <input
                  ref={buscaInputRef}
                  type="text"
                  className="cli-busca-input"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Nome, razão social ou CPF/CNPJ..."
                  autoFocus
                  autoComplete="off"
                />
              </div>

              {erro && <div className="cli-form-erro">{erro}</div>}

              {loading ? (
                <div className="cli-loading">Carregando clientes...</div>
              ) : clientes.length === 0 ? (
                <div className="cli-vazio">
                  <div className="cli-vazio-icon">🔍</div>
                  <div>Nenhum cliente encontrado</div>
                  {busca && (
                    <div style={{ marginTop: 12, fontSize: 13 }}>
                      Não achou?{' '}
                      <button
                        onClick={handleNovoCliente}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#3498db',
                          fontWeight: 700,
                          cursor: 'pointer',
                          textDecoration: 'underline',
                          fontFamily: 'inherit',
                          fontSize: 13,
                        }}
                      >
                        Cadastrar novo
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="cli-lista">
                  {clientes.map((c) => (
                    <div
                      key={c.codigo}
                      className="cli-cliente"
                      onClick={() => handleSelecionar(c)}
                    >
                      <div className="cli-cliente-avatar">
                        {c.tipo === 2 ? '🏢' : '👤'}
                      </div>
                      <div className="cli-cliente-info">
                        <div className="cli-cliente-nome">{c.razao}</div>
                        <div className="cli-cliente-detalhes">
                          <span className="cli-cliente-tag">{c.tipo_label}</span>
                          {c.cpf && <span>{c.cpf}</span>}
                          {c.telefone && <span>📞 {c.telefone}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="cli-footer">
              <button className="cli-btn cli-btn-cancelar" onClick={onClose}>
                Cancelar
              </button>
              <button
                className="cli-btn cli-btn-salvar"
                onClick={handleNovoCliente}
              >
                ➕ Cadastrar Novo
              </button>
            </div>
          </>
        )}

        {/* ABA NOVO */}
        {aba === 'novo' && (
          <>
            <div className="cli-body">
              {erro && <div className="cli-form-erro">{erro}</div>}

              <div className="cli-form">
                <div className="cli-form-campo full">
                  <label className="cli-form-label">Tipo</label>
                  <select
                    className="cli-form-select"
                    value={form.tipo}
                    onChange={(e) =>
                      handleChangeForm('tipo', parseInt(e.target.value))
                    }
                  >
                    <option value={1}>Pessoa Física (CPF)</option>
                    <option value={2}>Pessoa Jurídica (CNPJ)</option>
                  </select>
                </div>

                <div className="cli-form-campo full">
                  <label className="cli-form-label">
                    {form.tipo === 2 ? 'Razão Social *' : 'Nome Completo *'}
                  </label>
                  <input
                    type="text"
                    className="cli-form-input"
                    value={form.razao}
                    onChange={(e) => handleChangeForm('razao', e.target.value)}
                    placeholder={
                      form.tipo === 2
                        ? 'Ex: EMPRESA XYZ LTDA'
                        : 'Ex: João da Silva'
                    }
                    autoFocus
                  />
                </div>

                <div className="cli-form-campo full">
                  <label className="cli-form-label">
                    {form.tipo === 2 ? 'CNPJ *' : 'CPF *'}
                  </label>
                  <input
                    type="text"
                    className="cli-form-input"
                    value={form.cpf}
                    onChange={(e) =>
                      handleChangeForm('cpf', formatarCPF(e.target.value))
                    }
                    placeholder={
                      form.tipo === 2 ? '00.000.000/0000-00' : '000.000.000-00'
                    }
                    maxLength={form.tipo === 2 ? 18 : 14}
                  />
                </div>

                <div className="cli-form-campo full">
                  <label className="cli-form-label">
                    {form.tipo === 2 ? 'Nome Fantasia' : 'Apelido'}
                  </label>
                  <input
                    type="text"
                    className="cli-form-input"
                    value={form.fantasia}
                    onChange={(e) => handleChangeForm('fantasia', e.target.value)}
                    placeholder="Opcional"
                  />
                </div>

                <div className="cli-form-campo">
                  <label className="cli-form-label">Telefone</label>
                  <input
                    type="text"
                    className="cli-form-input"
                    value={form.telefone}
                    onChange={(e) => handleChangeForm('telefone', e.target.value)}
                    placeholder="(00) 00000-0000"
                  />
                </div>

                <div className="cli-form-campo">
                  <label className="cli-form-label">
                    CEP {buscandoCep && <span style={{ color: '#3498db' }}>(buscando...)</span>}
                  </label>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <input
                      type="text"
                      className="cli-form-input"
                      value={form.cep}
                      onChange={(e) =>
                        handleChangeForm('cep', formatarCEP(e.target.value))
                      }
                      placeholder="00000-000"
                      maxLength={9}
                      onBlur={handleBuscarCep}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleBuscarCep();
                        }
                      }}
                      style={{ flex: 1 }}
                    />
                    <button
                      type="button"
                      onClick={handleBuscarCep}
                      disabled={buscandoCep}
                      style={{
                        padding: '0 14px',
                        background: '#3498db',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 10,
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                      }}
                    >
                      🔍
                    </button>
                  </div>
                </div>

                <div className="cli-form-campo" style={{ gridColumn: '1 / 3' }}>
                  <label className="cli-form-label">Endereço</label>
                  <input
                    type="text"
                    className="cli-form-input"
                    value={form.endereco}
                    onChange={(e) => handleChangeForm('endereco', e.target.value)}
                    placeholder="Rua / Avenida"
                  />
                </div>

                <div className="cli-form-campo">
                  <label className="cli-form-label">Número</label>
                  <input
                    type="text"
                    className="cli-form-input"
                    data-campo="numero"
                    value={form.numero}
                    onChange={(e) => handleChangeForm('numero', e.target.value)}
                    placeholder="123"
                  />
                </div>

                <div className="cli-form-campo">
                  <label className="cli-form-label">Bairro</label>
                  <input
                    type="text"
                    className="cli-form-input"
                    value={form.bairro}
                    onChange={(e) => handleChangeForm('bairro', e.target.value)}
                  />
                </div>

                {/* ✅ Cidade com autocomplete */}
                <div
                  className="cli-form-campo"
                  style={{ position: 'relative' }}
                >
                  <label className="cli-form-label">
                    Cidade * {buscandoCidade && <span style={{ color: '#3498db' }}>(buscando...)</span>}
                  </label>
                  <input
                    type="text"
                    className="cli-form-input"
                    value={buscaCidade}
                    onChange={(e) => {
                      setBuscaCidade(e.target.value);
                      if (form.cidadeCodigo) {
                        setForm((prev) => ({ ...prev, cidadeCodigo: null }));
                      }
                    }}
                    onFocus={() => {
                      if (municipios.length > 0) setMostrandoMunicipios(true);
                    }}
                    placeholder="Digite 3+ letras..."
                    autoComplete="off"
                  />
                  {form.cidadeCodigo && (
                    <div className="cli-cidade-selecionada">
                      ✓ Código IBGE: {form.cidadeCodigo}
                    </div>
                  )}

                  {mostrandoMunicipios && municipios.length > 0 && (
                    <div className="cli-municipios-lista">
                      {municipios.map((m) => (
                        <div
                          key={m.codigo}
                          className="cli-municipio-item"
                          onClick={() => handleSelecionarMunicipio(m)}
                        >
                          <div className="cli-municipio-nome">{m.nome}</div>
                          <div className="cli-municipio-info">
                            {m.uf} • IBGE {m.codigo}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="cli-form-campo">
                  <label className="cli-form-label">UF</label>
                  <input
                    type="text"
                    className="cli-form-input"
                    value={form.uf}
                    onChange={(e) =>
                      handleChangeForm('uf', e.target.value.toUpperCase())
                    }
                    maxLength={2}
                    placeholder="MT"
                  />
                </div>

                <div className="cli-form-campo full">
                  <label className="cli-form-label">E-mail</label>
                  <input
                    type="email"
                    className="cli-form-input"
                    value={form.email}
                    onChange={(e) => handleChangeForm('email', e.target.value)}
                    placeholder="email@exemplo.com"
                  />
                </div>
              </div>
            </div>

            <div className="cli-footer">
              <button
                className="cli-btn cli-btn-cancelar"
                onClick={handleVoltarBusca}
                disabled={salvando}
              >
                ← Voltar
              </button>
              <button
                className="cli-btn cli-btn-salvar"
                onClick={handleSalvarNovo}
                disabled={salvando}
              >
                {salvando ? 'Salvando...' : '✓ Cadastrar e Selecionar'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}