import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import api from './api';

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [avatarUrl, setAvatarUrl] = useState(
    localStorage.getItem('fotoPerfil') || 'https://api.dicebear.com/7.x/notionists/svg?seed=Ramses'
  );
  const [perfilVerificacion, setPerfilVerificacion] = useState({
    cargado: false,
    emailVerificado: true,
    diasRestantes: 7,
    email: '',
    frecuenciaRecordatorioMin: 0
  });

  useEffect(() => {
    const temaGuardado = localStorage.getItem('temaOscuro') === 'true';
    document.documentElement.classList.toggle('tema-oscuro', temaGuardado);

    const cargarEstadoPerfil = () => {
      setAvatarUrl(localStorage.getItem('fotoPerfil') || 'https://api.dicebear.com/7.x/notionists/svg?seed=Ramses');
      api.get('/usuarios/perfil').then((res) => {
        if (res.data?.fotoPerfil) {
          localStorage.setItem('fotoPerfil', res.data.fotoPerfil);
          setAvatarUrl(res.data.fotoPerfil);
        }
        const esOscuro = Boolean(res.data?.temaOscuro);
        localStorage.setItem('temaOscuro', String(esOscuro));
        document.documentElement.classList.toggle('tema-oscuro', esOscuro);

        setPerfilVerificacion({
          cargado: true,
          emailVerificado: Boolean(res.data?.emailVerificado),
          diasRestantes: res.data?.diasRestantesVerificacion ?? 7,
          email: res.data?.email || '',
          frecuenciaRecordatorioMin: Number(res.data?.frecuenciaRecordatorioMin || 0)
        });
      }).catch((err) => {
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/');
        }
      });
    };
    window.addEventListener('perfilActualizado', cargarEstadoPerfil);
    cargarEstadoPerfil();
    return () => window.removeEventListener('perfilActualizado', cargarEstadoPerfil);
  }, [navigate]);

  // Temporizador inteligente de recordatorios de pausa activa
  useEffect(() => {
    const mins = perfilVerificacion.frecuenciaRecordatorioMin;
    if (!mins || mins <= 0) return;

    const timer = setInterval(() => {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('🧘 ¡Hora de tu pausa activa en ActivaMente!', {
          body: `Han pasado ${mins} minutos. Tómate unos minutos para estirar y despejar tu mente.`
        });
      }
    }, mins * 60 * 1000);

    return () => clearInterval(timer);
  }, [perfilVerificacion.frecuenciaRecordatorioMin]);

  const cerrarSesion = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  const menu = [
    {
      path: '/app/inicio',
      title: 'Inicio',
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
    },
    {
      path: '/app/rutinas',
      title: 'Generador',
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    },
    {
      path: '/app/ajustes',
      title: 'Ajustes',
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    }
  ];

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] text-gray-800 font-sans">
      {/* BARRA LATERAL */}
      <aside className="w-20 bg-[#1E1B29] text-gray-400 flex flex-col justify-between items-center py-6 border-r border-[#1E1B29] fixed h-full z-50">
        {/* PARTE SUPERIOR: Logo y Navegación */}
        <div className="flex flex-col gap-8 items-center w-full">
          <Link to="/app/inicio" className="w-12 h-12 flex items-center justify-center transition-transform hover:scale-105" title="ActivaMente">
            <img
              src="/Logo barra lateral.svg"
              alt="ActivaMente"
              className="w-full h-full object-contain"
            />
          </Link>

          <nav className="flex flex-col gap-6 w-full items-center">
            {menu.map((item) => {
              const activo = location.pathname.includes(item.path);
              const mostrarAlertaAjustes =
                item.path === '/app/ajustes' &&
                perfilVerificacion.cargado &&
                !perfilVerificacion.emailVerificado;
              return (
                <Link key={item.path} to={item.path} title={item.title}
                  className={`relative p-3 rounded-xl transition-all ${activo ? 'bg-[#2E2A3A] text-white shadow-inner' : 'hover:text-white hover:bg-[#2E2A3A]'}`}>
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">{item.icon}</svg>
                  {mostrarAlertaAjustes && (
                    <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-amber-400 ring-2 ring-[#1E1B29]" title="Cuenta pendiente de verificación" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* PARTE INFERIOR: Botón de Salir y Foto de Perfil */}
        <div className="flex flex-col gap-6 items-center w-full">
          <button
            onClick={cerrarSesion}
            className="p-3 text-gray-400 hover:text-red-400 hover:bg-[#2E2A3A] rounded-xl transition-all"
            title="Cerrar Sesión"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>

          <Link to="/app/ajustes" className="w-10 h-10 rounded-full border-2 border-transparent hover:border-[#0284C7] overflow-hidden transition-all cursor-pointer" title="Mi Perfil">
            <img
              src={avatarUrl}
              alt="Perfil"
              className="w-full h-full object-cover bg-gray-100"
            />
          </Link>
        </div>
      </aside>

      {/* ÁREA DE CONTENIDO PRINCIPAL */}
      <main className="flex-1 ml-20 p-8 overflow-y-auto w-full">
        <div className="max-w-7xl mx-auto">
          {perfilVerificacion.cargado &&
            !perfilVerificacion.emailVerificado &&
            !location.pathname.includes('/app/ajustes') && (
              <div className="mb-6 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm text-amber-900 shadow-sm">
                <div className="flex items-center gap-2.5">
                  <span>⚠️</span>
                  <span>
                    Tu correo (<strong>{perfilVerificacion.email}</strong>) aún no está confirmado. Tienes{' '}
                    <strong>{perfilVerificacion.diasRestantes} días</strong> antes de que la cuenta se elimine automáticamente.
                  </span>
                </div>
                <Link
                  to="/app/ajustes"
                  className="bg-amber-900 hover:bg-amber-950 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all whitespace-nowrap self-start sm:self-auto"
                >
                  Confirmar o reenviar en Ajustes →
                </Link>
              </div>
            )}
          <Outlet />
        </div>
      </main>
    </div>
  );
}