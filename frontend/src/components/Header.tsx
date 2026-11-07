import { useEffect, useState } from 'react';
import { useAuth } from '../lib/auth';

export default function Header() {
  const { user, logout } = useAuth();
  const [hash, setHash] = useState(() => window.location.hash.replace(/^#/, '') || '/');

  useEffect(() => {
    const onHashChange = () => setHash(window.location.hash.replace(/^#/, '') || '/');
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const [pathname, search] = hash.split('?');
  const isRouteQuery = new URLSearchParams(search ?? '').get('route') === 'true';

  const isRoutes = isRouteQuery || pathname.startsWith('/routes') || pathname === '/map/route';
  const isDestinations = !isRoutes && (pathname === '/list' || pathname.startsWith('/d/'));
  const isMap = !isRoutes && !isDestinations && (pathname === '/' || pathname.startsWith('/map'));

  return (
    <nav className="site-header" aria-label="Điều hướng chính">
      <a href="#/" className="brand">
        <span className="brand-mark" aria-hidden="true">R</span>
        <span>Di sản <em>Roma</em><small>KHÁM PHÁ DI SẢN · GIS 3D</small></span>
      </a>
      <div className="header-links">
        <a href="#/map" className={isMap ? 'active' : ''}>Khám phá bản đồ</a>
        <a href="#/list" className={isDestinations ? 'active' : ''}>Địa điểm</a>
        <a href="#/routes" className={isRoutes ? 'active' : ''}>Hành trình</a>
      </div>
      <details className="account-menu">
        <summary>
          <span className="account-avatar">{user ? user.fullName.slice(0, 1).toUpperCase() : '♙'}</span>
          <span>{user ? user.fullName : 'Tài khoản'}</span>
          <span>⌄</span>
        </summary>
        <div className="account-dropdown">
          {user ? (
            <>
              <strong>{user.fullName}</strong>
              <a href="#/favorites">♡ Địa điểm yêu thích</a>
              <button onClick={() => { logout(); window.location.hash = '#/auth'; }}>Chuyển tài khoản</button>
              <button onClick={logout}>Đăng xuất</button>
            </>
          ) : (
            <>
              <a href="#/auth">Đăng nhập / Đăng ký</a>
              <a href="#/favorites">Địa điểm yêu thích</a>
            </>
          )}
        </div>
      </details>
    </nav>
  );
}
