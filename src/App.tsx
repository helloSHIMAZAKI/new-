import React, { useEffect, useState } from 'react';
import { ObsOverlay } from './components/ObsOverlay';
import { Dashboard } from './components/Dashboard';

export default function App() {
  const [view, setView] = useState<'dashboard' | 'overlay'>('dashboard');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('view') === 'overlay' || window.location.pathname === '/overlay') {
      setView('overlay');
    }
  }, []);

  if (view === 'overlay') {
    return <ObsOverlay isStandalone={true} />;
  }

  return <Dashboard />;
}
