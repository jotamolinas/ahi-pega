import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';

import { Link } from 'react-router-dom';
import { Upload, Smartphone, ShieldCheck, TrendingUp, ChevronRight, Check } from 'lucide-react';

export function LandingPage() {
  const [bannersData, setBannersData] = useState<any>(null);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'configuracion', 'banners_landing'), (docSnap) => {
      if (docSnap.exists()) {
        setBannersData(docSnap.data());
      }
    });
    return () => unsub();
  }, []);

  const renderVideoBanner = (videoUrl: string, linkUrl: string, defaultText: string, objectPosition: string = 'object-center', type?: 'image' | 'video') => {
    const isImage = type === 'image' || (type === undefined && videoUrl && videoUrl.match(/\.(jpeg|jpg|gif|png|webp|svg)(\?.*)?$/i));
    if (!videoUrl) {
      return (
        <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-pink-500 to-fuchsia-600 animate-pulse flex items-center justify-center rounded-xl shadow-[0_0_20px_rgba(217,70,239,0.4)]">
          <span className="text-white font-bold font-mono text-sm sm:text-base uppercase tracking-widest px-4 text-center">
            {bannersData === null ? 'Cargando Anuncio...' : 'Espacio Disponible'}
          </span>
        </div>
      );
    }
    
    const content = isImage ? (
      <img
        src={videoUrl}
        alt="Banner"
        className={`absolute inset-0 w-full h-full object-contain ${objectPosition} z-0 group-hover:scale-105 transition-transform duration-700 drop-shadow-[0_0_15px_rgba(255,0,127,0.6)]`}
      />
    ) : (
      <video
        autoPlay
        loop
        muted
        playsInline
        controls={false}
        className={`absolute inset-0 w-full h-full object-contain ${objectPosition} z-0 group-hover:scale-105 transition-transform duration-700 drop-shadow-[0_0_15px_rgba(255,0,127,0.6)]`}
      >
        <source src={videoUrl} type="video/mp4" />
      </video>
    );
    
    if (linkUrl) {
      return (
        <a href={linkUrl} target="_blank" rel="noopener noreferrer" className="absolute inset-0 w-full h-full block">
          {content}
        </a>
      );
    }
    
    return content;
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-fuchsia-500/30">
      
      {/* Navbar */}
      <nav className="w-full border-b border-fuchsia-500/20 bg-black fixed top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={bannersData?.logoUrl || 'https://firebasestorage.googleapis.com/v0/b/ahi-pega.firebasestorage.app/o/AHI%20PEGA.png?alt=media'} alt="Ahí Pega!" className="h-12 w-auto object-contain drop-shadow-[0_0_15px_rgba(255,0,127,1)] mix-blend-screen rounded-xl shadow-[0_0_20px_rgba(217,70,239,0.4)]" referrerPolicy="no-referrer" />
            <span className="font-bold text-xl tracking-tight text-white">Ahí Pega!</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/portal" className="text-sm font-medium text-slate-300 hover:text-white transition-colors border border-fuchsia-500/30 hover:border-fuchsia-500/60 px-4 py-1.5 rounded-full hover:bg-fuchsia-500/10">
              Acceso Clientes
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col items-center text-center relative mt-8">
        {/* Glow Effects */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-full max-w-2xl h-64 bg-[#FF007F]/20 blur-[120px] rounded-full pointer-events-none -z-10"></div>
        
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight mb-6 text-transparent bg-clip-text bg-gradient-to-r from-[#FFA6F6] via-[#FF007F] to-[#6A004F] drop-shadow-[0_0_30px_rgba(255,0,127,0.4)]">
          TU MARCA,<br /> <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#FFA6F6] via-[#FF007F] to-[#6A004F]">EN TODAS PARTES</span>
        </h1>
        
        <p className="text-base sm:text-lg md:text-xl text-slate-300 max-w-3xl mb-10 leading-relaxed">
          La red de pantallas verticales más innovadora. Sube tu video, previsualiza tu anuncio y lanza tu campaña en minutos.
        </p>
        
        <Link 
          to="/portal" 
          className="group relative inline-flex items-center justify-center px-8 py-4 font-bold text-white bg-gradient-to-r from-[#FFA6F6] via-[#FF007F] to-[#6A004F] rounded-full overflow-hidden shadow-[0_0_30px_rgba(255,0,127,0.5)] hover:shadow-[0_0_50px_rgba(255,0,127,0.7)] transition-all duration-300 hover:scale-105"
        >
          <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-[#6A004F] via-[#FF007F] to-[#FFA6F6] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
          <span className="relative flex items-center gap-2 text-lg">
            Lanzar mi Anuncio <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </span>
        </Link>
      </section>

      {/* BANNER TOP #1 */}
      <section className="w-full px-4 my-8 md:my-12">
        <div className="w-full h-[120px] md:h-[220px] max-w-7xl mx-auto flex flex-col items-center justify-center text-center p-4 relative overflow-visible transition-all cursor-pointer group">
          {renderVideoBanner(bannersData?.top?.videoUrl, bannersData?.top?.redirectUrl, '¡Anuncia aquí!', 'object-center', bannersData?.top?.type)}
          {!bannersData?.top?.videoUrl && (
            <>
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors z-10 pointer-events-none"></div>
              <span className="text-white font-extrabold uppercase tracking-widest text-lg sm:text-2xl relative z-20 drop-shadow-md group-hover:scale-105 transition-transform">¡Anuncia aquí!</span>
            </>
          )}
        </div>
      </section>

      {/* Services Section */}
      <section className="py-8 sm:py-20 px-4 sm:px-6 lg:px-8 bg-slate-950 relative z-10 border-y border-[#FF007F]/20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-6 sm:mb-16">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFA6F6] via-[#FF007F] to-[#6A004F]">PUBLICIDAD SIN FRICCIÓN</span>
            </h2>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            {/* Card 1 */}
            <div className="bg-black/50 border border-[#FF007F]/20 rounded-xl p-3 sm:p-6 flex flex-col items-center text-center hover:border-[#FF007F]/50 transition-all hover:shadow-[0_0_30px_rgba(255,0,127,0.2)] group">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#FF007F]/10 flex items-center justify-center mb-2 sm:mb-4 group-hover:scale-110 transition-transform">
                <Upload className="w-5 h-5 sm:w-7 sm:h-7 text-[#FF007F]" />
              </div>
              <h3 className="text-xs sm:text-lg font-bold mb-1 sm:mb-2 text-white">Sube tu Video</h3>
              <p className="text-slate-400 text-[10px] sm:text-sm leading-relaxed">Formato vertical ideal para captar toda la atención.</p>
            </div>
            
            {/* Card 2 */}
            <div className="bg-black/50 border border-[#FF007F]/20 rounded-xl p-3 sm:p-6 flex flex-col items-center text-center hover:border-[#FF007F]/50 transition-all hover:shadow-[0_0_30px_rgba(255,0,127,0.2)] group">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#FF007F]/10 flex items-center justify-center mb-2 sm:mb-4 group-hover:scale-110 transition-transform">
                <Smartphone className="w-5 h-5 sm:w-7 sm:h-7 text-[#FF007F]" />
              </div>
              <h3 className="text-xs sm:text-lg font-bold mb-1 sm:mb-2 text-white">Previsualiza</h3>
              <p className="text-slate-400 text-[10px] sm:text-sm leading-relaxed">Míralo en un tótem real de forma interactiva.</p>
            </div>

            {/* Card 3 */}
            <div className="bg-black/50 border border-[#FF007F]/20 rounded-xl p-3 sm:p-6 flex flex-col items-center text-center hover:border-[#FF007F]/50 transition-all hover:shadow-[0_0_30px_rgba(255,0,127,0.2)] group">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#FF007F]/10 flex items-center justify-center mb-2 sm:mb-4 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-5 h-5 sm:w-7 sm:h-7 text-[#FF007F]" />
              </div>
              <h3 className="text-xs sm:text-lg font-bold mb-1 sm:mb-2 text-white">Paga seguro</h3>
              <p className="text-slate-400 text-[10px] sm:text-sm leading-relaxed">Verificación rápida y transparente del comprobante.</p>
            </div>

            {/* Card 4 */}
            <div className="bg-black/50 border border-[#FF007F]/20 rounded-xl p-3 sm:p-6 flex flex-col items-center text-center hover:border-[#FF007F]/50 transition-all hover:shadow-[0_0_30px_rgba(255,0,127,0.2)] group">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#FF007F]/10 flex items-center justify-center mb-2 sm:mb-4 group-hover:scale-110 transition-transform">
                <TrendingUp className="w-5 h-5 sm:w-7 sm:h-7 text-[#FF007F]" />
              </div>
              <h3 className="text-xs sm:text-lg font-bold mb-1 sm:mb-2 text-white">Expande tu marca</h3>
              <p className="text-slate-400 text-[10px] sm:text-sm leading-relaxed">Llega a miles de personas en puntos estratégicos.</p>
            </div>
          </div>
        </div>
      </section>

      {/* BANNER MID #2 */}
      <section className="w-full px-4 my-8 md:my-12">
        <div className="w-full h-[120px] md:h-[220px] max-w-7xl mx-auto flex flex-col items-center justify-center text-center px-4 relative overflow-visible transition-all cursor-pointer group">
          {renderVideoBanner(bannersData?.mid?.videoUrl, bannersData?.mid?.redirectUrl, '¡Anuncia aquí!', 'object-center', bannersData?.mid?.type)}
          {!bannersData?.mid?.videoUrl && (
            <>
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors z-10 pointer-events-none"></div>
              <span className="text-white font-extrabold uppercase tracking-widest text-xl sm:text-3xl mb-2 relative z-20 drop-shadow-md group-hover:scale-105 transition-transform">¡Anuncia aquí!</span>
              <span className="text-white/80 font-medium text-sm sm:text-base relative z-20 group-hover:scale-105 transition-transform">Ideal para promociones de temporada</span>
            </>
          )}
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-8 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-6 sm:mb-16">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4 text-white">Planes de Inversión</h2>
          <p className="text-slate-400 max-w-2xl mx-auto">Elige el nivel de exposición que tu marca necesita.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-8 items-center max-w-5xl mx-auto">
          {/* Presencia */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 sm:p-8 hover:border-[#FF007F]/40 hover:shadow-[0_0_30px_rgba(255,0,127,0.15)] transition-all flex flex-col sm:flex-col h-full">
            <div className="flex flex-row sm:flex-col justify-between items-center sm:items-start mb-2 sm:mb-0">
              <h3 className="text-base sm:text-xl font-medium text-slate-300 mb-0 sm:mb-2">Presencia</h3>
              <div className="flex items-baseline gap-2 mb-0 sm:mb-6">
                <span className="text-2xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#FFA6F6] via-[#FF007F] to-[#6A004F]">$50</span>
                <span className="text-slate-500 text-xs sm:text-sm">/ mes</span>
              </div>
            </div>
            <ul className="flex-1 space-y-1 sm:space-y-4 mb-3 sm:mb-8 text-xs sm:text-base hidden sm:block">
              <li className="flex items-center gap-2 sm:gap-3 text-slate-300">
                <Check className="w-4 h-4 sm:w-5 sm:h-5 text-[#FF007F] shrink-0" strokeWidth={3} />
                <span>6 veces por hora</span>
              </li>
              <li className="flex items-center gap-2 sm:gap-3 text-slate-300">
                <Check className="w-4 h-4 sm:w-5 sm:h-5 text-[#FF007F] shrink-0" strokeWidth={3} />
                <span>Rotación estándar</span>
              </li>
            </ul>
            <Link to="/portal" className="w-full py-2 sm:py-3 px-4 rounded-xl font-bold text-center border border-[#FF007F]/50 text-[#FFA6F6] hover:bg-[#FF007F]/20 hover:shadow-[0_0_15px_rgba(255,0,127,0.3)] transition-all text-xs sm:text-base mt-2 sm:mt-0">Seleccionar</Link>
          </div>

          {/* PRIME */}
          <div className="bg-slate-900 border-2 border-[#FF007F] rounded-2xl p-4 sm:p-8 relative transform md:-translate-y-4 shadow-[0_0_40px_rgba(255,0,127,0.4)] flex flex-col sm:flex-col h-full min-h-[auto] md:min-h-[420px]">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-[#FFA6F6] via-[#FF007F] to-[#6A004F] text-white px-3 sm:px-4 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-widest shadow-[0_0_20px_rgba(255,0,127,0.6)]">Recomendado</div>
            <div className="flex flex-row sm:flex-col justify-between items-center sm:items-start mb-2 sm:mb-0">
              <h3 className="text-base sm:text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#FFA6F6] via-[#FF007F] to-[#6A004F] mb-0 sm:mb-2">PRIME</h3>
              <div className="flex items-baseline gap-2 mb-0 sm:mb-6">
                <span className="text-3xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#FFA6F6] via-[#FF007F] to-[#6A004F]">$100</span>
                <span className="text-slate-400 text-xs sm:text-sm">/ mes</span>
              </div>
            </div>
            <ul className="flex-1 space-y-1 sm:space-y-4 mb-3 sm:mb-8 text-xs sm:text-base hidden sm:block">
              <li className="flex items-center gap-2 sm:gap-3 text-white font-medium">
                <Check className="w-4 h-4 sm:w-5 sm:h-5 text-[#FF007F] shrink-0" strokeWidth={3} />
                <span>Horarios Pico</span>
              </li>
              <li className="flex items-center gap-2 sm:gap-3 text-slate-300">
                <Check className="w-4 h-4 sm:w-5 sm:h-5 text-[#FF007F] shrink-0" strokeWidth={3} />
                <span>15 veces por hora</span>
              </li>
              <li className="flex items-center gap-2 sm:gap-3 text-slate-300">
                <Check className="w-4 h-4 sm:w-5 sm:h-5 text-[#FF007F] shrink-0" strokeWidth={3} />
                <span>Soporte prioritario</span>
              </li>
            </ul>
            <Link to="/portal" className="w-full mt-auto py-2.5 sm:py-4 px-4 rounded-xl font-bold text-center bg-gradient-to-r from-[#FFA6F6] via-[#FF007F] to-[#6A004F] text-white shadow-[0_0_30px_rgba(255,0,127,0.5)] hover:shadow-[0_0_45px_rgba(255,0,127,0.7)] transition-all text-xs sm:text-base mt-2 sm:mt-0">Destacar mi Marca</Link>
          </div>

          {/* Dominio */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 sm:p-8 hover:border-[#FF007F]/40 hover:shadow-[0_0_30px_rgba(255,0,127,0.15)] transition-all flex flex-col sm:flex-col h-full">
            <div className="flex flex-row sm:flex-col justify-between items-center sm:items-start mb-2 sm:mb-0">
              <h3 className="text-base sm:text-xl font-medium text-slate-300 mb-0 sm:mb-2">Dominio</h3>
              <div className="flex items-baseline gap-2 mb-0 sm:mb-6">
                <span className="text-2xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#FFA6F6] via-[#FF007F] to-[#6A004F]">$300</span>
                <span className="text-slate-500 text-xs sm:text-sm">/ mes</span>
              </div>
            </div>
            <ul className="flex-1 space-y-1 sm:space-y-4 mb-3 sm:mb-8 text-xs sm:text-base hidden sm:block">
              <li className="flex items-center gap-2 sm:gap-3 text-slate-300">
                <Check className="w-4 h-4 sm:w-5 sm:h-5 text-[#FF007F] shrink-0" strokeWidth={3} />
                <span className="font-bold text-white">Exclusividad total</span>
              </li>
              <li className="flex items-center gap-2 sm:gap-3 text-slate-300">
                <Check className="w-4 h-4 sm:w-5 sm:h-5 text-[#FF007F] shrink-0" strokeWidth={3} />
                <span>30+ veces por hora</span>
              </li>
            </ul>
            <Link to="/portal" className="w-full py-2 sm:py-3 px-4 rounded-xl font-bold text-center border border-[#FF007F]/50 text-[#FFA6F6] hover:bg-[#FF007F]/20 hover:shadow-[0_0_15px_rgba(255,0,127,0.3)] transition-all text-xs sm:text-base mt-2 sm:mt-0">Seleccionar</Link>
          </div>
        </div>
      </section>

      {/* BANNER FOOTER #3 */}
      <section className="w-full px-4 my-8 md:my-12">
        <div className="w-full h-[120px] md:h-[220px] max-w-7xl mx-auto flex items-center justify-center text-center p-4 relative overflow-visible transition-all cursor-pointer group">
          {renderVideoBanner(bannersData?.footer?.videoUrl, bannersData?.footer?.redirectUrl, '', 'object-center', bannersData?.footer?.type)}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#FF007F]/10 bg-black pt-12 pb-8 px-4 text-center">
        <div className="max-w-4xl mx-auto flex flex-col items-center">
          <img src={bannersData?.logoUrl || 'https://firebasestorage.googleapis.com/v0/b/ahi-pega.firebasestorage.app/o/AHI%20PEGA.png?alt=media'} alt="Ahí Pega!" className="h-16 w-auto sm:h-20 object-contain mb-6 drop-shadow-[0_0_30px_rgba(255,0,127,1)] mix-blend-screen rounded-xl shadow-[0_0_20px_rgba(217,70,239,0.4)]" referrerPolicy="no-referrer" />
          <h2 className="text-2xl font-bold text-white mb-2">Ahí Pega!</h2>
          <p className="text-slate-400 mb-8 max-w-md">Contáctanos para publicidad en la red. Lleva tu marca al siguiente nivel con nuestras pantallas verticales interactivas.</p>
          <div className="text-slate-600 text-sm">
            &copy; {new Date().getFullYear()} Ahí Pega! Todos los derechos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
}
