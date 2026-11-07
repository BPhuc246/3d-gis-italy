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
  const [pathname] = path.split('?');

  const mapMatch = pathname.match(/^\/map(?:\/([a-z0-9-]+))?$/);
  const detail = pathname.match(/^\/d\/([a-z0-9-]+)$/);
  const route = pathname.match(/^\/routes\/([0-9a-f-]{36})$/i);

  let page;
  if (pathname === '/' || mapMatch) {
    page = <MapPage slug={mapMatch?.[1] ?? null} />;
  } else if (detail) {
    page = <DestinationDetailPage key={detail[1]} slug={detail[1]} />;
  } else if (route) {
    page = <RouteDetailPage key={route[1]} id={route[1]} />;
  } else if (pathname === '/list') {
    page = <DestinationList />;
  } else if (pathname === '/routes') {
    page = <RouteList />;
  } else if (pathname === '/favorites') {
    page = <Favorites />;
  } else if (pathname === '/auth') {
    page = <AuthPage />;
  } else {
    page = <p className="p-6 text-slate-600">Không tìm thấy trang.</p>;
  }

  const isMap = pathname === '/' || !!mapMatch || pathname === '/map/route';

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
