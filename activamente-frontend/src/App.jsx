import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import BannerCookies from './BannerCookies';
import InstalarApp from './InstalarApp';
import { useTemaOscuro } from './tema';

// Code Splitting: cada vista se descarga solo cuando el usuario entra a ella
const Login = lazy(() => import('./Login'));
const Registro = lazy(() => import('./Registro'));
const VerificarEmail = lazy(() => import('./VerificarEmail'));
const RestablecerPassword = lazy(() => import('./RestablecerPassword'));
const Legal = lazy(() => import('./Legal'));
const Layout = lazy(() => import('./Layout'));
const Inicio = lazy(() => import('./Inicio'));
const Rutina = lazy(() => import('./Rutina'));
const MapaZonas = lazy(() => import('./MapaZonas'));
const Ajustes = lazy(() => import('./Ajustes'));
const NotFound = lazy(() => import('./NotFound'));

function CargandoPantalla() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC] text-gray-500 font-sans gap-3">
      <div className="w-10 h-10 border-4 border-blue-200 border-t-[#0284C7] rounded-full animate-spin" />
      <p className="text-xs font-semibold tracking-wide">Cargando ActivaMente...</p>
    </div>
  );
}

function BotonTemaPublico() {
  const location = useLocation();
  const { temaOscuro, alternarTema } = useTemaOscuro();

  // En rutas privadas (/app/*) el botón ya está integrado en la barra lateral y superior de Layout
  if (location.pathname.startsWith('/app')) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={alternarTema}
      title={temaOscuro ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
      aria-label={temaOscuro ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
      className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-white/95 backdrop-blur-md border border-gray-200 px-3.5 py-2 rounded-full shadow-md text-xs font-bold text-[#0F172A] hover:border-[#0284C7] transition-all cursor-pointer"
    >
      <span className="text-sm leading-none">{temaOscuro ? '🌙' : '☀️'}</span>
      <span className="hidden sm:inline">{temaOscuro ? 'Modo Oscuro' : 'Modo Claro'}</span>
    </button>
  );
}

function App() {
  return (
    <BrowserRouter>
      <BotonTemaPublico />
      <Suspense fallback={<CargandoPantalla />}>
        <Routes>
          {/* Rutas Públicas (Pantalla completa) */}
          <Route path="/" element={<Login />} />
          <Route path="/registro" element={<Registro />} />
          <Route path="/verificar-email" element={<VerificarEmail />} />
          <Route path="/restablecer-password" element={<RestablecerPassword />} />
          <Route path="/privacidad" element={<Legal />} />
          <Route path="/terminos" element={<Legal />} />

          {/* Rutas Privadas (Con barra lateral / móvil) */}
          <Route path="/app" element={<Layout />}>
            <Route index element={<Navigate to="inicio" replace />} />
            <Route path="inicio" element={<Inicio />} />
            <Route path="rutinas" element={<Rutina />} />
            <Route path="mapa" element={<MapaZonas />} />
            <Route path="ajustes" element={<Ajustes />} />
          </Route>

          {/* Ruta 404 para cualquier URL inexistente */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
      <InstalarApp />
      <BannerCookies />
      <Analytics />
    </BrowserRouter>
  );
}

export default App;
