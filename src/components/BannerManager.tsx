import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import { Upload, Link as LinkIcon, Loader2, CheckCircle2, Video } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface BannerConfig {
  videoUrl: string;
  redirectUrl: string;
  type?: 'image' | 'video';
}

interface BannersState {
  top: BannerConfig;
  mid: BannerConfig;
  footer: BannerConfig;
}

const DEFAULT_BANNERS: BannersState = {
  top: { videoUrl: '', redirectUrl: '' },
  mid: { videoUrl: '', redirectUrl: '' },
  footer: { videoUrl: '', redirectUrl: '' }
};

export function BannerManager() {
  const [banners, setBanners] = useState<BannersState>(DEFAULT_BANNERS);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ show: boolean, message: string }>({ show: false, message: '' });

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const docRef = doc(db, 'configuracion', 'banners_landing');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setBanners(docSnap.data() as BannersState);
        }
      } catch (error) {
        console.error("Error fetching banners:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchBanners();
  }, []);

  const showToast = (message: string) => {
    setToast({ show: true, message });
    setTimeout(() => setToast({ show: false, message: '' }), 3000);
  };

  return (
    <div className="p-4 md:p-8 w-full max-w-4xl mx-auto custom-scrollbar overflow-y-auto h-full">
      <h2 className="text-2xl font-bold font-mono text-fuchsia-500 mb-8 uppercase tracking-widest drop-shadow-[0_0_10px_rgba(217,70,239,0.5)]">
        Gestor de Banners de Portada
      </h2>
      
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-8 h-8 text-fuchsia-500 animate-spin" />
        </div>
      ) : (
        <div className="space-y-8">
          <BannerBlock id="top" title="Banner Top (Superior)" data={banners.top || DEFAULT_BANNERS.top} onUpdate={showToast} />
          <BannerBlock id="mid" title="Banner Mid (Central)" data={banners.mid || DEFAULT_BANNERS.mid} onUpdate={showToast} />
          <BannerBlock id="footer" title="Banner Footer (Inferior)" data={banners.footer || DEFAULT_BANNERS.footer} onUpdate={showToast} />
        </div>
      )}

      <AnimatePresence>
        {toast.show && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 right-6 bg-fuchsia-500 text-white px-4 py-3 rounded-xl shadow-[0_0_20px_rgba(217,70,239,0.6)] flex items-center gap-2 font-mono text-sm z-50"
          >
            <CheckCircle2 className="w-5 h-5" />
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function BannerBlock({ id, title, data, onUpdate }: { id: string, title: string, data: BannerConfig, onUpdate: (msg: string) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [redirectUrl, setRedirectUrl] = useState(data.redirectUrl || '');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpdate = async () => {
    setIsUploading(true);
    let finalVideoUrl = data.videoUrl;

    try {
      if (file) {
        const timestamp = new Date().getTime();
        const ext = file.name.split('.').pop();
        const filename = `${id}_${timestamp}.${ext}`;
        const storageRef = ref(storage, `banners/${filename}`);
        
        const uploadTask = uploadBytesResumable(storageRef, file);
        
        await new Promise<void>((resolve, reject) => {
          uploadTask.on(
            'state_changed',
            (snapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              setUploadProgress(progress);
            },
            (error) => reject(error),
            async () => {
              finalVideoUrl = await getDownloadURL(uploadTask.snapshot.ref);
              resolve();
            }
          );
        });
      }

      const docRef = doc(db, 'configuracion', 'banners_landing');
      
      await setDoc(docRef, {
        [id]: {
          videoUrl: finalVideoUrl,
          redirectUrl
        }
      }, { merge: true });

      setFile(null);
      setUploadProgress(0);
      onUpdate('¡Banner actualizado con éxito!');
    } catch (error) {
      console.error("Error updating banner:", error);
      alert("Error al actualizar el banner.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-slate-900/50 border border-fuchsia-500/20 rounded-2xl p-6 shadow-[0_0_15px_rgba(0,0,0,0.5)]">
      <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <Video className="w-5 h-5 text-fuchsia-400" />
        {title}
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Dropzone */}
        <div className="relative group">
          <input 
            type="file" 
            accept="video/*, image/png, image/jpeg, image/webp" 
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            disabled={isUploading}
          />
          <div className={`h-32 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-colors ${file ? 'border-fuchsia-500 bg-fuchsia-500/10' : 'border-slate-700 bg-slate-800/50 group-hover:border-fuchsia-500/50 group-hover:bg-slate-800'}`}>
            <Upload className={`w-8 h-8 mb-2 ${file ? 'text-fuchsia-400' : 'text-slate-500'}`} />
            <span className="text-sm font-mono text-slate-400 text-center px-4">
              {file ? file.name : 'Arrastra un archivo aquí o haz clic para seleccionar'}
            </span>
          </div>
        </div>

        {/* Form Controls */}
        <div className="flex flex-col justify-between gap-4">
          <div>
            <label className="block text-xs font-mono text-slate-400 mb-2 uppercase tracking-wider">
              Enlace de Redirección (URL o WhatsApp)
            </label>
            <div className="relative">
              <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input 
                type="text" 
                value={redirectUrl}
                onChange={(e) => setRedirectUrl(e.target.value)}
                placeholder="https://wa.me/123456789"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500 transition-colors font-mono"
                disabled={isUploading}
              />
            </div>
          </div>
          
          <button 
            onClick={handleUpdate}
            disabled={isUploading || (!file && redirectUrl === (data.redirectUrl || ''))}
            className="w-full bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-500 hover:to-pink-500 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(217,70,239,0.4)] disabled:shadow-none"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Subiendo... {Math.round(uploadProgress)}%</span>
              </>
            ) : (
              'Actualizar Banner'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
