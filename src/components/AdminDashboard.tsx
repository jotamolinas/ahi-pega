import React, { useState, useEffect, useRef } from 'react';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db, auth, storage } from '../firebase';
import { ref, deleteObject } from 'firebase/storage';
import { signOut } from 'firebase/auth';
import { Check, X, Clock, ExternalLink, Video, MonitorPlay, Settings2, RefreshCcw, Zap, Play, Pause, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Camera, Images, Minimize2, AlertCircle, Trash2, LogOut, Download, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import QRCode from 'react-qr-code';

interface Anuncio {
  id: string;
  telefono: string;
  videoUrl: string;
  comprobanteUrl: string;
  planElegido?: string;
  estado: 'Pendiente' | 'Aprobado' | 'Rechazado';
  fechaCreacion: any;
  transicion?: string;
  orden?: number;
  duracion?: number;
  tipo?: 'image' | 'video';
  qrLink?: string;
}

const isImageUrl = (url?: string) => (url ? !!url.match(/\.(jpeg|jpg|gif|png|webp|svg)(\?.*)?$/i) : false);

const isMediaImage = (ad?: Anuncio) => {
  if (!ad) return false;
  if (ad.tipo === 'image') return true;
  if (ad.tipo === 'video') return false;
  return isImageUrl(ad.videoUrl);
};

const TRANSITION_DURATION = 1.0;

const transitionVariants = {
  blur: {
    initial: { opacity: 0, filter: "blur(15px)", scale: 0.95 },
    animate: { opacity: 1, filter: "blur(0px)", scale: 1, transition: { duration: TRANSITION_DURATION, ease: "easeOut" } },
    exit: { opacity: 0, filter: "blur(15px)", scale: 1.05, transition: { duration: TRANSITION_DURATION, ease: "easeIn" } },
  },
  flash: {
    initial: { opacity: 0, filter: "brightness(5) blur(10px)" },
    animate: { opacity: 1, filter: "brightness(1) blur(0px)", transition: { duration: TRANSITION_DURATION, ease: "easeOut" } },
    exit: { opacity: 0, filter: "brightness(10) blur(20px)", transition: { duration: TRANSITION_DURATION, ease: "easeIn" } }
  },
  slide: {
    initial: { x: "100%", opacity: 1 },
    animate: { x: 0, opacity: 1, transition: { duration: TRANSITION_DURATION, ease: [0.16, 1, 0.3, 1] } },
    exit: { x: "-100%", opacity: 1, transition: { duration: TRANSITION_DURATION, ease: [0.16, 1, 0.3, 1] } },
  },
  flip: {
    initial: { rotateY: 90, opacity: 0 },
    animate: { rotateY: 0, opacity: 1, transition: { duration: TRANSITION_DURATION, ease: [0.16, 1, 0.3, 1] } },
    exit: { rotateY: -90, opacity: 0, transition: { duration: TRANSITION_DURATION, ease: [0.16, 1, 0.3, 1] } }
  }
};

type TransitionType = 'blur' | 'flash' | 'slide' | 'flip';

import { BannerManager } from './BannerManager';
import { TVPlayer } from './TVPlayer';
import { FastUploadModal } from './FastUploadModal';
import { AdminManager } from './AdminManager';

export function AdminDashboard() {
  const [anuncios, setAnuncios] = useState<Anuncio[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'anuncios' | 'banners' | 'totem' | 'admins'>('anuncios');
  const [tvMode, setTvMode] = useState(false);
  const [showFastUpload, setShowFastUpload] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{id: string, mediaUrl?: string} | null>(null);
  const [toast, setToast] = useState<{ show: boolean, message: string }>({ show: false, message: '' });

  // Totem Player States
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  const onMouseDown = (e: React.MouseEvent) => {
    if (!scrollContainerRef.current) return;
    isDragging.current = true;
    startX.current = e.pageX - scrollContainerRef.current.offsetLeft;
    scrollLeft.current = scrollContainerRef.current.scrollLeft;
    scrollContainerRef.current.style.cursor = 'grabbing';
    scrollContainerRef.current.style.userSelect = 'none';
  };

  const onMouseLeave = () => {
    isDragging.current = false;
    if (scrollContainerRef.current) {
      scrollContainerRef.current.style.cursor = 'grab';
      scrollContainerRef.current.style.userSelect = 'auto';
    }
  };

  const onMouseUp = () => {
    isDragging.current = false;
    if (scrollContainerRef.current) {
      scrollContainerRef.current.style.cursor = 'grab';
      scrollContainerRef.current.style.userSelect = 'auto';
    }
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !scrollContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startX.current) * 2;
    scrollContainerRef.current.scrollLeft = scrollLeft.current - walk;
  };

  const [isPlaying, setIsPlaying] = useState(true);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [previewTriggers, setPreviewTriggers] = useState<Record<string, number>>({});
  const [showProblematicModal, setShowProblematicModal] = useState(false);

  const approvedAds = anuncios.filter(a => a.estado === 'Aprobado' && a.videoUrl);
  const currentAd = approvedAds[currentVideoIndex];
  const currentTransition = (currentAd?.transicion as TransitionType) || 'blur';

  // Separate ads
  const validAdsForReview = anuncios;
  
  const problematicAds = anuncios.filter(a => 
    !a.videoUrl
  );

  const showToastMsg = (message: string) => {
    setToast({ show: true, message });
    setTimeout(() => setToast({ show: false, message: '' }), 3000);
  };

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      setDeferredPrompt(null);
    } else {
      showToastMsg('Para instalar, abre esta página en una nueva pestaña o usa el menú del navegador "Añadir a inicio"');
    }
  };

  useEffect(() => {
    if (currentVideoIndex >= approvedAds.length && approvedAds.length > 0) {
      setCurrentVideoIndex(0);
    }
  }, [approvedAds.length, currentVideoIndex]);

  // Video playback synchronization effect across preloaded elements
  useEffect(() => {
    approvedAds.forEach((ad, idx) => {
      if (isMediaImage(ad)) return;
      [idx, idx + approvedAds.length].forEach(refIdx => {
        const vEl = videoRefs.current[refIdx];
        if (!vEl) return;
        if (idx === currentVideoIndex && isPlaying) {
          try {
            vEl.currentTime = 0;
          } catch (e) {
            console.warn("Could not reset currentTime", e);
          }
          const playPromise = vEl.play();
          if (playPromise !== undefined) {
            playPromise.catch(() => {
              vEl.muted = true;
              vEl.play().catch(() => {});
            });
          }
        } else {
          vEl.pause();
        }
      });
    });
  }, [currentVideoIndex, isPlaying, approvedAds]);

  const handleVideoEnded = () => {
    if (approvedAds.length === 0) return;
    if (approvedAds.length === 1) {
      [0, approvedAds.length].forEach(refIdx => {
        const vEl = videoRefs.current[refIdx];
        if (vEl) {
          vEl.currentTime = 0;
          vEl.play().catch(() => {});
        }
      });
      return;
    }
    setCurrentVideoIndex((prev) => (prev + 1) % approvedAds.length);
  };

  // Image auto-advance timer in preview
  useEffect(() => {
    if (!isPlaying || approvedAds.length <= 1) return;
    const current = approvedAds[currentVideoIndex];
    if (current && isMediaImage(current)) {
      const durationMs = (current.duracion || 10) * 1000;
      const timer = setTimeout(() => {
        handleVideoEnded();
      }, durationMs);
      return () => clearTimeout(timer);
    }
  }, [currentVideoIndex, approvedAds, isPlaying]);

  const handleRestartLoop = () => {
    setCurrentVideoIndex(0);
  };

  const handleNextVideo = () => {
    if (approvedAds.length === 0) return;
    if (approvedAds.length === 1) {
      [0, approvedAds.length].forEach(refIdx => {
        const vEl = videoRefs.current[refIdx];
        if (vEl) {
          vEl.currentTime = 0;
          vEl.play().catch(() => {});
        }
      });
      return;
    }
    setCurrentVideoIndex((prev) => (prev + 1) % approvedAds.length);
  };

  const handlePrevVideo = () => {
    if (approvedAds.length === 0) return;
    if (approvedAds.length === 1) {
      [0, approvedAds.length].forEach(refIdx => {
        const vEl = videoRefs.current[refIdx];
        if (vEl) {
          vEl.currentTime = 0;
          vEl.play().catch(() => {});
        }
      });
      return;
    }
    setCurrentVideoIndex((prev) => (prev - 1 + approvedAds.length) % approvedAds.length);
  };

  const togglePlay = () => {
    const nextIsPlaying = !isPlaying;
    setIsPlaying(nextIsPlaying);
    [currentVideoIndex, currentVideoIndex + approvedAds.length].forEach(refIdx => {
      const vEl = videoRefs.current[refIdx];
      if (vEl) {
        if (nextIsPlaying) {
          vEl.play().catch(() => {});
        } else {
          vEl.pause();
        }
      }
    });
  };

  useEffect(() => {
    const q = query(collection(db, 'anuncios'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const adsData: Anuncio[] = [];
      snapshot.forEach((doc) => {
        adsData.push({ id: doc.id, ...doc.data() } as Anuncio);
      });
      
      adsData.sort((a, b) => (a.orden || 0) - (b.orden || 0));

      setAnuncios(adsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching anuncios:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const updateStatus = async (id: string, newStatus: 'Pendiente' | 'Aprobado' | 'Rechazado') => {
    try {
      const docRef = doc(db, 'anuncios', id);
      await updateDoc(docRef, { estado: newStatus });
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Error al actualizar el estado");
    }
  };

  const executeDelete = async (id: string, mediaUrl?: string) => {
    try {
      if (mediaUrl) {
        try {
          const fileRef = ref(storage, mediaUrl);
          await deleteObject(fileRef);
          console.log('Archivo eliminado de Storage');
        } catch (storageError) {
          console.warn('No se pudo borrar el archivo de Storage (puede que ya no exista):', storageError);
        }
      }

      await deleteDoc(doc(db, 'anuncios', id));
      console.log('Documento eliminado de Firestore');
      showToastMsg('Anuncio eliminado con éxito');
    } catch (error) {
      console.error('Error al eliminar el anuncio:', error);
      showToastMsg('Error al eliminar el anuncio');
    } finally {
      setItemToDelete(null);
    }
  };

  const handleDurationChange = async (id: string, duration: number) => {
    try {
      const docRef = doc(db, 'anuncios', id);
      await updateDoc(docRef, { duracion: duration });
      showToastMsg('Duración actualizada');
    } catch (error) {
      console.error("Error updating duration:", error);
      showToastMsg("Error al actualizar la duración");
    }
  };

  const handleQrLinkChange = async (id: string, qrLink: string) => {
    try {
      const docRef = doc(db, 'anuncios', id);
      await updateDoc(docRef, { qrLink });
      showToastMsg('Link para QR actualizado');
    } catch (error) {
      console.error("Error updating QR Link:", error);
      showToastMsg("Error al actualizar el Link para QR");
    }
  };

  const handleTransitionChange = async (id: string, transition: TransitionType) => {
    try {
      const docRef = doc(db, 'anuncios', id);
      await updateDoc(docRef, { transicion: transition });
      
      setPreviewTriggers(prev => ({
        ...prev,
        [id]: (prev[id] || 0) + 1
      }));

      const indexInApproved = approvedAds.findIndex(a => a.id === id);
      if (indexInApproved !== -1) {
        setCurrentVideoIndex(indexInApproved);
        setIsPlaying(true);
      }
    } catch (error) {
      console.error("Error updating transition:", error);
      alert("Error al actualizar la transición");
    }
  };

  const handleMoveOrder = async (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === validAdsForReview.length - 1) return;

    const currentAd = validAdsForReview[index];
    const adjacentAd = validAdsForReview[direction === 'up' ? index - 1 : index + 1];

    try {
      const currentRef = doc(db, 'anuncios', currentAd.id);
      const adjacentRef = doc(db, 'anuncios', adjacentAd.id);

      const currentOrder = currentAd.orden ?? index;
      const adjacentOrder = adjacentAd.orden ?? (direction === 'up' ? index - 1 : index + 1);

      await updateDoc(currentRef, { orden: adjacentOrder });
      await updateDoc(adjacentRef, { orden: currentOrder });
    } catch (error) {
      console.error("Error updating order:", error);
      alert("Error al reordenar");
    }
  };

  if (tvMode) {
    return <TVPlayer onClose={() => setTvMode(false)} />;
  }

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden bg-slate-950 text-white selection:bg-fuchsia-500/30">
      
      {/* DESKTOP VIEW (Hidden on Mobile) */}
      <div className="hidden md:flex md:flex-row h-full w-full overflow-hidden">
        {/* Left Panel (Ad Carousel) */}
        <div className="w-full h-full md:w-5/12 flex flex-col bg-black z-20">
          {/* Header */}
          <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between shrink-0 p-4 md:p-6 pb-2 md:pb-2 gap-3 md:gap-4 border-b border-white/5 md:border-b-0">
            <div className="flex flex-col gap-2">
              <h1 className="text-xl md:text-3xl font-bold tracking-widest text-fuchsia-500 uppercase drop-shadow-[0_0_15px_rgba(217,70,239,0.8)]">
                Panel de Adm.
              </h1>
              <div className="flex gap-2">
                <button 
                  onClick={() => setActiveTab('anuncios')}
                  className={`px-3 py-1 rounded-lg text-xs font-mono uppercase tracking-widest transition-colors ${activeTab === 'anuncios' ? 'bg-fuchsia-500/20 text-fuchsia-400 border border-fuchsia-500/50' : 'text-slate-500 hover:text-slate-300 border border-transparent'}`}
                >
                  Anuncios
                </button>
                <button 
                  onClick={() => setActiveTab('banners')}
                  className={`px-3 py-1 rounded-lg text-xs font-mono uppercase tracking-widest transition-colors ${activeTab === 'banners' ? 'bg-fuchsia-500/20 text-fuchsia-400 border border-fuchsia-500/50' : 'text-slate-500 hover:text-slate-300 border border-transparent'}`}
                >
                  Banners
                </button>
                <button 
                  onClick={() => setActiveTab('admins')}
                  className={`px-3 py-1 rounded-lg text-xs font-mono uppercase tracking-widest transition-colors ${activeTab === 'admins' ? 'bg-fuchsia-500/20 text-fuchsia-400 border border-fuchsia-500/50' : 'text-slate-500 hover:text-slate-300 border border-transparent'}`}
                >
                  Admins
                </button>
                <div className="w-px h-4 bg-white/10 mx-1"></div>
                <button 
                  onClick={() => setShowFastUpload(true)}
                  className="px-3 py-1 bg-fuchsia-500/20 hover:bg-fuchsia-500/30 text-fuchsia-400 border border-fuchsia-500/50 rounded-lg text-xs font-mono uppercase tracking-widest transition-colors flex items-center gap-1 shadow-[0_0_10px_rgba(217,70,239,0.3)]"
                  title="Carga Rápida de Anuncio"
                >
                  <Zap size={12} className="text-fuchsia-400" /> Carga Rápida
                </button>
                <button 
                  onClick={handleInstallClick}
                  className="px-3 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/50 rounded-lg text-xs font-mono uppercase tracking-widest transition-colors flex items-center gap-1 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                  title="Instalar Aplicación"
                >
                  <Download size={12} className="text-emerald-400" /> Instalar App
                </button>
                <button 
                  onClick={() => signOut(auth)}
                  className="px-3 py-1 rounded-lg text-xs font-mono uppercase tracking-widest transition-colors text-slate-500 hover:text-rose-400 border border-transparent hover:bg-rose-500/10 flex items-center gap-1"
                  title="Cerrar Sesión"
                >
                  <LogOut size={12} /> Salir
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setTvMode(true)}
                className="flex items-center gap-2 bg-[#CCFF00]/10 hover:bg-[#CCFF00]/20 text-[#CCFF00] border border-[#CCFF00]/50 px-2 md:px-3 py-1.5 rounded-lg text-[10px] md:text-xs font-mono font-bold tracking-wider transition-colors shadow-[0_0_10px_rgba(204,255,0,0.3)] hover:shadow-[0_0_15px_rgba(204,255,0,0.5)]"
              >
                <MonitorPlay size={14} />
                Lanzar Modo TV
              </button>
              <button
                onClick={() => setShowProblematicModal(true)}
                className="flex items-center gap-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 px-2 md:px-3 py-1.5 rounded-lg text-[10px] md:text-xs font-mono tracking-wider transition-colors"
              >
                <AlertCircle className="w-3 h-3 md:w-4 md:h-4" />
                <span>Incompletos ({problematicAds.length})</span>
              </button>
              <Link to="/" className="text-[10px] md:text-xs text-slate-400 hover:text-white font-mono uppercase tracking-widest transition-colors border-b border-transparent hover:border-white pb-1">
                Ir a Portal
              </Link>
            </div>
          </div>

          {activeTab === 'anuncios' ? (
            <div className="relative flex-1 flex flex-col min-h-0 w-full">
              <div 
                ref={scrollContainerRef}
                onMouseDown={onMouseDown}
                onMouseLeave={onMouseLeave}
                onMouseUp={onMouseUp}
                onMouseMove={onMouseMove}
                onDragStart={(e) => e.preventDefault()}
                className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col gap-6 items-start cursor-grab"
              >
                {loading ? (
                  <div className="flex justify-center items-center h-full w-full md:h-64">
                    <div className="w-10 h-10 border-4 border-fuchsia-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : validAdsForReview.length === 0 ? (
                  <div className="bg-black/40 border border-white/5 rounded-xl p-12 text-center w-full">
                    <p className="text-slate-400 font-mono">No hay anuncios listos para revisión.</p>
                  </div>
                ) : (
                  validAdsForReview.map((anuncio, index) => (
                    <div key={anuncio.id} className="w-full flex-shrink-0 flex flex-col bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg transition-colors hover:border-fuchsia-500/30">
                      {/* Header: Status, Phone & Reorder */}
                      <div className="pb-3 mb-3 border-b border-white/10 flex justify-between items-center">
                        <div>
                          <div className="font-mono font-bold text-base">{anuncio.telefono}</div>
                          <div className="text-[10px] text-fuchsia-500 uppercase tracking-widest font-mono mt-1">{anuncio.planElegido || 'Sin Plan'}</div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className={`px-2 py-1 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 ${
                            anuncio.estado === 'Pendiente' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                            anuncio.estado === 'Aprobado' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                            'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          }`}>
                            {anuncio.estado === 'Pendiente' && <Clock className="w-3 h-3" />}
                            {anuncio.estado === 'Aprobado' && <Check className="w-3 h-3" />}
                            {anuncio.estado === 'Rechazado' && <X className="w-3 h-3" />}
                            {anuncio.estado}
                          </div>
                          <div className="flex gap-1">
                            <button 
                              onClick={() => handleMoveOrder(index, 'up')}
                              disabled={index === 0}
                              className="p-1 bg-white/5 hover:bg-fuchsia-500/20 text-slate-400 hover:text-fuchsia-500 rounded transition-colors disabled:opacity-30"
                            >
                              <ChevronUp className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleMoveOrder(index, 'down')}
                              disabled={index === validAdsForReview.length - 1}
                              className="p-1 bg-white/5 hover:bg-fuchsia-500/20 text-slate-400 hover:text-fuchsia-500 rounded transition-colors disabled:opacity-30"
                            >
                              <ChevronDown className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Body: Video & Receipt */}
                      <div className="p-3 flex flex-row gap-3 h-auto min-h-[8rem]">
                        <div className="w-16 min-h-[8rem] bg-black rounded overflow-hidden border border-slate-800 relative flex items-center justify-center shrink-0">
                          {anuncio.videoUrl ? (
                            <AnimatePresence mode="popLayout">
                              <motion.div
                                key={`${anuncio.transicion}-${previewTriggers[anuncio.id] || 0}`}
                                variants={transitionVariants[(anuncio.transicion as TransitionType) || 'blur']}
                                initial="initial"
                                animate="animate"
                                className="w-full h-full"
                              >
                                {isMediaImage(anuncio) ? (
                                  <img src={anuncio.videoUrl} className="w-full h-full object-cover" alt="Ad" />
                                ) : (
                                  <video 
                                    src={anuncio.videoUrl} 
                                    className="w-full h-full object-cover pointer-events-none"
                                    autoPlay
                                    muted
                                    loop
                                    playsInline
                                  />
                                )}
                              </motion.div>
                            </AnimatePresence>
                          ) : (
                            <div className="text-slate-600 flex flex-col items-center">
                              <Video className="w-4 h-4 mb-1" />
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1 flex flex-col justify-between">
                          <div className="w-full space-y-2">
                            <div>
                              <label className="text-[9px] text-slate-500 uppercase tracking-widest font-mono mb-1 block">Efecto de Entrada (1s)</label>
                              <select 
                                value={anuncio.transicion || 'blur'}
                                onChange={(e) => handleTransitionChange(anuncio.id, e.target.value as TransitionType)}
                                className="w-full bg-black/50 border border-white/10 rounded-md text-xs font-mono text-slate-300 p-1.5 focus:border-fuchsia-500/50 focus:ring-1 focus:ring-fuchsia-500/50 outline-none transition-colors"
                              >
                                <option value="blur">Cinematic Blur</option>
                                <option value="flash">Studio Flash</option>
                                <option value="slide">Geometric Slide</option>
                                <option value="flip">3D Flip</option>
                              </select>
                            </div>

                            {isMediaImage(anuncio) && (
                              <div>
                                <label className="text-[9px] text-slate-500 uppercase tracking-widest font-mono mb-1 block">Duración (Segundos)</label>
                                <select 
                                  value={anuncio.duracion || 10}
                                  onChange={(e) => handleDurationChange(anuncio.id, Number(e.target.value))}
                                  className="w-full bg-black/50 border border-white/10 rounded-md text-xs font-mono text-slate-300 p-1.5 focus:border-fuchsia-500/50 focus:ring-1 focus:ring-fuchsia-500/50 outline-none transition-colors"
                                >
                                  <option value={5}>5 Seg</option>
                                  <option value={10}>10 Seg</option>
                                  <option value={15}>15 Seg</option>
                                  <option value={20}>20 Seg</option>
                                  <option value={30}>30 Seg</option>
                                </select>
                              </div>
                            )}

                            <div className="pt-1">
                              <label className="text-[9px] text-slate-500 uppercase tracking-widest font-mono mb-1 block">Link (Web/Instagram)</label>
                              <input 
                                type="url"
                                placeholder="https://..."
                                defaultValue={anuncio.qrLink || ''}
                                onBlur={(e) => {
                                  if (e.target.value !== anuncio.qrLink) {
                                    handleQrLinkChange(anuncio.id, e.target.value);
                                  }
                                }}
                                className="w-full bg-black/50 border border-white/10 rounded-md text-xs font-mono text-slate-300 p-1.5 focus:border-fuchsia-500/50 focus:ring-1 focus:ring-fuchsia-500/50 outline-none transition-colors"
                              />
                            </div>
                          </div>
                          
                          {anuncio.comprobanteUrl && (
                            <a 
                              href={anuncio.comprobanteUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-[10px] text-fuchsia-500 hover:text-white uppercase tracking-widest font-mono transition-colors"
                            >
                               <ExternalLink className="w-3 h-3" /> Ver Comprobante
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="pt-3 mt-3 border-t border-white/10 flex gap-2">
                        <button 
                          onClick={() => updateStatus(anuncio.id, 'Aprobado')}
                          disabled={anuncio.estado === 'Aprobado'}
                          className="flex-1 py-2 px-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg font-bold font-mono text-[10px] uppercase tracking-widest transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                        >
                          <Check className="w-3 h-3" /> Aprobar
                        </button>
                        <button 
                          onClick={() => updateStatus(anuncio.id, 'Rechazado')}
                          disabled={anuncio.estado === 'Rechazado'}
                          className="flex-1 py-2 px-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg font-bold font-mono text-[10px] uppercase tracking-widest transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                        >
                          <X className="w-3 h-3" /> Rechazar
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setItemToDelete({id: anuncio.id, mediaUrl: anuncio.videoUrl}); }}
                          className="py-2 px-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/50 rounded-lg font-bold font-mono text-[10px] uppercase tracking-widest transition-colors flex items-center justify-center"
                          title="Eliminar permanentemente"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <BannerManager />
          )}
        </div>

        {/* Right Panel (TV Player Fixed) */}
        <div className="w-7/12 bg-black relative border-l border-slate-800 flex flex-col items-center justify-center p-8 overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-fuchsia-500/5 blur-[100px] pointer-events-none"></div>
          
          <div className="w-full flex flex-col justify-center items-center h-full">
            <div className="flex items-center justify-between w-full max-w-[280px] mb-6">
              <div className="flex items-center gap-2">
                <MonitorPlay className="w-5 h-5 text-fuchsia-500" />
                <h2 className="text-sm font-bold tracking-widest text-white uppercase font-mono">Tótems (En Vivo)</h2>
              </div>
              <button 
                onClick={handleRestartLoop}
                className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-fuchsia-500 transition-colors"
                title="Reiniciar Bucle"
              >
                <RefreshCcw className="w-4 h-4" />
              </button>
            </div>

            {/* Simulated Totem Structure */}
            <div className="shrink-0 flex justify-center items-center pb-8 transform origin-bottom">
              <div className="relative group perspective-1000">
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-[240px] h-12 bg-black/80 blur-[20px] rounded-[100%] transition-opacity duration-500 group-hover:opacity-70"></div>
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-[200px] h-6 bg-gradient-to-b from-slate-800 to-slate-950 rounded-b-2xl border-b-2 border-x-2 border-slate-700/50 z-0"></div>

                <div className="relative w-[280px] h-[520px] bg-slate-950 rounded-[2rem] border-x-[12px] border-y-[16px] border-slate-900 shadow-[0_20px_50px_rgba(0,0,0,0.8),inset_0_0_0_1px_rgba(255,255,255,0.1)] flex flex-col overflow-hidden z-10 transition-transform duration-500 ease-out group-hover:scale-[1.02] group-hover:-translate-y-2">
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 w-16 h-3 bg-black rounded-full border border-white/5 z-20 flex justify-center items-center">
                    <div className="w-1.5 h-1.5 bg-blue-500/30 rounded-full"></div>
                  </div>

                  <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/10 pointer-events-none z-20"></div>
                  <div className="absolute top-0 right-0 w-[150%] h-[150%] bg-gradient-to-b from-white/5 to-transparent transform -rotate-45 translate-x-1/3 -translate-y-1/2 pointer-events-none z-20"></div>

                  <div className="flex-1 w-full bg-black relative shadow-[inset_0_0_40px_rgba(0,0,0,0.8)] z-10 overflow-hidden">
                    {approvedAds.length > 0 ? (
                      <div className="relative w-full h-full bg-black overflow-hidden flex items-center justify-center">
                        {approvedAds.map((ad, idx) => {
                          const isActive = idx === currentVideoIndex;
                          const isImg = isMediaImage(ad);
                          const isNext = idx === (currentVideoIndex + 1) % approvedAds.length;
                          const mediaSrc = (isActive || isNext) ? ad.videoUrl : undefined;

                          return (
                            <div
                              key={`dt-${ad.id}-${idx}`}
                              className={`absolute inset-0 w-full h-full flex items-center justify-center transition-opacity duration-300 ${
                                isActive ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'
                              }`}
                            >
                              {isImg ? (
                                <img 
                                  src={mediaSrc} 
                                  className="w-full h-full object-contain" 
                                  alt="Ad" 
                                />
                              ) : (
                                <video 
                                  ref={el => { videoRefs.current[idx] = el; }}
                                  src={mediaSrc}
                                  className="w-full h-full object-contain"
                                  preload={isActive ? "auto" : "metadata"}
                                  autoPlay={isActive && isPlaying}
                                  muted
                                  playsInline
                                  loop={approvedAds.length === 1}
                                  onCanPlay={(e) => {
                                    if (isActive && isPlaying) {
                                      e.currentTarget.play().catch(() => {});
                                    }
                                  }}
                                  onEnded={() => {
                                    if (isActive) handleVideoEnded();
                                  }}
                                  onError={() => {
                                    if (isActive) handleVideoEnded();
                                  }}
                                />
                              )}
                              
                              {ad.qrLink && ad.qrLink.trim() !== '' && isActive && (
                                <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md p-2 rounded-xl border border-white/30 flex flex-col items-center gap-1.5 shadow-[0_10px_30px_rgba(0,0,0,0.6)] z-[60] transition-all duration-700 animate-in fade-in slide-in-from-top-4 scale-90 origin-top-right">
                                  <div className="bg-white p-1 rounded-lg shadow-inner">
                                    <QRCode value={ad.qrLink.trim()} size={50} />
                                  </div>
                                  <span className="text-white font-mono font-bold text-[6px] tracking-widest uppercase text-center drop-shadow-md max-w-[50px] leading-tight">
                                    ¡Escanea para visitar!
                                  </span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="w-full h-full flex flex-col justify-center items-center text-slate-500 font-mono text-xs uppercase tracking-widest p-6 text-center">
                        <MonitorPlay className="w-10 h-10 mb-3 opacity-50" />
                        No hay anuncios aprobados en cola
                      </div>
                    )}
                  </div>
                  
                  <div className="h-10 bg-slate-950 flex items-center justify-center border-t border-white/5 z-20 relative">
                    <span className="text-[9px] font-bold tracking-[0.2em] text-slate-500/50 uppercase">AdSync Network</span>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-fuchsia-500 shadow-[0_0_8px_rgba(217,70,239,1)] animate-pulse"></div>
                  </div>
                </div>

                <div className="absolute -right-20 top-1/2 -translate-y-1/2 flex flex-col gap-4 bg-slate-900/80 backdrop-blur-md p-3 rounded-2xl border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)] z-30">
                  <button 
                    onClick={handlePrevVideo}
                    disabled={approvedAds.length <= 1}
                    className="p-3 bg-white/5 hover:bg-fuchsia-500/20 hover:text-fuchsia-500 text-slate-400 rounded-xl transition-all disabled:opacity-30 group"
                    title="Anuncio Anterior"
                  >
                    <ChevronUp className="w-6 h-6 group-hover:-translate-y-1 transition-transform" />
                  </button>
                  <button 
                    onClick={togglePlay}
                    disabled={approvedAds.length === 0}
                    className="p-3 bg-white/5 hover:bg-fuchsia-500/20 hover:text-fuchsia-500 text-white rounded-xl transition-all disabled:opacity-30"
                    title={isPlaying ? "Pausar" : "Reproducir"}
                  >
                    {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                  </button>
                  <button 
                    onClick={handleNextVideo}
                    disabled={approvedAds.length <= 1}
                    className="p-3 bg-white/5 hover:bg-fuchsia-500/20 hover:text-fuchsia-500 text-slate-400 rounded-xl transition-all disabled:opacity-30 group"
                    title="Siguiente Anuncio"
                  >
                    <ChevronDown className="w-6 h-6 group-hover:translate-y-1 transition-transform" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    {/* MOBILE VIEW (TikTok / Instagram Reels style + Bottom Navbar) */}
      <div className="flex md:hidden flex-col h-full w-full relative overflow-hidden bg-slate-950">
        {/* Mobile Header */}
        <div className="h-14 bg-slate-950/95 backdrop-blur-md border-b border-white/10 px-4 flex items-center justify-between shrink-0 z-30">
          <h1 className="text-lg font-bold tracking-widest text-fuchsia-500 uppercase drop-shadow-[0_0_10px_rgba(217,70,239,0.8)]">
            Panel Adm.
          </h1>
          <div className="flex items-center gap-2">
              <button
                onClick={handleInstallClick}
                className="flex items-center gap-1.5 bg-emerald-500/10 active:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold tracking-wider"
                title="Instalar App"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Instalar</span>
              </button>
            <button
              onClick={() => setShowProblematicModal(true)}
              className="flex items-center gap-1.5 bg-rose-500/10 active:bg-rose-500/20 text-rose-400 border border-rose-500/30 px-2.5 py-1 rounded-lg text-xs font-mono"
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>({problematicAds.length})</span>
            </button>
            <button
              onClick={() => signOut(auth)}
              className="p-1.5 text-slate-400 hover:text-rose-400 border border-white/10 rounded-lg active:bg-rose-500/10"
              title="Salir"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile Main Body */}
        <div className="flex-1 w-full bg-black relative overflow-hidden">
          {activeTab === 'anuncios' && (
            loading ? (
              <div className="flex justify-center items-center h-full w-full">
                <div className="w-10 h-10 border-4 border-fuchsia-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : validAdsForReview.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                <Video className="w-12 h-12 text-slate-600 mb-3" />
                <p className="text-slate-400 font-mono text-sm">No hay anuncios para revisión</p>
                <button 
                  onClick={() => setShowFastUpload(true)}
                  className="mt-4 px-4 py-2 bg-fuchsia-500 text-white rounded-xl font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-[0_0_15px_rgba(217,70,239,0.5)]"
                >
                  <Zap className="w-4 h-4" /> Cargar Nuevo Anuncio
                </button>
              </div>
            ) : (
              <div className="w-full h-full snap-y snap-mandatory overflow-y-auto scroll-smooth">
                {validAdsForReview.map((anuncio, index) => (
                  <div key={anuncio.id} className="w-full h-[calc(100vh-3.5rem-4rem)] snap-start snap-always relative flex flex-col justify-between overflow-hidden bg-black border-b border-white/10">
                    {/* Background Media */}
                    <div className="absolute inset-0 w-full h-full z-0 flex items-center justify-center bg-slate-950">
                      {isMediaImage(anuncio) ? (
                        <img src={anuncio.videoUrl} className="w-full h-full object-contain" alt="Anuncio" />
                      ) : anuncio.videoUrl ? (
                        <video 
                          src={anuncio.videoUrl} 
                          className="w-full h-full object-contain"
                          autoPlay
                          muted
                          loop
                          playsInline
                        />
                      ) : (
                        <div className="text-slate-600 flex flex-col items-center">
                          <Video className="w-12 h-12 mb-2 opacity-50" />
                          <span className="text-xs font-mono">Sin media</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black/90 pointer-events-none z-10" />
                    </div>

                    {/* Top Overlay */}
                    <div className="relative z-20 p-4 flex items-start justify-between gap-2">
                      <div className="bg-black/70 backdrop-blur-md px-3 py-2 rounded-xl border border-white/15 shadow-lg">
                        <div className="font-mono font-bold text-sm text-white">{anuncio.telefono}</div>
                        <div className="text-[10px] text-fuchsia-400 font-mono font-bold uppercase tracking-wider mt-0.5">{anuncio.planElegido || 'Sin Plan'}</div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 backdrop-blur-md shadow-lg ${
                          anuncio.estado === 'Pendiente' ? 'bg-yellow-500/30 text-yellow-300 border border-yellow-500/50' :
                          anuncio.estado === 'Aprobado' ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/50' :
                          'bg-rose-500/30 text-rose-300 border border-rose-500/50'
                        }`}>
                          {anuncio.estado === 'Pendiente' && <Clock className="w-3 h-3" />}
                          {anuncio.estado === 'Aprobado' && <Check className="w-3 h-3" />}
                          {anuncio.estado === 'Rechazado' && <X className="w-3 h-3" />}
                          {anuncio.estado}
                        </div>

                        <div className="flex flex-col gap-1 bg-black/70 backdrop-blur-md p-1 rounded-lg border border-white/15">
                          <button 
                            onClick={() => handleMoveOrder(index, 'up')}
                            disabled={index === 0}
                            className="p-1 bg-white/10 hover:bg-fuchsia-500/30 text-white rounded disabled:opacity-30"
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => handleMoveOrder(index, 'down')}
                            disabled={index === validAdsForReview.length - 1}
                            className="p-1 bg-white/10 hover:bg-fuchsia-500/30 text-white rounded disabled:opacity-30"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Controls Overlay */}
                    <div className="relative z-20 p-4 pb-2 flex flex-col gap-3">
                      <div className="grid grid-cols-2 gap-2 bg-black/80 backdrop-blur-md p-2.5 rounded-xl border border-white/15">
                        <div>
                          <label className="text-[9px] text-slate-400 uppercase tracking-widest font-mono mb-0.5 block">Efecto</label>
                          <select 
                            value={anuncio.transicion || 'blur'}
                            onChange={(e) => handleTransitionChange(anuncio.id, e.target.value as TransitionType)}
                            className="w-full bg-slate-900 border border-white/20 rounded-lg text-xs font-mono text-slate-200 p-1.5 focus:border-fuchsia-500 outline-none"
                          >
                            <option value="blur">Blur</option>
                            <option value="flash">Flash</option>
                            <option value="slide">Slide</option>
                            <option value="flip">Flip 3D</option>
                          </select>
                        </div>

                        {isMediaImage(anuncio) ? (
                          <div>
                            <label className="text-[9px] text-slate-400 uppercase tracking-widest font-mono mb-0.5 block">Duración</label>
                            <select 
                              value={anuncio.duracion || 10}
                              onChange={(e) => handleDurationChange(anuncio.id, Number(e.target.value))}
                              className="w-full bg-slate-900 border border-white/20 rounded-lg text-xs font-mono text-slate-200 p-1.5 focus:border-fuchsia-500 outline-none"
                            >
                              <option value={5}>5 seg</option>
                              <option value={10}>10 seg</option>
                              <option value={15}>15 seg</option>
                              <option value={20}>20 seg</option>
                              <option value={30}>30 seg</option>
                            </select>
                          </div>
                        ) : anuncio.comprobanteUrl ? (
                          <div className="flex items-end">
                            <a 
                              href={anuncio.comprobanteUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="w-full h-8 flex items-center justify-center gap-1 text-[11px] text-fuchsia-400 bg-fuchsia-500/10 border border-fuchsia-500/30 rounded-lg font-mono uppercase font-bold"
                            >
                               <ExternalLink className="w-3 h-3" /> Comprobante
                            </a>
                          </div>
                        ) : null}
                        <div className="col-span-2">
                          <label className="text-[9px] text-slate-400 uppercase tracking-widest font-mono mb-0.5 block">Link (Web/Instagram)</label>
                          <input 
                            type="url"
                            placeholder="https://..."
                            defaultValue={anuncio.qrLink || ''}
                            onBlur={(e) => {
                              if (e.target.value !== anuncio.qrLink) {
                                handleQrLinkChange(anuncio.id, e.target.value);
                              }
                            }}
                            className="w-full bg-slate-900 border border-white/20 rounded-lg text-xs font-mono text-slate-200 p-1.5 focus:border-fuchsia-500 outline-none"
                          />
                        </div>
                      </div>

                      {/* Approve / Reject / Delete buttons */}
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => updateStatus(anuncio.id, 'Aprobado')}
                          disabled={anuncio.estado === 'Aprobado'}
                          className="flex-1 py-2.5 px-2 bg-emerald-500/20 active:bg-emerald-500/40 text-emerald-300 border border-emerald-500/40 rounded-xl font-bold font-mono text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 backdrop-blur-md disabled:opacity-40"
                        >
                          <Check className="w-4 h-4" /> Aprobar
                        </button>
                        <button 
                          onClick={() => updateStatus(anuncio.id, 'Rechazado')}
                          disabled={anuncio.estado === 'Rechazado'}
                          className="flex-1 py-2.5 px-2 bg-rose-500/20 active:bg-rose-500/40 text-rose-300 border border-rose-500/40 rounded-xl font-bold font-mono text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 backdrop-blur-md disabled:opacity-40"
                        >
                          <X className="w-4 h-4" /> Rechazar
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setItemToDelete({id: anuncio.id, mediaUrl: anuncio.videoUrl}); }}
                          className="py-2.5 px-3 bg-red-500/20 active:bg-red-500/40 text-red-400 border border-red-500/40 rounded-xl font-bold font-mono text-xs flex items-center justify-center backdrop-blur-md"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {activeTab === 'banners' && (
            <div className="h-full w-full bg-slate-950 overflow-y-auto p-4">
              <BannerManager />
            </div>
          )}

          {activeTab === 'admins' && (
            <div className="h-full w-full bg-slate-950 overflow-y-auto p-4">
              <AdminManager />
            </div>
          )}

          {activeTab === 'totem' && (
            <div className="h-full w-full bg-black overflow-y-auto p-4 flex flex-col items-center justify-center relative">
              <div className="flex items-center justify-between w-full max-w-[280px] mb-4">
                <div className="flex items-center gap-2">
                  <MonitorPlay className="w-5 h-5 text-fuchsia-500" />
                  <h2 className="text-sm font-bold tracking-widest text-white uppercase font-mono">Tótem (En Vivo)</h2>
                </div>
                <button 
                  onClick={handleRestartLoop}
                  className="p-2 rounded-full bg-white/10 text-fuchsia-500"
                  title="Reiniciar"
                >
                  <RefreshCcw className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={() => setTvMode(true)}
                className="mb-6 flex items-center gap-2 bg-[#CCFF00] text-black font-bold px-4 py-2.5 rounded-xl text-xs font-mono tracking-wider shadow-[0_0_20px_rgba(204,255,0,0.5)] active:scale-95"
              >
                <MonitorPlay className="w-4 h-4" />
                LANZAR MODO TV COMPLETO
              </button>

              <div className="relative w-[200px] h-[360px] bg-slate-950 rounded-2xl border-4 border-slate-900 shadow-2xl flex flex-col overflow-hidden">
                <div className="flex-1 w-full bg-black relative overflow-hidden flex items-center justify-center">
                  {approvedAds.length > 0 ? (
                    <div className="relative w-full h-full bg-black overflow-hidden flex items-center justify-center">
                      {approvedAds.map((ad, idx) => {
                        const isActive = idx === currentVideoIndex;
                        const isImg = isMediaImage(ad);
                        const isNext = idx === (currentVideoIndex + 1) % approvedAds.length;
                        const mediaSrc = (isActive || isNext) ? ad.videoUrl : undefined;

                        return (
                          <div
                            key={`mb-${ad.id}-${idx}`}
                            className={`absolute inset-0 w-full h-full flex items-center justify-center transition-opacity duration-300 ${
                              isActive ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'
                            }`}
                          >
                            {isImg ? (
                              <img 
                                src={mediaSrc} 
                                className="w-full h-full object-contain" 
                                alt="Ad" 
                              />
                            ) : (
                              <video 
                                ref={el => { videoRefs.current[idx + approvedAds.length] = el; }}
                                src={mediaSrc}
                                className="w-full h-full object-contain"
                                preload={isActive ? "auto" : "metadata"}
                                autoPlay={isActive && isPlaying}
                                muted
                                playsInline
                                loop={approvedAds.length === 1}
                                onCanPlay={(e) => {
                                  if (isActive && isPlaying) {
                                    e.currentTarget.play().catch(() => {});
                                  }
                                }}
                                onEnded={() => {
                                  if (isActive) handleVideoEnded();
                                }}
                                onError={() => {
                                  if (isActive) handleVideoEnded();
                                }}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-slate-500 font-mono text-xs">
                      No hay anuncios aprobados
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4 mt-6 bg-slate-900 p-3 rounded-2xl border border-white/10">
                <button 
                  onClick={handlePrevVideo} 
                  disabled={approvedAds.length <= 1}
                  className="p-3 bg-white/5 text-slate-300 rounded-xl disabled:opacity-30"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button 
                  onClick={togglePlay} 
                  disabled={approvedAds.length === 0}
                  className="p-3 bg-fuchsia-500/20 text-fuchsia-400 border border-fuchsia-500/40 rounded-xl"
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                </button>
                <button 
                  onClick={handleNextVideo} 
                  disabled={approvedAds.length <= 1}
                  className="p-3 bg-white/5 text-slate-300 rounded-xl disabled:opacity-30"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Mobile Fixed Bottom Navigation Bar */}
        <div className="h-16 bg-slate-900/95 backdrop-blur-md border-t border-white/15 shrink-0 z-40 flex items-center justify-around px-2">
          {/* Anuncios */}
          <button
            onClick={() => setActiveTab('anuncios')}
            className={`flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${
              activeTab === 'anuncios' 
                ? 'text-fuchsia-400 font-bold bg-fuchsia-500/10 border border-fuchsia-500/30' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Video className="w-5 h-5" />
            <span className="text-[10px] font-mono tracking-wider">Anuncios</span>
          </button>

          {/* Banners */}
          <button
            onClick={() => setActiveTab('banners')}
            className={`flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${
              activeTab === 'banners' 
                ? 'text-fuchsia-400 font-bold bg-fuchsia-500/10 border border-fuchsia-500/30' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Images className="w-5 h-5" />
            <span className="text-[10px] font-mono tracking-wider">Banners</span>
          </button>

          {/* Admins */}
          <button
            onClick={() => setActiveTab('admins')}
            className={`flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${
              activeTab === 'admins' 
                ? 'text-fuchsia-400 font-bold bg-fuchsia-500/10 border border-fuchsia-500/30' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield className="w-5 h-5" />
            <span className="text-[10px] font-mono tracking-wider">Admins</span>
          </button>

          {/* Cargar Button */}
          <button
            onClick={() => setShowFastUpload(true)}
            className="flex flex-col items-center justify-center gap-0.5 px-3.5 py-1.5 bg-fuchsia-600 active:bg-fuchsia-500 text-white rounded-xl shadow-[0_0_15px_rgba(217,70,239,0.5)] active:scale-95 transition-all"
          >
            <Zap className="w-5 h-5 text-yellow-300 fill-yellow-300" />
            <span className="text-[10px] font-mono font-bold tracking-wider uppercase">Cargar</span>
          </button>

          {/* Tótem */}
          <button
            onClick={() => setActiveTab('totem')}
            className={`flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${
              activeTab === 'totem' 
                ? 'text-fuchsia-400 font-bold bg-fuchsia-500/10 border border-fuchsia-500/30' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <MonitorPlay className="w-5 h-5" />
            <span className="text-[10px] font-mono tracking-wider">Tótem</span>
          </button>
        </div>
      </div>

      {/* Problematic Ads Modal */}
      <AnimatePresence>
        {showProblematicModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowProblematicModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            >
              {/* Modal Header */}
              <div className="p-4 border-b border-white/10 flex items-center justify-between bg-slate-950">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-rose-500/20 flex items-center justify-center border border-rose-500/30">
                    <AlertCircle className="w-4 h-4 text-rose-400" />
                  </div>
                  <div>
                    <h3 className="font-bold font-mono tracking-widest text-slate-200">Anuncios Incompletos o Rechazados</h3>
                    <p className="text-[10px] text-slate-500 font-mono tracking-wider">Falta video, plan, comprobante o fueron rechazados.</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowProblematicModal(false)}
                  className="p-2 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-4 overflow-y-auto flex flex-col gap-3 custom-scrollbar flex-1 bg-[#020617]">
                {problematicAds.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-40 text-slate-500">
                    <Check className="w-8 h-8 mb-2 opacity-50" />
                    <p className="font-mono text-xs uppercase tracking-widest">Bandeja limpia</p>
                  </div>
                ) : (
                  problematicAds.map(anuncio => (
                    <div key={anuncio.id} className="bg-slate-900/50 border border-rose-500/20 rounded-xl p-3 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                      
                      <div className="flex-1">
                        <div className="font-mono font-bold text-slate-300">{anuncio.telefono}</div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-widest font-mono mt-1">
                          {anuncio.planElegido || 'Sin Plan'}
                        </div>
                        
                        <div className="flex flex-wrap gap-2 mt-3">
                          {!anuncio.videoUrl && (
                            <span className="px-2 py-1 bg-yellow-500/10 text-yellow-500/70 border border-yellow-500/20 rounded text-[9px] font-mono uppercase tracking-widest">Sin Video</span>
                          )}
                          {(!anuncio.planElegido || anuncio.planElegido === 'Ninguno') && (
                            <span className="px-2 py-1 bg-yellow-500/10 text-yellow-500/70 border border-yellow-500/20 rounded text-[9px] font-mono uppercase tracking-widest">Sin Plan</span>
                          )}
                          {!anuncio.comprobanteUrl && (
                            <span className="px-2 py-1 bg-yellow-500/10 text-yellow-500/70 border border-yellow-500/20 rounded text-[9px] font-mono uppercase tracking-widest">Sin Comprobante</span>
                          )}
                          {anuncio.estado === 'Rechazado' && (
                            <span className="px-2 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/30 rounded text-[9px] font-mono uppercase tracking-widest flex items-center gap-1">
                              <X className="w-3 h-3" /> Rechazado
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button 
                          onClick={() => updateStatus(anuncio.id, 'Pendiente')}
                          disabled={anuncio.estado === 'Pendiente'}
                          className="flex-1 sm:flex-none py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg font-bold font-mono text-[10px] uppercase tracking-widest transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                        >
                          <RefreshCcw className="w-3 h-3" /> Restablecer
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setItemToDelete({id: anuncio.id, mediaUrl: anuncio.videoUrl}); }}
                          className="py-1.5 px-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg font-bold font-mono text-[10px] uppercase tracking-widest transition-colors flex items-center justify-center gap-1"
                          title="Eliminar Anuncio"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>

                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      <FastUploadModal 
        isOpen={showFastUpload} 
        onClose={() => setShowFastUpload(false)} 
        onSuccess={() => showToastMsg('¡Anuncio publicado en vivo!')} 
      />

      
      <AnimatePresence>
        {itemToDelete && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setItemToDelete(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-sm bg-slate-900 border border-red-500/30 rounded-2xl shadow-[0_0_40px_rgba(239,68,68,0.15)] overflow-hidden flex flex-col p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center border border-red-500/30 shrink-0">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                </div>
                <h3 className="font-bold font-mono tracking-widest text-red-400 uppercase text-sm">Confirmar Eliminación</h3>
              </div>
              <p className="text-slate-300 text-sm font-mono mb-6">
                ¿Estás seguro de eliminar este anuncio permanentemente? Esta acción liberará espacio en el servidor y no se puede deshacer.
              </p>
              <div className="flex gap-3 justify-end">
                <button 
                  onClick={() => setItemToDelete(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-mono uppercase tracking-widest transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={() => executeDelete(itemToDelete.id, itemToDelete.mediaUrl)}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-mono uppercase tracking-widest transition-colors font-bold shadow-[0_0_10px_rgba(239,68,68,0.4)]"
                >
                  Sí, Eliminar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast.show && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 right-6 bg-fuchsia-500 text-white px-4 py-3 rounded-xl shadow-[0_0_20px_rgba(217,70,239,0.6)] flex items-center gap-2 font-mono text-sm z-50"
          >
            <Check className="w-5 h-5" />
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}