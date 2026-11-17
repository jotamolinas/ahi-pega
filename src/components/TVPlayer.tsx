import React, { useState, useEffect, useRef } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '../firebase';
import { X, RotateCw } from 'lucide-react';
import QRCode from 'react-qr-code';

interface Anuncio {
  id: string;
  videoUrl: string;
  estado: 'Pendiente' | 'Aprobado' | 'Rechazado';
  orden?: number;
  duracion?: number;
  tipo?: 'image' | 'video';
  qrLink?: string;
}

interface TVPlayerProps {
  onClose: () => void;
}

export function TVPlayer({ onClose }: TVPlayerProps) {
  const [playlist, setPlaylist] = useState<{ url: string; type: 'image' | 'video'; duracion?: number; qrLink?: string }[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isRotated, setIsRotated] = useState(false);

  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/tv-sw.js').then(reg => {
        console.log('TV Service Worker registrado con éxito', reg);
      }).catch(err => {
        console.error('Error al registrar TV Service Worker', err);
      });
    }
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'anuncios'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const adsData: Anuncio[] = [];
      snapshot.forEach((doc) => {
        adsData.push({ id: doc.id, ...doc.data() } as Anuncio);
      });
      
      const approvedAds = adsData
        .filter(a => a.estado === 'Aprobado' && a.videoUrl)
        .sort((a, b) => {
          const orderA = a.orden ?? Number.MAX_SAFE_INTEGER;
          const orderB = b.orden ?? Number.MAX_SAFE_INTEGER;
          return orderA - orderB;
        });

      const items: { url: string; type: 'image' | 'video'; duracion?: number; qrLink?: string }[] = approvedAds.map(ad => {
        const isImg = ad.tipo === 'image' || (ad.tipo !== 'video' && !!ad.videoUrl && !!ad.videoUrl.match(/\.(jpeg|jpg|gif|png|webp|svg)(\?.*)?$/i));
        return {
          url: ad.videoUrl,
          type: isImg ? 'image' : 'video',
          duracion: ad.duracion,
          qrLink: ad.qrLink
        };
      });

      setPlaylist(items);
      setLoading(false);
      
      setCurrentIndex((prev) => {
        if (items.length === 0) return 0;
        return prev >= items.length ? 0 : prev;
      });
    }, (error) => {
      console.error("Error fetching anuncios for TV mode:", error);
      setLoading(false);
    });
    
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.log(`Error attempting to enable fullscreen: ${err.message}`);
      });
    }
    
    return () => {
      unsubscribe();
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, []);

  const handleEnded = () => {
    setCurrentIndex(prev => (prev + 1) % playlist.length);
  };

  // Timer for image items
  useEffect(() => {
    if (playlist.length > 0 && playlist[currentIndex]?.type === 'image') {
      const durationMs = (playlist[currentIndex].duracion || 10) * 1000;
      const timer = setTimeout(() => {
        handleEnded();
      }, durationMs);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, playlist]);

  // Video playback management when currentIndex changes
  useEffect(() => {
    playlist.forEach((item, idx) => {
      const videoEl = videoRefs.current[idx];
      if (!videoEl) return;

      if (idx === currentIndex && item.type === 'video') {
        try {
          videoEl.currentTime = 0;
        } catch (e) {
          console.warn("Could not reset currentTime", e);
        }
        const playPromise = videoEl.play();
        if (playPromise !== undefined) {
          playPromise.catch(err => {
            console.warn("Autoplay muted fallback:", err);
            videoEl.muted = true;
            videoEl.play().catch(e => console.error("Play failed:", e));
          });
        }
      } else {
        videoEl.pause();
      }
    });
  }, [currentIndex, playlist]);

  if (loading) {
    return (
      <div className="w-screen h-screen bg-black flex items-center justify-center text-white">
        <span className="animate-pulse font-mono">Cargando Modo TV...</span>
      </div>
    );
  }

  if (playlist.length === 0) {
    return (
      <div className="w-screen h-screen bg-black flex flex-col items-center justify-center text-white">
        <p className="font-mono mb-4 text-slate-400">No hay anuncios aprobados para reproducir.</p>
        <button 
          onClick={onClose}
          className="px-4 py-2 border border-white/20 rounded-md hover:bg-white/10"
        >
          Volver
        </button>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen bg-black overflow-hidden relative flex items-center justify-center">
      <div className={`relative flex items-center justify-center transition-transform duration-500 ease-in-out ${isRotated ? 'rotate-90 w-[100vh] h-[100vw]' : 'w-full h-full'}`}>
        {playlist.map((item, idx) => {
          const isActive = idx === currentIndex;
          const mediaSrc = item.url;

          return (
            <div
              key={`${item.url}-${idx}`}
              className={`absolute inset-0 w-full h-full flex items-center justify-center transition-opacity duration-300 ${
                isActive ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'
              }`}
            >
              {item.type === 'video' ? (
                <video
                  ref={el => { videoRefs.current[idx] = el; }}
                  src={mediaSrc}
                  className="w-full h-full object-contain"
                  preload="auto"
                  autoPlay={isActive}
                  muted
                  playsInline
                  loop={playlist.length === 1}
                  onEnded={() => {
                    if (isActive) handleEnded();
                  }}
                  onError={() => {
                    if (isActive) {
                      console.error("Error reproduciendo video, saltando...");
                      handleEnded();
                    }
                  }}
                />
              ) : (
                <img
                  src={mediaSrc}
                  alt="TV Banner"
                  className="w-full h-full object-contain"
                  onError={() => {
                    if (isActive) handleEnded();
                  }}
                />
              )}
              
              {item.qrLink && item.qrLink.trim() !== '' && isActive && (
                <div className="absolute top-12 right-12 bg-black/60 backdrop-blur-md p-3 rounded-2xl border border-white/30 flex flex-col items-center gap-2 shadow-[0_10px_40px_rgba(0,0,0,0.6)] z-[60] transition-all duration-1000 animate-in fade-in slide-in-from-top-8">
                  <div className="bg-white p-2 rounded-xl shadow-inner">
                    <QRCode value={item.qrLink.trim()} size={90} />
                  </div>
                  <span className="text-white font-mono font-bold text-[10px] tracking-widest uppercase text-center drop-shadow-md max-w-[90px] leading-tight">
                    ¡Escanea para visitar!
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      <div className="absolute top-4 right-4 flex items-center gap-3 z-50">
        <button 
          onClick={() => setIsRotated(!isRotated)}
          className="flex items-center gap-2 text-white/40 hover:text-white transition-colors p-2 bg-black/40 hover:bg-black/60 rounded-full backdrop-blur-md"
          title="Girar Pantalla"
        >
          <RotateCw size={24} />
        </button>
        <button 
          onClick={onClose}
          className="flex items-center gap-2 text-white/40 hover:text-white transition-colors p-2 bg-black/40 hover:bg-black/60 rounded-full backdrop-blur-md"
          title="Cerrar Modo TV"
        >
          <X size={24} />
        </button>
      </div>
    </div>
  );
}
