import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/index.css';
import { App } from './app/App';

// GitHub Pages serves the app under /<repo>/. Normalise a missing trailing slash so
// relative asset URLs and the router basename always agree.
const base = import.meta.env.BASE_URL;
if (base !== '/' && location.pathname === base.replace(/\/$/, '')) {
  history.replaceState(null, '', base + location.search + location.hash);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
