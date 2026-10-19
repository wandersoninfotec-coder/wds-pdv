// src/components/RelogioHeader.jsx
import React from 'react';
import { useRelogio } from '../hooks/useRelogio';
import './RelogioHeader.css';

export default function RelogioHeader({ cor }) {
  const { dataFormatada, horaFormatada, diaSemana } = useRelogio();

  return (
    <div className="relogio-wrap">
      <div className="relogio-data">
        {diaSemana}, {dataFormatada}
      </div>
      <div
        className="relogio-hora tema"
        style={{ '--relogio-cor': cor || '#2c3e50' }}
      >
        {horaFormatada}
      </div>
    </div>
  );
}