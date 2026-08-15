import React, { useState, useRef } from 'react';
import { CheckCircle, AlertTriangle, Loader2, ChevronDown, ChevronRight, Play, UploadCloud, Smartphone, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { VideoUploader } from './VideoUploader';
import { ReceiptUploader } from './ReceiptUploader';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';

const countryCodes = [
  { code: '+595', label: 'PY (+595)' },
  { code: '+54', label: 'AR (+54)' },
  { code: '+55', label: 'BR (+55)' },
  { code: '+56', label: 'CL (+56)' },
  { code: '+57', label: 'CO (+57)' },
  { code: '+58', label: 'VE (+58)' },
  { code: '+591', label: 'BO (+591)' },
  { code: '+593', label: 'EC (+593)' },
  { code: '+598', label: 'UY (+598)' },
  { code: '+51', label: 'PE (+51)' },
  { code: '+52', label: 'MX (+52)' },
  { code: '+1', label: 'US/CA (+1)' },
  { code: '+34', label: 'ES (+34)' },
];

export function ClientUpload() {
  const [currentStep, setCurrentStep] = useState(1);
  const [telefono, setTelefono] = useState('');
  const [countryCode, setCountryCode] = useState('+595');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [planElegido, setPlanElegido] = useState<{ nombre: string, precio: string } | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const portalRef = useRef<HTMLDivElement>(null);

  const handleNextStep = () => {
    setCurrentStep((prev) => Math.min(prev + 1, 5));
  };

  const handleMainSubmit = async (finalReceiptUrl?: string) => {
    setLoading(true);
    setError(null);
    
    try {
      await addDoc(collection(db, 'anuncios'), {
        telefono: `${countryCode} ${telefono}`,
        videoUrl,
        comprobanteUrl: finalReceiptUrl || receiptUrl,
        planElegido: planElegido?.nombre || 'Ninguno',
        estado: 'Pendiente',
        fechaCreacion: new Date(),
        orden: Date.now(),
        transicion: 'blur'
      });
      
      setCurrentStep(5);
    } catch (err: any) {
      setError("Error al guardar el anuncio. Intenta nuevamente.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const scrollToPortal = () => {
    portalRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen w-full flex flex-col bg-black text-slate-100 font-sans overflow-x-hidden relative selection:bg-fuchsia-500/30">
      {/* Background glow effects */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-fuchsia-500 opacity-10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-fuchsia-500 opacity-10 blur-[120px] rounded-full"></div>
      </div>

      {/* Navbar */}
      <nav className="relative z-50 w-full border-b border-white/5 bg-black">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="https://firebasestorage.googleapis.com/v0/b/ahi-pega.firebasestorage.app/o/AHI%20PEGA.png?alt=media" alt="Ahí Pega Logo" className="w-12 h-12 object-contain drop-shadow-[0_0_20px_rgba(217,70,239,0.5)]" referrerPolicy="no-referrer" />
            <h1 className="text-xl font-bold tracking-tight text-white">Ahí Pega!</h1>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
              <span className="hidden sm:inline font-medium">Salir</span>
              <X className="w-6 h-6" />
            </Link>
          </div>
        </div>
      </nav>

      {currentStep === 1 && (
        <section className="relative z-10 w-full flex flex-col items-center justify-center px-4 md:px-6 text-center py-16 md:py-24">
          <div className="max-w-5xl mx-auto flex flex-col items-center w-full">
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-wide md:tracking-widest text-white mb-4 md:mb-6 leading-[1.1] md:leading-tight uppercase w-full">
              EL FUTURO DE TU <br className="hidden md:block"/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-fuchsia-500 to-pink-500 drop-shadow-[0_0_15px_rgba(217,70,239,0.5)] inline-block mt-2 md:mt-0">
                PUBLICIDAD ES VERTICAL
              </span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-slate-400 max-w-3xl mb-8 md:mb-12 font-mono leading-relaxed px-4">
              Sube tu anuncio directamente. Sin registros. Sin complicaciones.
            </p>
            <button 
              onClick={scrollToPortal}
              className="group relative px-6 md:px-8 py-3 md:py-4 bg-gradient-to-r from-pink-500 to-fuchsia-600 text-white font-bold tracking-wider md:tracking-widest text-base md:text-lg rounded-xl hover:brightness-110 transition-all flex items-center justify-center uppercase shadow-[0_0_30px_rgba(217,70,239,0.4)] hover:shadow-[0_0_50px_rgba(217,70,239,0.6)] hover:-translate-y-1 w-full max-w-[280px] sm:max-w-none sm:w-auto"
            >
              EMPEZAR AHORA
              <ChevronDown className="w-5 h-5 md:w-6 md:h-6 ml-2 group-hover:translate-y-1 transition-transform" />
            </button>
          </div>
        </section>
      )}

      {/* PORTAL FORM WIZARD */}
      <section ref={portalRef} className="relative z-10 w-full flex-1 py-12 lg:py-24 border-t border-fuchsia-500/20 flex flex-col items-center justify-center bg-black/20 backdrop-blur-sm">
        
        {/* Step Indicator */}
        <div className="mb-8 md:mb-12 flex items-center justify-center w-full max-w-sm md:max-w-2xl px-2">
          {[1, 2, 3, 4, 5].map((step) => (
            <div key={step} className="flex items-center flex-1 last:flex-none">
              <div className={`w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 shrink-0 rounded-full flex items-center justify-center text-xs sm:text-sm md:text-base font-bold font-mono transition-all duration-300 ${
                currentStep === step 
                  ? 'bg-gradient-to-r from-pink-500 to-fuchsia-600 text-white shadow-[0_0_15px_rgba(217,70,239,0.5)] scale-110' 
                  : currentStep > step 
                    ? 'bg-fuchsia-500/20 text-fuchsia-500 border border-fuchsia-500/50'
                    : 'bg-white/5 text-slate-500 border border-white/10'
              }`}>
                {currentStep > step ? <CheckCircle className="w-3 h-3 md:w-5 md:h-5" /> : step}
              </div>
              {step < 5 && (
                <div className={`w-full h-[2px] md:h-1 mx-1 md:mx-2 rounded-full transition-all duration-300 ${
                  currentStep > step ? 'bg-fuchsia-500/50' : 'bg-white/10'
                }`}></div>
              )}
            </div>
          ))}
        </div>

        <div className="w-full max-w-4xl px-4 flex flex-col items-center my-auto">
          {error && (
            <div className="mb-6 w-full max-w-lg p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start text-rose-400 text-xs font-mono">
              <AlertTriangle className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}
          
          <div className="w-full bg-black/80 backdrop-blur-xl border border-fuchsia-500/50 rounded-2xl shadow-[0_0_40px_rgba(217,70,239,0.15)] p-6 md:p-10 relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-[1px] bg-gradient-to-r from-transparent via-fuchsia-500 to-transparent"></div>

            {/* STEP 1: DATOS INICIALES */}
            {currentStep === 1 && (
              <div className="animate-in fade-in slide-in-from-right-8 duration-500 max-w-lg mx-auto w-full px-1 md:px-0">
                <div className="text-center mb-6 md:mb-8">
                  <h2 className="text-lg md:text-3xl font-bold tracking-widest text-fuchsia-500 mb-1 md:mb-2 uppercase">1. Información del Anuncio</h2>
                  <p className="text-slate-400 font-mono text-xs md:text-sm">Sube tu creatividad en formato 9:16</p>
                </div>
                
                <div className="space-y-4 md:space-y-6 text-left">
                  <div>
                    <label className="block text-[10px] md:text-xs uppercase tracking-widest text-fuchsia-500 font-mono mb-1.5 md:mb-2">
                      Teléfono de Contacto (WhatsApp) *
                    </label>
                    <div className="flex bg-black/50 border border-white/10 focus-within:border-fuchsia-500 rounded-lg overflow-hidden transition-all shadow-inner">
                      <select
                        value={countryCode}
                        onChange={e => setCountryCode(e.target.value)}
                        className="bg-transparent border-r border-white/10 text-slate-100 px-2 py-3 md:px-3 md:py-4 outline-none font-mono text-sm md:text-base cursor-pointer hover:bg-white/5"
                      >
                        {countryCodes.map(c => (
                          <option key={c.code} value={c.code} className="bg-slate-900 text-white">
                            {c.label}
                          </option>
                        ))}
                      </select>
                      <input 
                        required
                        value={telefono}
                        onChange={e => setTelefono(e.target.value)}
                        type="tel"
                        className="w-full px-3 py-3 md:px-4 md:py-4 bg-transparent outline-none text-sm md:text-base text-slate-100 placeholder-slate-700 font-mono"
                        placeholder="9XX XXX XXX" 
                      />
                    </div>
                  </div>
                  
                  <div className="pt-1 md:pt-2">
                    <label className="block text-[10px] md:text-xs uppercase tracking-widest text-fuchsia-500 font-mono mb-1.5 md:mb-2">
                      Archivo del Anuncio (Video o Imagen) *
                    </label>
                    <VideoUploader 
                      onUploadComplete={(url) => {
                        setVideoUrl(url);
                        if (telefono) {
                          setCurrentStep(2);
                        }
                      }} 
                    />
                    
                    {videoUrl && (
                      <div className="mt-6 flex justify-end">
                        <button
                          onClick={() => {
                            if (!telefono) {
                              setError("Por favor, ingresa tu número de teléfono de WhatsApp primero.");
                            } else {
                              setError(null);
                              setCurrentStep(2);
                            }
                          }}
                          className="bg-fuchsia-500 hover:bg-fuchsia-400 text-white font-bold py-3 px-8 rounded-xl font-mono uppercase tracking-widest transition-colors shadow-[0_0_15px_rgba(217,70,239,0.5)]"
                        >
                          Continuar
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: PREVISUALIZACIÓN */}
            {currentStep === 2 && (
              <div className="animate-in fade-in slide-in-from-right-8 duration-500 w-full">
                <div className="text-center mb-8">
                  <h2 className="text-2xl md:text-3xl font-bold tracking-widest text-fuchsia-500 mb-2 uppercase">2. Previsualización</h2>
                  <p className="text-slate-400 font-mono text-sm">Así se verá tu anuncio en nuestras pantallas</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
                  <div className="order-2 md:order-1 flex flex-col items-center md:items-start text-center md:text-left space-y-6">
                    <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/30">
                      <CheckCircle className="w-8 h-8 text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-2 uppercase tracking-widest">Archivo Procesado</h3>
                      <p className="text-slate-400 font-mono text-sm leading-relaxed">
                        Tu anuncio ha sido subido correctamente y está listo para ser desplegado en nuestra red de pantallas verticales.
                      </p>
                    </div>
                    <button 
                      onClick={handleNextStep}
                      className="w-full md:w-auto mt-4 bg-gradient-to-r from-pink-500 to-fuchsia-600 text-white font-bold tracking-widest text-sm py-4 px-8 rounded-xl hover:brightness-110 focus:ring-4 focus:ring-fuchsia-500/50 outline-none transition-all flex items-center justify-center uppercase shadow-[0_0_20px_rgba(217,70,239,0.5)]"
                    >
                      ELEGIR PLAN <ChevronRight className="w-5 h-5 ml-2" />
                    </button>
                  </div>
                  
                  <div className="order-1 md:order-2 flex justify-center">
                    {/* TV MOCKUP */}
                    <div className="relative w-[240px] md:w-[280px] aspect-[9/16] bg-black rounded-3xl p-3 shadow-[0_20px_50px_rgba(0,0,0,0.5),0_0_30px_rgba(217,70,239,0.15)] border border-slate-800">
                      {/* Top bezel camera/sensor */}
                      <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-16 h-1.5 bg-slate-900 rounded-full"></div>
                      
                      {/* Screen content */}
                      <div className="w-full h-full bg-black rounded-2xl overflow-hidden relative">
                        {videoUrl ? (
                          videoUrl.match(/\.(jpeg|jpg|gif|png|webp|svg)(\?.*)?$/i) ? (
                            <img src={videoUrl} className="w-full h-full object-contain" alt="Preview" />
                          ) : (
                            <video 
                              src={videoUrl} 
                              className="w-full h-full object-contain"
                              autoPlay 
                              loop 
                              muted 
                              playsInline
                            />
                          )
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-slate-700">
                            <Play className="w-12 h-12 mb-2" />
                            <span className="font-mono text-xs uppercase tracking-widest">Sin Archivo</span>
                          </div>
                        )}
                        {/* Glare effect */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none"></div>
                      </div>
                      
                      {/* Bottom bezel stand indicator */}
                      <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-8 h-1 bg-slate-800 rounded-full"></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: SELECCIÓN DE PLAN */}
            {currentStep === 3 && (
              <div className="animate-in fade-in slide-in-from-right-8 duration-500 w-full">
                <div className="text-center mb-8">
                  <h2 className="text-2xl md:text-3xl font-bold tracking-widest text-fuchsia-500 mb-2 uppercase">3. Selección de Plan</h2>
                  <p className="text-slate-400 font-mono text-sm">Elige la frecuencia y exclusividad de tu campaña</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                  
                  {/* Plan Presencia */}
                  <div className="bg-black/50 border border-white/10 rounded-2xl p-6 flex flex-col hover:border-fuchsia-500/50 transition-colors">
                    <h3 className="text-xl font-bold text-white uppercase tracking-widest mb-2">Presencia</h3>
                    <div className="text-3xl font-extrabold text-fuchsia-500 mb-4 font-mono">$50<span className="text-sm text-slate-500 font-normal">/mes</span></div>
                    <p className="text-slate-400 font-mono text-sm flex-1 mb-6">
                      Rotación estándar, 1 aparición cada 10 min. Ideal para mantener visibilidad constante.
                    </p>
                    <button 
                      onClick={() => {
                        setPlanElegido({ nombre: 'Plan Presencia', precio: '$50.00 USD' });
                        handleNextStep();
                      }}
                      className="w-full bg-white/5 hover:bg-white/10 text-white border border-white/10 py-3 rounded-xl font-mono text-xs uppercase tracking-widest transition-colors"
                    >
                      Seleccionar
                    </button>
                  </div>
                  
                  {/* Plan Prime */}
                  <div className="bg-black/80 border-2 border-fuchsia-500 rounded-2xl p-6 flex flex-col relative shadow-[0_0_30px_rgba(217,70,239,0.2)] transform md:-translate-y-4 mt-6 md:mt-0">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-pink-500 to-fuchsia-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest whitespace-nowrap">
                      Más Vendido
                    </div>
                    <h3 className="text-xl font-bold text-white uppercase tracking-widest mb-2">Prime</h3>
                    <div className="text-3xl font-extrabold text-fuchsia-500 mb-4 font-mono">$100<span className="text-sm text-slate-500 font-normal">/mes</span></div>
                    <p className="text-slate-400 font-mono text-sm flex-1 mb-6">
                      Doble rotación, 2 veces cada 10 minutos. Tu anuncio se mostrará con mayor frecuencia.
                    </p>
                    <button 
                      onClick={() => {
                        setPlanElegido({ nombre: 'Plan Prime', precio: '$100.00 USD' });
                        handleNextStep();
                      }}
                      className="w-full bg-fuchsia-500 hover:brightness-110 text-[#020617] py-3 rounded-xl font-mono text-xs font-bold uppercase tracking-widest transition-colors shadow-[0_0_15px_rgba(217,70,239,0.4)]"
                    >
                      Seleccionar
                    </button>
                  </div>
                  
                  {/* Plan Dominio */}
                  <div className="bg-black/50 border border-white/10 rounded-2xl p-6 flex flex-col hover:border-fuchsia-500/50 transition-colors">
                    <h3 className="text-xl font-bold text-white uppercase tracking-widest mb-2">Dominio</h3>
                    <div className="text-3xl font-extrabold text-fuchsia-500 mb-4 font-mono">$300<span className="text-sm text-slate-500 font-normal">/mes</span></div>
                    <p className="text-slate-400 font-mono text-sm flex-1 mb-6">
                      1 vez cada 3 minutos y sin competencias en tu rubro. Exclusividad total para tu marca.
                    </p>
                    <button 
                      onClick={() => {
                        setPlanElegido({ nombre: 'Plan Dominio', precio: '$300.00 USD' });
                        handleNextStep();
                      }}
                      className="w-full bg-white/5 hover:bg-white/10 text-white border border-white/10 py-3 rounded-xl font-mono text-xs uppercase tracking-widest transition-colors"
                    >
                      Seleccionar
                    </button>
                  </div>

                </div>
                
                <div className="mt-8 text-center">
                   <button 
                    onClick={() => setCurrentStep(2)}
                    className="text-slate-400 hover:text-white font-mono text-sm tracking-widest uppercase transition-colors"
                  >
                    Volver
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: PAGO Y COMPROBANTE */}
            {currentStep === 4 && (
              <div className="animate-in fade-in slide-in-from-right-8 duration-500 max-w-2xl mx-auto w-full">
                <div className="text-center mb-8">
                  <h2 className="text-2xl md:text-3xl font-bold tracking-widest text-fuchsia-500 mb-2 uppercase">4. Pago y Comprobante</h2>
                  <p className="text-slate-400 font-mono text-sm">Realiza el pago para activar tu campaña</p>
                </div>

                <div className="bg-black/60 border border-fuchsia-500/30 rounded-xl p-6 mb-8 text-center">
                  <span className="text-slate-400 font-mono text-sm block mb-1">Elegiste el</span>
                  <span className="text-2xl font-bold text-white uppercase tracking-widest block mb-2">{planElegido?.nombre}</span>
                  <span className="text-xl text-fuchsia-500 font-mono font-bold">{planElegido?.precio}/mes</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Payment Details */}
                  <div className="bg-black/50 border border-white/5 rounded-xl p-6 flex flex-col justify-center text-left">
                    <h3 className="text-lg font-bold text-white mb-4 uppercase tracking-widest border-b border-white/10 pb-4">Detalles de Transferencia</h3>
                    <ul className="space-y-4 font-mono text-sm">
                      <li>
                        <span className="block text-slate-500 uppercase text-xs mb-1">Entidad</span>
                        <span className="text-[#CCFF00] font-bold">ueno bank</span>
                      </li>
                      <li>
                        <span className="block text-slate-500 uppercase text-xs mb-1">N° de cuenta</span>
                        <span className="text-white">14818389</span>
                      </li>
                      <li>
                        <span className="block text-slate-500 uppercase text-xs mb-1">Titular</span>
                        <span className="text-white">Ever Dejesus Acosta Vera</span>
                      </li>
                      <li>
                        <span className="block text-slate-500 uppercase text-xs mb-1">CI</span>
                        <span className="text-white">2573637</span>
                      </li>
                      <li>
                        <span className="block text-slate-500 uppercase text-xs mb-1">Alias</span>
                        <span className="text-white">CI 2573637</span>
                      </li>
                      <li className="pt-4 border-t border-white/10">
                        <span className="block text-slate-500 uppercase text-xs mb-1">Valor Mensual</span>
                        <span className="text-2xl font-bold text-fuchsia-500">{planElegido?.precio}</span>
                      </li>
                    </ul>
                  </div>
                  
                  {/* Receipt Upload */}
                  <div className="flex flex-col justify-center text-left">
                    <label className="block text-xs uppercase tracking-widest text-fuchsia-500 font-mono mb-2">
                      Subir Comprobante *
                    </label>
                    <ReceiptUploader 
                      onUploadComplete={(url) => {
                        setReceiptUrl(url);
                        if (url) {
                          handleMainSubmit(url);
                        }
                      }} 
                    />
                  </div>
                </div>

                <div className="mt-10 pt-8 border-t border-white/10 flex justify-between items-center">
                  <button 
                    onClick={() => setCurrentStep(3)}
                    disabled={loading}
                    className="text-slate-400 hover:text-white font-mono text-sm tracking-widest uppercase transition-colors disabled:opacity-50"
                  >
                    Volver
                  </button>
                  {loading && (
                    <div className="flex items-center text-fuchsia-500 font-mono text-sm uppercase tracking-widest font-bold">
                      <Loader2 className="w-5 h-5 animate-spin mr-2" /> ENVIANDO...
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STEP 5: PANTALLA DE ÉXITO */}
            {currentStep === 5 && (
              <div className="animate-in fade-in zoom-in duration-500 text-center py-6 md:py-12 max-w-lg mx-auto px-1 md:px-0">
                <div className="w-16 h-16 md:w-24 md:h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6 md:mb-8 border border-emerald-500/30 relative">
                  <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full"></div>
                  <CheckCircle className="w-8 h-8 md:w-12 md:h-12 text-emerald-400 relative z-10" />
                </div>
                
                <h2 className="text-xl md:text-4xl font-extrabold text-white mb-3 md:mb-4 uppercase tracking-widest drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]">
                  ¡Recibimos tu anuncio!
                </h2>
                
                <div className="bg-black/40 border border-white/5 rounded-xl p-4 md:p-6 mt-4 md:mt-8 mb-6 md:mb-8 inline-block w-full">
                  <p className="text-slate-300 font-mono text-xs md:text-sm leading-relaxed">
                    Tu campaña está en estado <span className="text-fuchsia-500 font-bold">Pendiente</span>.
                    <br/><br/>
                    Apenas nuestro equipo la apruebe, te enviaremos la confirmación directa a tu WhatsApp al número:
                    <br/>
                    <span className="block mt-2 text-white font-bold">{countryCode} {telefono}</span>
                  </p>
                </div>
                
                <div className="flex flex-col gap-3 md:gap-4 max-w-xs mx-auto mt-2 md:mt-4">
                  <button 
                    onClick={() => {
                      window.location.href = '/';
                    }}
                    className="w-full bg-gradient-to-r from-pink-500 to-fuchsia-600 text-white font-bold tracking-widest text-xs md:text-sm py-3 md:py-4 px-6 md:px-8 rounded-xl hover:brightness-110 focus:ring-4 focus:ring-fuchsia-500/50 outline-none transition-all flex items-center justify-center uppercase shadow-[0_0_20px_rgba(217,70,239,0.5)]"
                  >
                    Volver a Inicio
                  </button>
                  <button 
                    onClick={() => {
                      setCurrentStep(1);
                      setTelefono('');
                      setVideoUrl(null);
                      setReceiptUrl(null);
                      setPlanElegido(null);
                    }}
                    className="text-[10px] md:text-xs text-slate-500 hover:text-white font-mono uppercase tracking-widest transition-colors border-b border-transparent hover:border-white pb-1 self-center mt-2"
                  >
                    Subir una nueva campaña
                  </button>
                </div>
              </div>
            )}
            
          </div>
        </div>

        {/* BOTTOM CLOSE BUTTON */}
        <div className="mt-12 mb-8 flex justify-center w-full">
          <Link to="/" className="flex items-center gap-2 px-6 py-2.5 rounded-full border border-slate-700 bg-slate-900/50 text-slate-400 hover:text-white hover:border-fuchsia-500/50 hover:bg-fuchsia-500/10 transition-all font-medium text-sm">
            <X className="w-4 h-4" />
            <span>Cerrar y volver al inicio</span>
          </Link>
        </div>

      </section>
    </div>
  );
}

