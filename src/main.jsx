// ===================================================
// main.jsx — Ponto de entrada da aplicação
// Monta o componente raiz <App /> no DOM
// ===================================================

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app/App.jsx';

import './shared/styles/global.css';

import './shared/styles/components.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
