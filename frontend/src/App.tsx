import { useEffect, useState } from 'react';
import { AuthProvider } from './lib/auth';
import Header from './components/Header';
import MapPage from './pages/MapPage';
import DestinationList from './pages/DestinationList';
import DestinationDetailPage from './pages/DestinationDetail';
import RouteList from './pages/RouteList';
import RouteDetailPage from './pages/RouteDetail';
import Favorites from './pages/Favorites';
import AuthPage from './pages/AuthPage';

// Router đơn giản dựa trên hash
function useHashPath(): string {
  const [path, setPath] = useState(window.location.hash.replace(/^#/, '') || '/');
  useEffect(() => {
    const onChange = () => setPath(window.location.hash.replace(/^#/, '') || '/');
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return path;
}

function Router() {
  const path = useHashPath();

  const mapMatch = path.match(/^\/map(?:\/([a-z0-9-]+))?$/);
  const detail = path.match(/^\/d\/([a-z0-9-]+)$/);
  const route = path.match(/^\/routes\/([0-9a-f-]{36})$/i);

  let page;
  if (path === '/' || mapMatch) page = <MapPage slug={mapMatch?.[1] ?? null} />;
  else if (detail) page = <DestinationDetailPage key={detail[1]} slug={detail[1]} />;
  else if (route) page = <RouteDetailPage key={route[1]} id={route[1]} />;
  else if (path === '/list') page = <DestinationList />;
  else if (path === '/routes') page = <RouteList />;
  else if (path === '/favorites') page = <Favorites />;
  else if (path === '/auth') page = <AuthPage />;
  else page = <p className="p-6 text-slate-600">Không tìm thấy trang.</p>;

  const isMap = path === '/' || !!mapMatch;

  return (
    <>
      <Header />
      <main className={isMap ? 'bg-slate-900' : 'min-h-screen bg-slate-100'}>{page}</main>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router />
    </AuthProvider>
  );
}
