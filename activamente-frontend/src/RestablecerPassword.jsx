import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from './api';

export default function RestablecerPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [nuevaPassword, setNuevaPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');
  const [cargando, setCargando] = useState(false);
  const [estado, setEstado] = useState({ tipo: '', texto: '' });
  const [completado, setCompletado] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEstado({ tipo: '', texto: '' });

    if (!token) {
      setEstado({ tipo: 'error', texto: 'Enlace inválido: no se encontró el token de recuperación.' });
      return;
    }

    if (nuevaPassword.length < 6) {
      setEstado({ tipo: 'error', texto: 'La nueva contraseña debe tener al menos 6 caracteres.' });
      return;
    }

    if (nuevaPassword !== confirmarPassword) {
      setEstado({ tipo: 'error', texto: 'Las contraseñas no coinciden. Verifica que sean iguales.' });
      return;
    }

    setCargando(true);
    try {
      const res = await api.post('/auth/restablecer-password', {
        token,
        nuevaPassword
      });
      setCompletado(true);
      setEstado({
        tipo: 'exito',
        texto: res.data.mensaje || '¡Tu contraseña ha sido restablecida exitosamente!'
      });
    } catch (error) {
      setEstado({
        tipo: 'error',
        texto: error.response?.data?.error || 'No se pudo restablecer la contraseña. El enlace puede haber expirado.'
      });
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-6 font-sans">
      <div className="max-w-md w-full bg-white rounded-[2rem] shadow-xl border border-gray-100 p-10">
        {completado ? (
          <div className="flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-3xl border border-emerald-200">
              ✅
            </div>
            <h1 className="text-2xl font-extrabold text-[#0F172A]">¡Contraseña Actualizada!</h1>
            <p className="text-gray-600 text-sm leading-relaxed">{estado.texto}</p>
            <Link
              to="/"
              className="mt-4 w-full bg-[#0284C7] hover:bg-[#0369a1] text-white font-bold py-3.5 rounded-xl shadow-md transition-all text-sm text-center"
            >
              Ir a Iniciar Sesión
            </Link>
          </div>
        ) : (
          <div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0284C7] flex items-center justify-center text-2xl mb-4">
              🔑
            </div>
            <h1 className="text-2xl font-bold text-[#0F172A] mb-2">Crear Nueva Contraseña</h1>
            <p className="text-gray-500 text-sm mb-6">
              Ingresa tu nueva contraseña para recuperar el acceso a tu cuenta de ActivaMente.
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Nueva Contraseña
                </label>
                <input
                  type="password"
                  value={nuevaPassword}
                  onChange={(e) => setNuevaPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  required
                  className="w-full border border-gray-200 rounded-xl p-3.5 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#0284C7] outline-none transition-all text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Confirmar Nueva Contraseña
                </label>
                <input
                  type="password"
                  value={confirmarPassword}
                  onChange={(e) => setConfirmarPassword(e.target.value)}
                  placeholder="Repite tu contraseña"
                  required
                  className="w-full border border-gray-200 rounded-xl p-3.5 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#0284C7] outline-none transition-all text-sm"
                />
              </div>

              {estado.texto && (
                <p className="text-red-600 text-xs font-semibold bg-red-50 p-3 rounded-xl border border-red-100">
                  ❌ {estado.texto}
                </p>
              )}

              <button
                type="submit"
                disabled={cargando}
                className="w-full bg-[#0284C7] hover:bg-[#0369a1] disabled:opacity-60 text-white font-bold p-3.5 rounded-xl shadow-md transition-all mt-2 cursor-pointer text-sm"
              >
                {cargando ? 'Guardando nueva contraseña...' : 'Guardar Nueva Contraseña'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <Link to="/" className="text-xs font-bold text-gray-500 hover:text-[#0284C7]">
                ← Volver a Iniciar Sesión
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

