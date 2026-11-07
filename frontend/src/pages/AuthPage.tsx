import { FormEvent, useState } from 'react';
import { useAuth } from '../lib/auth';

const INPUT =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-600 focus:outline-none';

export default function AuthPage() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(fullName, email, password);
      }
      let returnTo = '#/';
      try {
        const saved = sessionStorage.getItem('roma-return');
        if (saved?.startsWith('#/map/') || saved?.startsWith('#/d/')) returnTo = saved;
        sessionStorage.removeItem('roma-return');
      } catch { /* Authentication works without session storage. */ }
      window.location.hash = returnTo;
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto mt-12 max-w-md rounded-2xl bg-white p-8 shadow-lg">
      <div className="mb-6 flex gap-2 rounded-lg bg-slate-100 p-1">
        {(['login', 'register'] as const).map((m) => (
          <button
            key={m}
            disabled={busy}
            onClick={() => { setMode(m); setError(null); }}
            className={`flex-1 rounded-md py-2 text-sm font-medium transition ${
              mode === m ? 'bg-white text-slate-800 shadow' : 'text-slate-500'
            }`}
          >
            {m === 'login' ? 'Đăng nhập' : 'Đăng ký'}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="space-y-4">
        {mode === 'register' && (
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Họ và tên"
            aria-label="Họ và tên"
            autoComplete="name"
            required
            className={INPUT}
          />
        )}
        <input
          type="email"
          aria-label="Email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
          className={INPUT}
        />
        <input
          type="password"
          aria-label="Mật khẩu"
          autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={mode === 'register' ? 'Mật khẩu (tối thiểu 8 ký tự)' : 'Mật khẩu'}
          required
          minLength={mode === 'register' ? 8 : undefined}
          className={INPUT}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-lg bg-amber-600 py-2.5 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
        >
          {mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}
        </button>
      </form>

      {mode === 'login' && (
        <div className="mt-6 border-t border-slate-200 pt-4 text-xs text-slate-600">
          <p className="font-semibold text-slate-700 mb-2">Tài khoản trải nghiệm (Mật khẩu: <code className="font-mono text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded font-bold">demo</code>):</p>
          <div className="flex flex-col gap-1.5">
            {[
              { email: 'demo.an@example.test', name: 'Minh An' },
              { email: 'demo.ha@example.test', name: 'Thu Hà' },
              { email: 'demo.bao@example.test', name: 'Gia Bảo' },
            ].map(acc => (
              <button
                key={acc.email}
                type="button"
                onClick={() => { setEmail(acc.email); setPassword('demo'); }}
                className="flex items-center justify-between px-2.5 py-1.5 rounded bg-slate-50 hover:bg-amber-50 hover:text-amber-800 transition text-left cursor-pointer"
              >
                <span>👤 <strong>{acc.name}</strong> ({acc.email})</span>
                <span className="text-amber-600 font-medium">Điền nhanh →</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
