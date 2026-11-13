import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from './api';

export default function Registro() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '',
    ocupacion: 'estudiante'
  });
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const [aceptoTerminos, setAceptoTerminos] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegistro = async (e) => {
    e.preventDefault();
    setError('');

    if (!aceptoTerminos) {
      setError('Debes aceptar el Aviso de Privacidad y los Términos de Uso para crear una cuenta.');
      return;
    }

    const correoLimpio = (formData.email || '').trim().toLowerCase();
    const regexCorreo = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!regexCorreo.test(correoLimpio)) {
      setError('Por favor ingresa una dirección de correo electrónico real y válida.');
      return;
    }

    setCargando(true);
    try {
      const response = await api.post('/auth/registro', {
        ...formData,
        aceptoTerminos
      });
      localStorage.setItem('token', response.data.token);
      if (response.data.verificacion) {
        sessionStorage.setItem(
          'avisoRegistroVerificacion',
          JSON.stringify(response.data.verificacion)
        );
      }
      navigate('/app/inicio');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al registrar usuario');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-3 sm:p-6 font-sans">
      <div className="max-w-5xl w-full bg-white rounded-3xl md:rounded-[2rem] shadow-xl overflow-hidden flex flex-col md:flex-row-reverse border border-gray-100">
        
        {/* PANEL DE MARCA (Compacto en móvil, Derecha en escritorio) */}
        <div className="md:w-5/12 bg-gradient-to-bl from-[#1E1B29] to-[#0284C7] px-6 py-5 md:p-12 text-white flex flex-col justify-center relative overflow-hidden">
          <div className="relative z-10 flex items-center gap-3.5 md:block">
            <div className="w-11 h-11 md:w-16 md:h-16 flex items-center justify-center md:mb-6 shrink-0">
              <img
                src="/Logo registro.svg"
                alt="ActivaMente Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h1 className="text-xl md:text-3xl font-extrabold md:mb-4 tracking-tight">Comienza tu viaje.</h1>
              <p className="text-blue-100 text-xs md:text-base leading-relaxed md:mb-8">
                Micro-rutinas enfocadas en tu salud física y mental.
              </p>
            </div>
            <div className="hidden md:block space-y-4 text-sm text-blue-50 font-medium">
              <div className="flex items-center gap-3">
                <span className="bg-white/20 p-1.5 rounded-lg">✨</span> Pausas personalizadas
              </div>
              <div className="flex items-center gap-3">
                <span className="bg-white/20 p-1.5 rounded-lg">⏱️</span> Desde 5 minutos al día
              </div>
              <div className="flex items-center gap-3">
                <span className="bg-white/20 p-1.5 rounded-lg">📊</span> Seguimiento de progreso
              </div>
            </div>
          </div>
          <div className="absolute -top-24 -right-24 w-80 h-80 bg-white opacity-5 rounded-full blur-3xl"></div>
        </div>

        {/* PANEL DE FORMULARIO (Izquierda) */}
        <div className="md:w-7/12 p-6 sm:p-8 md:p-14 flex flex-col justify-center bg-white">
          <h2 className="text-xl md:text-2xl font-bold text-[#0F172A] mb-1 md:mb-2">Crear Cuenta</h2>
          <p className="text-gray-500 text-xs md:text-sm mb-6 md:mb-8">Ingresa tus datos para registrarte de forma gratuita.</p>
          
          <form onSubmit={handleRegistro} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nombre Completo</label>
                <input name="nombre" type="text" onChange={handleChange} placeholder="Ej. Ana García" required
                  className="w-full border border-gray-200 rounded-xl p-3 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#0284C7] focus:border-transparent outline-none transition-all text-base md:text-sm" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Correo Electrónico Real</label>
                <input name="email" type="email" onChange={handleChange} placeholder="tu.correo@gmail.com" required
                  className="w-full border border-gray-200 rounded-xl p-3 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#0284C7] focus:border-transparent outline-none transition-all text-base md:text-sm" />
                <p className="text-xs text-gray-400 mt-1.5">
                  📩 Te enviaremos un correo de confirmación. Podrás entrar de inmediato, pero debes verificarlo en un plazo de 7 días para conservar tu cuenta.
                </p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Contraseña</label>
                <input name="password" type="password" onChange={handleChange} placeholder="••••••••" required
                  className="w-full border border-gray-200 rounded-xl p-3 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#0284C7] focus:border-transparent outline-none transition-all text-base md:text-sm" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Ocupación</label>
                <select name="ocupacion" onChange={handleChange} className="w-full border border-gray-200 rounded-xl p-3 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#0284C7] focus:border-transparent outline-none transition-all text-base md:text-sm text-gray-700">
                  <option value="estudiante">Estudiante</option>
                  <option value="trabajador_oficina">Trabajador de Oficina</option>
                  <option value="docente">Docente</option>
                  <option value="operativo">Personal Operativo</option>
                </select>
              </div>
            </div>
            
            <label className="flex items-start gap-2.5 mt-2 cursor-pointer text-xs text-gray-600 leading-relaxed">
              <input
                type="checkbox"
                checked={aceptoTerminos}
                onChange={(e) => setAceptoTerminos(e.target.checked)}
                required
                className="mt-0.5 w-4 h-4 accent-[#0284C7] rounded cursor-pointer shrink-0"
              />
              <span>
                He leído y acepto el{' '}
                <Link to="/privacidad" className="text-[#0284C7] font-bold hover:underline">
                  Aviso de Privacidad
                </Link>{' '}
                y los{' '}
                <Link to="/terminos" className="text-[#0284C7] font-bold hover:underline">
                  Términos y Condiciones (incluyendo el deslinde médico)
                </Link>.
              </span>
            </label>

            {error && <p className="text-red-500 text-sm font-medium mt-2">❌ {error}</p>}
            
            <button type="submit" disabled={cargando}
              className="mt-6 w-full bg-[#0F172A] hover:bg-[#1E293B] disabled:opacity-60 text-white font-bold py-3.5 rounded-2xl shadow-md transition-all hover:shadow-lg cursor-pointer">
              {cargando ? 'Verificando correo y creando cuenta...' : 'Registrarme ahora'}
            </button>
          </form>

          <div className="mt-8 text-center text-sm font-medium">
            <span className="text-gray-500">¿Ya tienes cuenta? </span>
            <Link to="/" className="text-[#0284C7] hover:text-[#0369a1] hover:underline">
              Inicia sesión
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
