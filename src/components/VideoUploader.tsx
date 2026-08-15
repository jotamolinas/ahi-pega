import React, { useState, useRef } from 'react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';
import { UploadCloud, Video, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';

export function VideoUploader({ onUploadComplete, disabled }: { onUploadComplete?: (url: string) => void, disabled?: boolean }) {
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [downloadURL, setDownloadURL] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      if (selectedFile.size > 10 * 1024 * 1024) {
        setFile(null);
        setError('El archivo supera el límite de 10 MB.');
        return;
      }

      if (selectedFile.type.startsWith('video/')) {
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.onloadedmetadata = function () {
          window.URL.revokeObjectURL(video.src);
          if (video.duration > 15) {
            setFile(null);
            setError('El video supera el límite de 15 segundos.');
            if (fileInputRef.current) fileInputRef.current.value = '';
          } else {
            setFile(selectedFile);
            setError(null);
            setDownloadURL(null);
            setProgress(0);
          }
        };
        video.src = URL.createObjectURL(selectedFile);
      } else if (selectedFile.type.startsWith('image/')) {
        setFile(selectedFile);
        setError(null);
        setDownloadURL(null);
        setProgress(0);
      } else {
        setFile(null);
        setError('Por favor, selecciona un archivo de video o imagen válido.');
      }
    }
  };

  const handleUpload = () => {
    if (!file) return;

    setIsUploading(true);
    setError(null);

    const uniqueFileName = `${Date.now()}-${file.name}`;
    const storageRef = ref(storage, `videos/${uniqueFileName}`);

    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progressPercent = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        setProgress(progressPercent);
      },
      (error) => {
        console.error("Error al subir:", error);
        setError('Error al subir el video. Por favor, intenta de nuevo.');
        setIsUploading(false);
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then((url) => {
          setDownloadURL(url);
          setIsUploading(false);
          if (onUploadComplete) {
            onUploadComplete(url);
          }
        });
      }
    );
  };

  return (
    <div className="w-full mt-6">
      {error && (
        <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start text-rose-400 text-xs font-mono">
          <AlertTriangle className="w-5 h-5 mr-3 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {downloadURL ? (
        <div className="text-center animate-in fade-in zoom-in duration-500 py-6">
          <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
            <CheckCircle className="w-8 h-8 text-emerald-400" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2 uppercase tracking-widest">¡Archivo Subido con Éxito!</h3>
          <p className="text-xs text-fuchsia-500 font-mono break-all mb-4 line-clamp-2">{downloadURL}</p>
          <button
            onClick={() => {
              setDownloadURL(null);
              setFile(null);
              setProgress(0);
            }}
            type="button"
            className="w-full bg-white/5 hover:bg-white/10 text-white border border-white/10 py-3 rounded-xl font-mono text-xs uppercase tracking-widest transition-colors"
          >
            Subir Otro Archivo
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <input
            type="file"
            accept="video/*,image/*"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />
          
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex flex-col items-center justify-center w-full min-h-[120px] border-2 border-dashed border-fuchsia-500 bg-fuchsia-500/5 hover:bg-fuchsia-500/10 hover:shadow-[0_0_15px_rgba(217,70,239,0.2)] rounded-xl transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Video className={`w-8 h-8 mb-2 transition-colors ${file ? 'text-fuchsia-500' : 'text-slate-500 group-hover:text-fuchsia-500'}`} />
            <span className="text-sm font-mono font-bold tracking-widest text-fuchsia-500 text-center px-4 uppercase">
              {file ? file.name : 'SELECCIONAR ARCHIVO'}
            </span>
            {!file && !isUploading && <span className="text-xs text-slate-500 font-mono mt-1">Formatos de video e imagen soportados</span>}
          </button>

          {isUploading && (
            <div className="w-full bg-black/50 rounded-full h-4 border border-white/10 overflow-hidden relative">
              <div
                className="bg-fuchsia-500 h-full transition-all duration-300 shadow-[0_0_10px_rgba(217,70,239,0.8)]"
                style={{ width: `${progress}%` }}
              ></div>
              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white font-mono mix-blend-difference">
                {progress}%
              </span>
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={!file || isUploading || disabled}
            type="button"
            className="w-full bg-gradient-to-r from-pink-500 to-fuchsia-600 text-white font-bold tracking-widest text-sm py-4 px-4 rounded-xl hover:brightness-110 focus:ring-4 focus:ring-fuchsia-500/50 outline-none transition-all flex items-center justify-center uppercase shadow-[0_0_20px_rgba(217,70,239,0.5)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? (
              <><Loader2 className="w-5 h-5 animate-spin mr-2" /> SUBIENDO...</>
            ) : (
              <><UploadCloud className="w-5 h-5 mr-2" /> SUBIR ARCHIVO</>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
