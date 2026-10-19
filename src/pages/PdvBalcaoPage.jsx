// src/pages/PdvBalcaoPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { mesaService } from '../services/mesaService';
import PdvFullScreen from '../components/PdvFullScreen';

export default function PdvBalcaoPage() {
  const navigate = useNavigate();
  const [venda, setVenda] = useState(null);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(true);

  const abrirNovaVenda = useCallback(async () => {
    setCarregando(true);
    setErro('');
    try {
      const r = await mesaService.abrirVendaBalcao(0);
      if (r.sucesso) {
        setVenda({ venda: r.venda, mesa_comanda: 0, descricao: 'Venda Balcão' });
      } else {
        setErro(r.erro || 'Erro ao abrir venda');
      }
    } catch (e) {
      setErro(e.response?.data?.erro || e.message);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => { abrirNovaVenda(); }, [abrirNovaVenda]);

  if (carregando) {
    return (
      <div style={{ padding: 60, textAlign: 'center', color: '#7f8c8d', fontSize: 20, fontWeight: 700 }}>
        Abrindo PDV...
      </div>
    );
  }

  if (erro) {
    return (
      <div style={{ padding: 60, textAlign: 'center' }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>⚠️</div>
        <div style={{ color: '#c0392b', fontWeight: 800, fontSize: 20, marginBottom: 24 }}>{erro}</div>
        <button
          onClick={abrirNovaVenda}
          style={{ padding: '14px 28px', background: '#27ae60', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 800, cursor: 'pointer', marginRight: 12 }}
        >
          Tentar novamente
        </button>
        <button
          onClick={() => navigate('/dashboard')}
          style={{ padding: '14px 28px', background: '#ecf0f1', border: 'none', borderRadius: 10, fontWeight: 800, cursor: 'pointer' }}
        >
          Voltar
        </button>
      </div>
    );
  }

  return (
    <PdvFullScreen
      venda={venda}
      onFechar={() => navigate('/dashboard')}
      onRenovarVenda={abrirNovaVenda}
    />
  );
}