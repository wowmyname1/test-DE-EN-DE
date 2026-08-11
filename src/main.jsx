import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './store/extensions.js';
import App from './App.jsx';
import SpellCaster from './components/SpellCaster.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
    <SpellCaster />
  </React.StrictMode>
);
