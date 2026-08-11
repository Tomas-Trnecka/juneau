import { useState } from 'react';
import { JuneauProvider } from '../components/JuneauProvider/JuneauProvider';
import { juneauCs } from '../i18n/locales/cs';
import { DashboardView } from './views/DashboardView';
import { SidebarView } from './views/SidebarView';
import './DemoApp.css';

type View = 'dashboard' | 'sidebar';

export function DemoApp() {
  const [view, setView] = useState<View>('dashboard');
  const [toasts, setToasts] = useState<string[]>([]);

  const addToast = (msg: string) => {
    setToasts(prev => [...prev, msg]);
    setTimeout(() => setToasts(prev => prev.slice(1)), 4000);
  };

  return (
    <JuneauProvider labels={juneauCs}>
      <div className="demo-layout">
        <header className="demo-header">
          <span className="demo-title">Company Analytics</span>
          <nav className="demo-nav">
            <button
              className={`demo-nav-btn ${view === 'dashboard' ? 'demo-nav-btn--active' : ''}`}
              onClick={() => setView('dashboard')}
            >
              AI Dashboard
            </button>
            <button
              className={`demo-nav-btn ${view === 'sidebar' ? 'demo-nav-btn--active' : ''}`}
              onClick={() => setView('sidebar')}
            >
              Sidebar Assistant
            </button>
          </nav>
        </header>

        <main className="demo-content">
          {view === 'dashboard' && <DashboardView />}
          {view === 'sidebar'   && <SidebarView onToast={addToast} />}
        </main>

        <div className="demo-toasts">
          {toasts.map((t, i) => (
            <div key={i} className="demo-toast">{t}</div>
          ))}
        </div>
      </div>
    </JuneauProvider>
  );
}
