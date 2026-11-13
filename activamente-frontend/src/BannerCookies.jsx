import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function BannerCookies() {
  const [visible, setVisible] = useState(
    () => localStorage.getItem('cookiesAceptadas') !== 'true'
  );

  if (!visible) return null;

  const aceptarCookies = () => {
    localStorage.setItem('cookiesAceptadas', 'true');
    setVisible(false);
  };

  return (
    <div
      role="dialog"
      aria-label="Aviso de uso de cookies y almacenamiento local"
      className="fixed bottom-20 md:bottom-4 left-4 right-4 sm:left-6 sm:right-auto sm:max-w-md z-40 bg-white border border-gray-200 rounded-2xl shadow-xl p-4 sm:p-5 font-sans animate-fade-in"
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl shrink-0" aria-hidden="true">🍪</span>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-extrabold text-[#0F172A]">
            Uso de cookies y almacenamiento local
          </h3>
          <p className="text-xs text-gray-600 leading-relaxed mt-1">
            ActivaMente utiliza almacenamiento local técnico (<em>localStorage</em>) y cookies esenciales únicamente para mantener tu sesión activa, recordar tu tema visual y guardar tus preferencias. No usamos cookies publicitarias ni vendemos tus datos.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={aceptarCookies}
              className="bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer"
            >
              Aceptar y continuar
            </button>
            <Link
              to="/privacidad"
              className="text-xs font-bold text-[#0284C7] hover:underline"
            >
              Leer Aviso de Privacidad
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
