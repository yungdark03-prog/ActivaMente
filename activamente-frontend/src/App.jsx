import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import BannerCookies from './BannerCookies';
import InstalarApp from './InstalarApp';

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

function App() {
  return (
    <BrowserRouter>
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
    </BrowserRouter>
  );
}

export default App;
