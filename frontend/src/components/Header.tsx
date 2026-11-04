import { useAuth } from '../lib/auth';

export default function Header() {
  const { user, logout } = useAuth();

  return (
    <nav className="flex items-center justify-between bg-white px-6 py-3 shadow-sm">
      <a href="#/" className="font-bold text-slate-800">Di sản Roma 3D</a>
      <div className="flex items-center gap-5 text-sm text-slate-600">
        <a href="#/" className="hover:text-amber-700">Bản đồ</a>
        <a href="#/list" className="hover:text-amber-700">Danh sách</a>
        <a href="#/routes" className="hover:text-amber-700">Tuyến</a>
        {user ? (
          <>
            <a href="#/favorites" className="hover:text-amber-700">Yêu thích</a>
            <span className="text-slate-400">{user.fullName}</span>
            <button onClick={logout} className="hover:text-red-600">Đăng xuất</button>
          </>
        ) : (
          <a href="#/auth" className="hover:text-amber-700">Đăng nhập</a>
        )}
      </div>
    </nav>
  );
}
