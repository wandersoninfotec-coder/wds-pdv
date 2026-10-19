// src/components/TesteTefButton.jsx
// ⚠️ COMPONENTE TEMPORÁRIO DE TESTE — APAGAR APÓS VALIDAR O TEF
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { tefService } from '../services/tefService';
import TefModal from './TefModal';

export default function TesteTefButton() {
  const { user } = useAuth();
  const [aberto, setAberto] = useState(false);
  const [valor, setValor] = useState('0.01');
  const [forma, setForma] = useState(5);          // 5 = Débito (ERP)
  const [parametros, setParametros] = useState(null);
  const [resultado, setResultado] = useState(null);
  const [carregando, setCarregando] = useState(false);

  const abrirModal = async () => {
    setCarregando(true);
    setResultado(null);
    try {
      // Busca parâmetros TEF do backend
      const params = await tefService.buscarParametros();
      if (!params.sucesso) {
        alert('Erro ao buscar parâmetros TEF: ' + (params.erro || 'desconhecido'));
        return;
      }
      setParametros(params);
      setAberto(true);
    } catch (err) {
      alert('Erro: ' + err.message);
    } finally {
      setCarregando(false);
    }
  };

  const handleSucesso = (dadosTef) => {
    console.log('[TESTE TEF] Sucesso:', dadosTef);
    setResultado({ tipo: 'ok', dados: dadosTef });
    setAberto(false);
  };

  const handleErro = (msg) => {
    console.log('[TESTE TEF] Erro:', msg);
    setResultado({ tipo: 'erro', msg });
    setAberto(false);
  };

  const handleCancelar = () => {
    setAberto(false);
    setResultado({ tipo: 'cancelado', msg: 'Cancelado pelo operador' });
  };

  return (
    <div style={{
      position: 'fixed', bottom: 16, right: 16, zIndex: 5000,
      background: '#fff', padding: 16, borderRadius: 12,
      boxShadow: '0 8px 30px rgba(0,0,0,0.25)', fontSize: 13,
      maxWidth: 320,
    }}>
      <div style={{ fontWeight: 700, marginBottom: 8, color: '#c0392b' }}>
        ⚠️ Teste TEF (temporário)
      </div>

      <label style={{ display: 'block', marginBottom: 6 }}>
        Valor:
        <input
          type="text"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          style={{ width: '100%', padding: 6, marginTop: 4, borderRadius: 6, border: '1px solid #ccc' }}
        />
      </label>

      <label style={{ display: 'block', marginBottom: 8 }}>
        Forma:
        <select
          value={forma}
          onChange={(e) => setForma(Number(e.target.value))}
          style={{ width: '100%', padding: 6, marginTop: 4, borderRadius: 6, border: '1px solid #ccc' }}
        >
          <option value={5}>Débito (5→4)</option>
          <option value={4}>Crédito (4→3)</option>
          <option value={117}>PIX (117→17)</option>
        </select>
      </label>

      <button
        onClick={abrirModal}
        disabled={carregando}
        style={{
          width: '100%', padding: 10, background: '#3498db', color: '#fff',
          border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700,
        }}
      >
        {carregando ? 'Preparando...' : '▶️ Executar TEF'}
      </button>

      {resultado && (
        <div style={{
          marginTop: 10, padding: 8, borderRadius: 6, fontSize: 12,
          background: resultado.tipo === 'ok' ? '#eaf9f1' : '#fdecea',
          color: resultado.tipo === 'ok' ? '#27ae60' : '#c0392b',
          maxHeight: 200, overflow: 'auto',
        }}>
          {resultado.tipo === 'ok' ? (
            <>
              <strong>✅ Sucesso</strong>
              <pre style={{ margin: '6px 0 0', fontSize: 10, whiteSpace: 'pre-wrap' }}>
                {JSON.stringify(resultado.dados, null, 2)}
              </pre>
            </>
          ) : (
            <>
              <strong>❌ {resultado.tipo === 'erro' ? 'Erro' : 'Cancelado'}</strong>
              <div style={{ marginTop: 4 }}>{resultado.msg}</div>
            </>
          )}
        </div>
      )}

      {aberto && parametros && (
        <TefModal
          valor={parseFloat(valor) || 0.01}
          codigoFormaErp={forma}
          operador={user?.nomeFuncionario || user?.nome || 'OPERADOR'}
          numeroVenda={`TESTE_${Date.now()}`}
          parametros={parametros}
          onSucesso={handleSucesso}
          onErro={handleErro}
          onCancelar={handleCancelar}
        />
      )}
    </div>
  );
}