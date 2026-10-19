// src/pages/PdvPage.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PdvBalcaoPage from './PdvBalcaoPage';

export default function PdvPage() {
  const { user } = useAuth();

  // Padrão: modo mesas (compatibilidade)
  if (user?.usaControleMesas !== false) {
    return <Navigate to="/mesas" replace />;
  }

  return <PdvBalcaoPage />;
}