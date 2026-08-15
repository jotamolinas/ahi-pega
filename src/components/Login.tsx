import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { useNavigate } from 'react-router-dom';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/admin');
    } catch (err: any) {
      setError('Credenciales incorrectas o acceso denegado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 selection:bg-fuchsia-500/30">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-bold tracking-widest text-fuchsia-500 uppercase drop-shadow-[0_0_15px_rgba(217,70,239,0.8)]">
          Acceso Restringido
        </h2>
        <p className="mt-2 text-center text-sm text-slate-400 font-mono">
          Panel de Administración
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-900/50 backdrop-blur-xl py-8 px-4 shadow-[0_0_30px_rgba(217,70,239,0.1)] border border-white/10 sm:rounded-2xl sm:px-10">
          <form className="space-y-6" onSubmit={handleLogin}>
            {error && (
              <div className="bg-rose-500/10 border border-rose-500/50 rounded-lg p-3 text-center">
                <p className="text-sm text-rose-400 font-mono">{error}</p>
              </div>
            )}
            
            <div>
              <label htmlFor="email" className="block text-xs font-mono tracking-widest text-slate-300 uppercase">
                Correo Electrónico
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-white/10 rounded-lg shadow-sm bg-black/50 text-white placeholder-slate-500 focus:outline-none focus:ring-fuchsia-500 focus:border-fuchsia-500 sm:text-sm font-mono transition-colors"
                  placeholder="admin@ejemplo.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-mono tracking-widest text-slate-300 uppercase">
                Contraseña
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-white/10 rounded-lg shadow-sm bg-black/50 text-white placeholder-slate-500 focus:outline-none focus:ring-fuchsia-500 focus:border-fuchsia-500 sm:text-sm font-mono transition-colors"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold font-mono tracking-widest text-black bg-fuchsia-500 hover:bg-fuchsia-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-fuchsia-500 focus:ring-offset-slate-900 transition-colors disabled:opacity-50 uppercase"
              >
                {loading ? 'Verificando...' : 'Entrar al Panel'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
