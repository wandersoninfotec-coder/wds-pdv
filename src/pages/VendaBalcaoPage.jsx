// src/pages/PdvBalcaoPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { mesaService } from '../services/mesaService';
import PdvFullScreen from '../components/PdvFullScreen';

export default function PdvBalcaoPage() {
  const navigate = useNavigate();
  const [venda, setVenda] = useState(null);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    (async () => {
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
    })();
  }, []);

  if (carregando) return <div style={{ padding: 60, textAlign: 'center', color: '#7f8c8d' }}>Abrindo PDV...</div>;
  if (erro) return (
    <div style={{ padding: 60, textAlign: 'center' }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>⚠️</div>
      <div style={{ color: '#c0392b', fontWeight: 600, marginBottom: 20 }}>{erro}</div>
      <button onClick={() => navigate('/dashboard')} style={{ padding: '12px 24px', background: '#ecf0f1', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}>Voltar</button>
    </div>
  );

  return <PdvFullScreen venda={venda} onFechar={() => navigate('/dashboard')} />;
}