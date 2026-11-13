import { useState, useEffect } from 'react';

export default function InstalarApp() {
  const [plataforma, setPlataforma] = useState(null); // 'ios' | 'android' | null
  const [esSafariIos, setEsSafariIos] = useState(true);
  const [mostrarPasos, setMostrarPasos] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // 1. Verificar si ya está instalada como Web App (modo standalone)
    const yaInstalada =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;

    if (yaInstalada) return;

    // 2. Verificar si el usuario ya cerró la recomendación antes
    if (localStorage.getItem('instalarAppDescartado') === 'true') return;

    const ua = window.navigator.userAgent || '';
    const esIOS =
      /iPhone|iPad|iPod/i.test(ua) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const esAndroid = /Android/i.test(ua);

    if (esIOS) {
      const enSafari = /Safari/i.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS/i.test(ua);
      setEsSafariIos(enSafari);
      setPlataforma('ios');
      setVisible(true);
    } else if (esAndroid) {
      setPlataforma('android');
      setVisible(true);
    }

    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (esAndroid) {
        setPlataforma('android');
        setVisible(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  if (!visible || !plataforma) return null;

  const cerrarAviso = () => {
    localStorage.setItem('instalarAppDescartado', 'true');
    setVisible(false);
  };

  const instalarEnAndroid = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setVisible(false);
      }
      setDeferredPrompt(null);
    } else {
      setMostrarPasos(!mostrarPasos);
    }
  };

  return (
    <div
      role="region"
      aria-label="Recomendación para instalar ActivaMente como Web App"
      className="md:hidden fixed top-[max(0.75rem,env(safe-area-inset-top))] left-3 right-3 z-50 font-sans animate-fade-in"
    >
      <div className="bg-[#1E1B29]/95 backdrop-blur-xl text-white border border-white/15 rounded-3xl shadow-2xl p-4">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#0284C7] to-[#0369a1] p-2 flex items-center justify-center shrink-0 shadow-md border border-white/20">
            <img src="/Logo login.svg" alt="ActivaMente" className="w-full h-full object-contain" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-sm font-extrabold tracking-tight leading-tight">
                  {plataforma === 'ios'
                    ? 'Instala ActivaMente en tu iPhone'
                    : 'Instala ActivaMente en tu Android'}
                </h3>
                <p className="text-[11px] text-blue-100/90 mt-0.5 leading-snug">
                  Úsala a pantalla completa como app nativa, sin barras del navegador.
                </p>
              </div>
              <button
                type="button"
                onClick={cerrarAviso}
                aria-label="Cerrar recomendación"
                className="text-gray-400 hover:text-white text-sm font-bold px-1.5 py-0.5 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Botones de acción */}
            <div className="mt-3 flex items-center gap-2">
              {plataforma === 'ios' ? (
                <button
                  type="button"
                  onClick={() => setMostrarPasos(!mostrarPasos)}
                  className="bg-[#0284C7] hover:bg-[#0369a1] text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all cursor-pointer shadow-sm"
                >
                  {mostrarPasos ? 'Ocultar pasos' : '📲 Cómo instalar en iOS'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={instalarEnAndroid}
                  className="bg-[#0284C7] hover:bg-[#0369a1] text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all cursor-pointer shadow-sm"
                >
                  {deferredPrompt ? '📲 Instalar App Ahora' : '📲 Cómo instalar en Android'}
                </button>
              )}

              <button
                type="button"
                onClick={cerrarAviso}
                className="text-[11px] text-gray-300 hover:text-white font-semibold px-2.5 py-2 cursor-pointer"
              >
                Ahora no
              </button>
            </div>
          </div>
        </div>

        {/* Instrucciones detalladas por sistema operativo */}
        {mostrarPasos && (
          <div className="mt-3.5 pt-3.5 border-t border-white/10 text-xs text-blue-50 space-y-2.5">
            {plataforma === 'ios' ? (
              <>
                {!esSafariIos && (
                  <p className="bg-amber-500/20 border border-amber-400/30 text-amber-100 px-3 py-2 rounded-xl text-[11px]">
                    💡 <strong>Tip iPhone:</strong> Para una instalación más fluida, te recomendamos abrir esta liga en <strong>Safari</strong> (en Chrome de iOS el botón Compartir está arriba a la derecha).
                  </p>
                )}
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-lg bg-white/15 flex items-center justify-center font-bold shrink-0">1</span>
                  <span>
                    Toca el ícono de <strong>Compartir</strong>{' '}
                    <span className="inline-flex items-center justify-center bg-white/15 px-1.5 py-0.5 rounded text-[11px] font-bold">
                      ⬆️
                    </span>{' '}
                    en la barra de herramientas de Safari.
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-lg bg-white/15 flex items-center justify-center font-bold shrink-0">2</span>
                  <span>
                    Desliza hacia abajo y elige <strong>"Agregar a inicio"</strong> (o <em>"Add to Home Screen"</em>).
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-lg bg-white/15 flex items-center justify-center font-bold shrink-0">3</span>
                  <span>
                    Toca <strong>"Agregar"</strong> arriba a la derecha. ¡Listo! Ya aparecerá en tu pantalla de inicio.
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-lg bg-white/15 flex items-center justify-center font-bold shrink-0">1</span>
                  <span>
                    Toca el menú <strong>⋮</strong> en la esquina superior derecha de Chrome.
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-lg bg-white/15 flex items-center justify-center font-bold shrink-0">2</span>
                  <span>
                    Selecciona <strong>"Instalar aplicación"</strong> o <strong>"Agregar a la pantalla principal"</strong>.
                  </span>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
