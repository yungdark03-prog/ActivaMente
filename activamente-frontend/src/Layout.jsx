import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import api from './api';

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [avatarUrl, setAvatarUrl] = useState(
    localStorage.getItem('fotoPerfil') || 'https://api.dicebear.com/7.x/notionists/svg?seed=Ramses'
  );

  useEffect(() => {
    const actualizarAvatar = () => {
      setAvatarUrl(localStorage.getItem('fotoPerfil') || 'https://api.dicebear.com/7.x/notionists/svg?seed=Ramses');
    };
    window.addEventListener('perfilActualizado', actualizarAvatar);
    api.get('/usuarios/perfil').then((res) => {
      if (res.data?.fotoPerfil) {
        localStorage.setItem('fotoPerfil', res.data.fotoPerfil);
        setAvatarUrl(res.data.fotoPerfil);
      }
    }).catch(() => {});
    return () => window.removeEventListener('perfilActualizado', actualizarAvatar);
  }, []);

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
              return (
                <Link key={item.path} to={item.path} title={item.title}
                  className={`p-3 rounded-xl transition-all ${activo ? 'bg-[#2E2A3A] text-white shadow-inner' : 'hover:text-white hover:bg-[#2E2A3A]'}`}>
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">{item.icon}</svg>
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
          <Outlet />
        </div>
      </main>
    </div>
  );
}