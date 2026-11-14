import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, deleteDoc, doc, query } from 'firebase/firestore';
import { db } from '../firebase';
import { Shield, UserPlus, Trash2, Mail, CheckCircle, AlertCircle } from 'lucide-react';

interface AdminDoc {
  id: string;
  email: string;
  createdAt?: any;
}

export function AdminManager() {
  const [dbAdmins, setDbAdmins] = useState<AdminDoc[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const defaultAdmins = [
    'jotamolinas@gmail.com',
    'everacost@gmail.com',
    'test@ahipega.com.py'
  ];

  useEffect(() => {
    const q = query(collection(db, 'admins'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: AdminDoc[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.email) {
          list.push({ id: docSnap.id, email: data.email, createdAt: data.createdAt });
        }
      });
      setDbAdmins(list);
    }, (err) => {
      console.error("Error fetching admins:", err);
    });

    return () => unsubscribe();
  }, []);

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    const trimmed = newEmail.trim().toLowerCase();

    if (!trimmed || !trimmed.includes('@')) {
      setMessage({ type: 'error', text: 'Por favor ingresa un correo electrónico válido.' });
      return;
    }

    const allCurrent = [...defaultAdmins, ...dbAdmins.map(a => a.email.toLowerCase())];
    if (allCurrent.includes(trimmed)) {
      setMessage({ type: 'error', text: 'Este correo ya se encuentra en la lista de administradores.' });
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, 'admins'), {
        email: trimmed,
        createdAt: new Date()
      });
      setNewEmail('');
      setMessage({ type: 'success', text: `Administrador ${trimmed} agregado exitosamente.` });
    } catch (err: any) {
      console.error("Error adding admin:", err);
      setMessage({ type: 'error', text: 'Error al agregar administrador en Firestore.' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAdmin = async (id: string, email: string) => {
    if (confirm(`¿Estás seguro de revocar el acceso administrativo a ${email}?`)) {
      try {
        await deleteDoc(doc(db, 'admins', id));
        setMessage({ type: 'success', text: `Administrador ${email} eliminado correctamente.` });
      } catch (err: any) {
        console.error("Error deleting admin:", err);
        setMessage({ type: 'error', text: 'Error al eliminar el administrador.' });
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-slate-900/80 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-fuchsia-500/10 border border-fuchsia-500/30 rounded-xl text-fuchsia-400">
            <Shield size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-widest text-white uppercase font-mono">Gestión de Administradores</h2>
            <p className="text-xs text-slate-400 font-mono mt-1">Controla qué correos electrónicos tienen acceso autorizado al panel de administración.</p>
          </div>
        </div>

        {message && (
          <div className={`p-4 rounded-xl mb-6 flex items-center gap-3 font-mono text-xs ${
            message.type === 'success' 
              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' 
              : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
          }`}>
            {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            <span>{message.text}</span>
          </div>
        )}

        <form onSubmit={handleAddAdmin} className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1">
            <Mail className="absolute left-3.5 top-3.5 text-slate-500" size={16} />
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="nuevo.admin@ejemplo.com"
              className="w-full bg-black/50 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm font-mono text-white placeholder-slate-500 focus:outline-none focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500 transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 bg-fuchsia-600 hover:bg-fuchsia-500 text-white px-6 py-3 rounded-xl font-bold font-mono text-xs tracking-wider uppercase transition-all shadow-[0_0_15px_rgba(217,70,239,0.4)] disabled:opacity-50"
          >
            <UserPlus size={16} />
            {loading ? 'Agregando...' : 'Agregar Admin'}
          </button>
        </form>

        <div className="space-y-3">
          <h3 className="text-xs font-mono uppercase tracking-widest text-slate-400 mb-3">Correos Autorizados Actuales</h3>
          
          <div className="divide-y divide-white/5 border border-white/10 rounded-xl overflow-hidden bg-black/30">
            {defaultAdmins.map((email, idx) => (
              <div key={`def-${idx}`} className="flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-fuchsia-500/10 border border-fuchsia-500/30 flex items-center justify-center text-fuchsia-400 font-mono text-xs font-bold">
                    {email.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <span className="font-mono text-sm text-white">{email}</span>
                    <span className="block text-[10px] font-mono text-fuchsia-400/80 uppercase tracking-widest">Predeterminado del Sistema</span>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2.5 py-1 bg-white/5 text-slate-400 rounded-full border border-white/10 uppercase">Protegido</span>
              </div>
            ))}

            {dbAdmins.map((admin) => (
              <div key={admin.id} className="flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-800 border border-white/10 flex items-center justify-center text-slate-300 font-mono text-xs font-bold">
                    {admin.email.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <span className="font-mono text-sm text-white">{admin.email}</span>
                    <span className="block text-[10px] font-mono text-slate-500 uppercase tracking-widest">Añadido por Administrador</span>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteAdmin(admin.id, admin.email)}
                  className="p-2 bg-rose-500/10 border border-rose-500/30 rounded-lg hover:bg-rose-500/20 text-rose-400 transition-colors flex items-center gap-1.5 text-xs font-mono"
                  title="Eliminar Acceso"
                >
                  <Trash2 size={14} />
                  <span className="hidden sm:inline">Revocar</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
