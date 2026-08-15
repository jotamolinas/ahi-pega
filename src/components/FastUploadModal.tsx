import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Upload, Loader2, Video, CheckCircle2, AlertCircle, Zap } from 'lucide-react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, doc, setDoc } from 'firebase/firestore';
import { db, storage } from '../firebase';

interface FastUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function FastUploadModal({ isOpen, onClose, onSuccess }: FastUploadModalProps) {
  const [cliente, setCliente] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [redirectUrl, setRedirectUrl] = useState('');
  const [duracion, setDuracion] = useState(10);
  const [destino, setDestino] = useState('totem');
  
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (selectedFile.type.startsWith('video/')) {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = function () {
        window.URL.revokeObjectURL(video.src);
        setFile(selectedFile);
      };
      video.src = URL.createObjectURL(selectedFile);
    } else {
      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Debes seleccionar un archivo multimedia.');
      return;
    }
    
    setIsUploading(true);
    setError('');
    
    try {
      const timestamp = new Date().getTime();
      const ext = file.name.split('.').pop();
      const filename = `fastupload_${timestamp}.${ext}`;
      
      const storageRef = ref(storage, `videos/${filename}`);
      
      const uploadTask = uploadBytesResumable(storageRef, file);
      
      const videoUrl = await new Promise<string>((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setUploadProgress(progress);
          },
          (error) => reject(error),
          async () => {
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(url);
          }
        );
      });

      const isImage = file.type.startsWith('image/');
      const tipo = isImage ? 'image' : 'video';

      if (destino === 'totem') {
        await addDoc(collection(db, 'anuncios'), {
          cliente,
          telefono: 'Admin (Carga Rápida)',
          videoUrl,
          redirectUrl,
          tipo,
          estado: 'Aprobado',
          fechaCreacion: new Date()
        });
      } else {
        const docRef = doc(db, 'configuracion', 'banners_landing');
        await setDoc(docRef, {
          [destino]: {
            videoUrl,
            redirectUrl,
            type: tipo
          }
        }, { merge: true });
      }

      setCliente('');
      setFile(null);
      setRedirectUrl('');
      setDestino('totem');
      setUploadProgress(0);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      setError('Error al subir el anuncio. Revisa la consola para más detalles.');
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={!isUploading ? onClose : undefined}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg bg-slate-900 border border-fuchsia-500/30 rounded-2xl shadow-[0_0_40px_rgba(217,70,239,0.15)] overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-4 border-b border-white/10 flex items-center justify-between bg-slate-950">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-fuchsia-500/20 flex items-center justify-center border border-fuchsia-500/30">
                <Zap className="w-4 h-4 text-fuchsia-400" />
              </div>
              <h3 className="font-bold font-mono tracking-widest text-fuchsia-400 uppercase text-sm">Carga Rápida</h3>
            </div>
            {!isUploading && (
              <button 
                onClick={onClose}
                className="p-2 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
          
          {/* Form */}
          <div className="p-6 overflow-y-auto custom-scrollbar">
            {error && (
              <div className="mb-4 bg-rose-500/10 border border-rose-500/50 rounded-lg p-3 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
                <p className="text-xs text-rose-400 font-mono">{error}</p>
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-mono tracking-widest text-slate-300 uppercase mb-1">Nombre de la Marca / Cliente</label>
                <input 
                  type="text" 
                  required
                  value={cliente}
                  onChange={e => setCliente(e.target.value)}
                  disabled={isUploading}
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white font-mono text-sm focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500 transition-colors"
                  placeholder="Ej. Coca-Cola, Promo Julio"
                />
              </div>

              <div>
                <label className="block text-xs font-mono tracking-widest text-slate-300 uppercase mb-1">Ubicación / Destino</label>
                <select 
                  value={destino}
                  onChange={e => setDestino(e.target.value)}
                  disabled={isUploading}
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white font-mono text-sm focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500 transition-colors"
                >
                  <option value="totem">Modo TV (Tótems - Rotación General)</option>
                  <option value="top">Landing Page: Banner Top (Superior)</option>
                  <option value="mid">Landing Page: Banner Mid (Central)</option>
                  <option value="footer">Landing Page: Banner Footer (Inferior)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono tracking-widest text-slate-300 uppercase mb-1">Archivo Multimedia</label>
                <div className="relative group">
                  <input 
                    type="file" 
                    accept="video/*, image/*"
                    onChange={handleFileChange}
                    ref={fileInputRef}
                    disabled={isUploading}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className={`h-24 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-colors ${file ? 'border-fuchsia-500 bg-fuchsia-500/10' : 'border-slate-700 bg-slate-800/50 group-hover:border-fuchsia-500/50 group-hover:bg-slate-800'}`}>
                    <Upload className={`w-6 h-6 mb-2 ${file ? 'text-fuchsia-400' : 'text-slate-500'}`} />
                    <span className="text-xs font-mono text-slate-400 text-center px-4">
                      {file ? file.name : 'Click o arrastra (Máx 10MB / 15s)'}
                    </span>
                  </div>
                </div>
              </div>

              {file && file.type.startsWith('image/') && (
                <div>
                  <label className="block text-xs font-mono tracking-widest text-slate-300 uppercase mb-1">Duración en pantalla (Segundos)</label>
                  <select 
                    value={duracion}
                    onChange={e => setDuracion(Number(e.target.value))}
                    disabled={isUploading}
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white font-mono text-sm focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500 transition-colors"
                  >
                    <option value={5}>5 Segundos</option>
                    <option value={10}>10 Segundos</option>
                    <option value={15}>15 Segundos</option>
                    <option value={20}>20 Segundos</option>
                    <option value={30}>30 Segundos</option>
                  </select>
                </div>
              )}
              <div>
                <label className="block text-xs font-mono tracking-widest text-slate-300 uppercase mb-1">Enlace de Redirección (Opcional)</label>
                <input 
                  type="text" 
                  value={redirectUrl}
                  onChange={e => setRedirectUrl(e.target.value)}
                  disabled={isUploading}
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white font-mono text-sm focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500 transition-colors"
                  placeholder="https://wa.me/..."
                />
              </div>

              <button 
                type="submit"
                disabled={isUploading}
                className="w-full mt-4 bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-500 hover:to-pink-500 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase font-mono tracking-widest text-sm shadow-[0_0_15px_rgba(217,70,239,0.4)] disabled:shadow-none"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Subiendo {Math.round(uploadProgress)}%</span>
                  </>
                ) : (
                  <>Publicar Anuncio Ahora</>
                )}
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
