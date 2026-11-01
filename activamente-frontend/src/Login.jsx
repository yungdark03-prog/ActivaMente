import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from './api';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mensaje, setMensaje] = useState('');

  // Estados para "¿Olvidaste tu contraseña?"
  const [modoRecuperacion, setModoRecuperacion] = useState(false);
  const [emailRecuperacion, setEmailRecuperacion] = useState('');
  const [enviandoRecuperacion, setEnviandoRecuperacion] = useState(false);
  const [estadoRecuperacion, setEstadoRecuperacion] = useState({ tipo: '', texto: '' });

  const handleLogin = async (e) => {
    e.preventDefault();
    setMensaje('');
    try {
      const response = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', response.data.token);
      navigate('/app/inicio');
    } catch (error) {
      setMensaje(error.response?.data?.error || 'Error al iniciar sesión');
    }
  };

  const handleSolicitarRecuperacion = async (e) => {
    e.preventDefault();
    setEstadoRecuperacion({ tipo: '', texto: '' });
    setEnviandoRecuperacion(true);
    try {
      const res = await api.post('/auth/solicitar-recuperacion', {
        email: emailRecuperacion
      });
      setEstadoRecuperacion({
        tipo: 'exito',
        texto: res.data.mensaje || 'Hemos enviado el enlace de recuperación a tu correo.'
      });
    } catch (error) {
      setEstadoRecuperacion({
        tipo: 'error',
        texto: error.response?.data?.error || 'No se pudo procesar la solicitud.'
      });
    } finally {
      setEnviandoRecuperacion(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-6 font-sans">
      <div className="max-w-4xl w-full bg-white rounded-[2rem] shadow-xl overflow-hidden flex flex-col md:flex-row border border-gray-100">
        
        {/* PANEL DE MARCA (Izquierda) */}
        <div className="md:w-1/2 bg-gradient-to-br from-[#1E1B29] to-[#0284C7] p-12 text-white flex flex-col justify-center relative overflow-hidden">
          <div className="relative z-10">
            <div className="w-16 h-16 flex items-center justify-center mb-6">
              <img
                src="/Logo login.svg"
                alt="ActivaMente Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <h1 className="text-4xl font-extrabold mb-4 tracking-tight">Bienvenido de nuevo.</h1>
            <p className="text-blue-100 text-lg leading-relaxed">
              Tu espacio personal de bienestar. Inicia sesión para continuar con tus pausas activas y mejorar tu productividad.
            </p>
          </div>
          {/* Decoración de fondo abstracta */}
          <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-white opacity-5 rounded-full blur-3xl"></div>
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-[#0369a1] opacity-40 rounded-full blur-3xl"></div>
        </div>

        {/* PANEL DE FORMULARIO (Derecha) */}
        <div className="md:w-1/2 p-10 md:p-14 flex flex-col justify-center bg-white">
          {!modoRecuperacion ? (
            <>
              <h2 className="text-2xl font-bold text-[#0F172A] mb-2">Iniciar Sesión</h2>
              <p className="text-gray-500 text-sm mb-8">Ingresa tus credenciales para acceder a tu cuenta.</p>
              
              <form onSubmit={handleLogin} className="flex flex-col gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Correo Electrónico</label>
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@correo.com"
                    required
                    className="w-full border border-gray-200 rounded-xl p-3.5 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#0284C7] outline-none transition-all text-sm"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-sm font-semibold text-gray-700">Contraseña</label>
                    <button
                      type="button"
                      onClick={() => {
                        setEmailRecuperacion(email);
                        setEstadoRecuperacion({ tipo: '', texto: '' });
                        setModoRecuperacion(true);
                      }}
                      className="text-xs font-bold text-[#0284C7] hover:text-[#0369a1] hover:underline cursor-pointer"
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full border border-gray-200 rounded-xl p-3.5 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#0284C7] outline-none transition-all text-sm"
                  />
                </div>

                {mensaje && (
                  <p className="text-red-500 text-sm bg-red-50 p-3 rounded-xl border border-red-100">
                    {mensaje}
                  </p>
                )}

                <button 
                  type="submit" 
                  className="w-full bg-[#0284C7] hover:bg-[#0369a1] text-white font-bold p-3.5 rounded-xl shadow-md transition-all mt-2 cursor-pointer text-sm"
                >
                  Entrar a mi espacio
                </button>
              </form>

              <p className="text-gray-400 text-sm text-center mt-8">
                ¿No tienes cuenta?{' '}
                <Link to="/registro" className="text-[#0284C7] hover:text-[#0369a1] font-bold">
                  Regístrate aquí
                </Link>
              </p>
            </>
          ) : (
            <div className="animate-fade-in">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0284C7] flex items-center justify-center text-2xl mb-4">
                🔐
              </div>
              <h2 className="text-2xl font-bold text-[#0F172A] mb-2">Recuperar Contraseña</h2>
              <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                Ingresa el correo electrónico con el que creaste tu cuenta y te enviaremos un enlace seguro para restablecer tu contraseña.
              </p>

              <form onSubmit={handleSolicitarRecuperacion} className="flex flex-col gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Tu Correo Electrónico
                  </label>
                  <input
                    type="email"
                    value={emailRecuperacion}
                    onChange={(e) => setEmailRecuperacion(e.target.value)}
                    placeholder="tu.correo@gmail.com"
                    required
                    className="w-full border border-gray-200 rounded-xl p-3.5 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#0284C7] outline-none transition-all text-sm"
                  />
                </div>

                {estadoRecuperacion.texto && (
                  <div
                    className={`p-3.5 rounded-xl text-xs font-semibold border ${
                      estadoRecuperacion.tipo === 'exito'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-red-50 text-red-600 border-red-100'
                    }`}
                  >
                    {estadoRecuperacion.tipo === 'exito' ? '✅ ' : '❌ '}
                    {estadoRecuperacion.texto}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={enviandoRecuperacion}
                  className="w-full bg-[#0284C7] hover:bg-[#0369a1] disabled:opacity-60 text-white font-bold p-3.5 rounded-xl shadow-md transition-all mt-1 cursor-pointer text-sm"
                >
                  {enviandoRecuperacion ? 'Enviando enlace al correo...' : '📧 Enviar enlace de recuperación'}
                </button>
              </form>

              <button
                type="button"
                onClick={() => setModoRecuperacion(false)}
                className="mt-6 w-full text-center text-xs font-bold text-gray-500 hover:text-[#0284C7] cursor-pointer"
              >
                ← Volver a Iniciar Sesión
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
