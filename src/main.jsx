import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './animations.css';
import './store/extensions.js';
import './store/statusEngine.js';
import './store/characterExtensions.js';
import App from './App.jsx';
import SpellCaster from './components/SpellCaster.jsx';
import DiceAnimation from './components/DiceAnimation.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
    <SpellCaster />
    <DiceAnimation />
  </React.StrictMode>
);
