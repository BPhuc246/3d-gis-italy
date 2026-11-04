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
      window.location.hash = '#/';
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
            onClick={() => setMode(m)}
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
            required
            className={INPUT}
          />
        )}
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
          className={INPUT}
        />
        <input
          type="password"
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
    </div>
  );
}
