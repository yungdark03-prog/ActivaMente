import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from './api';

export default function VerificarEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [estado, setEstado] = useState('cargando'); // 'cargando' | 'exito' | 'error'
  const [mensaje, setMensaje] = useState('Verificando tu correo electrónico...');
  const [emailVerificado, setEmailVerificado] = useState('');

  useEffect(() => {
    const confirmarCorreo = async () => {
      if (!token) {
        setEstado('error');
        setMensaje('No se encontró un token de verificación válido en el enlace.');
        return;
      }

      try {
        const res = await api.post('/auth/verificar-email', { token });
        setEstado('exito');
        setMensaje(res.data.mensaje || '¡Tu correo electrónico ha sido confirmado exitosamente!');
        setEmailVerificado(res.data.email || '');
        window.dispatchEvent(new Event('perfilActualizado'));
      } catch (err) {
        setEstado('error');
        setMensaje(
          err.response?.data?.error ||
            'El enlace de verificación es inválido o ya fue utilizado anteriormente.'
        );
      }
    };

    confirmarCorreo();
  }, [token]);

  const tieneSesion = Boolean(localStorage.getItem('token'));

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-6 font-sans">
      <div className="max-w-lg w-full bg-white rounded-3xl shadow-xl border border-gray-100 p-10 text-center">
        {estado === 'cargando' && (
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-blue-50 text-[#0284C7] flex items-center justify-center text-3xl animate-pulse">
              ⏳
            </div>
            <h1 className="text-2xl font-extrabold text-[#0F172A]">Verificando tu cuenta...</h1>
            <p className="text-gray-500 text-sm">{mensaje}</p>
          </div>
        )}

        {estado === 'exito' && (
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-3xl border border-emerald-200">
              ✅
            </div>
            <h1 className="text-2xl font-extrabold text-[#0F172A]">¡Cuenta Verificada!</h1>
            <p className="text-gray-600 text-sm leading-relaxed">{mensaje}</p>
            {emailVerificado && (
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold px-4 py-1.5 rounded-full">
                {emailVerificado}
              </span>
            )}
            <div className="mt-4 w-full flex flex-col sm:flex-row gap-3 justify-center">
              {tieneSesion ? (
                <>
                  <Link
                    to="/app/inicio"
                    className="bg-[#0284C7] hover:bg-[#0369a1] text-white font-bold py-3 px-6 rounded-2xl shadow-md transition-all text-sm"
                  >
                    Ir a mi panel
                  </Link>
                  <Link
                    to="/app/ajustes"
                    className="bg-gray-100 hover:bg-gray-200 text-[#0F172A] font-semibold py-3 px-6 rounded-2xl transition-all text-sm"
                  >
                    Ver Ajustes de Cuenta
                  </Link>
                </>
              ) : (
                <Link
                  to="/"
                  className="bg-[#0284C7] hover:bg-[#0369a1] text-white font-bold py-3 px-8 rounded-2xl shadow-md transition-all text-sm"
                >
                  Iniciar Sesión
                </Link>
              )}
            </div>
          </div>
        )}

        {estado === 'error' && (
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-red-50 text-red-600 flex items-center justify-center text-3xl border border-red-200">
              ⚠️
            </div>
            <h1 className="text-2xl font-extrabold text-[#0F172A]">No se pudo verificar</h1>
            <p className="text-gray-600 text-sm leading-relaxed">{mensaje}</p>
            <div className="mt-4 w-full flex flex-col sm:flex-row gap-3 justify-center">
              {tieneSesion ? (
                <Link
                  to="/app/ajustes"
                  className="bg-[#0284C7] hover:bg-[#0369a1] text-white font-bold py-3 px-6 rounded-2xl shadow-md transition-all text-sm"
                >
                  Ir a Ajustes para reenviar correo
                </Link>
              ) : (
                <Link
                  to="/"
                  className="bg-[#0284C7] hover:bg-[#0369a1] text-white font-bold py-3 px-6 rounded-2xl shadow-md transition-all text-sm"
                >
                  Volver al inicio de sesión
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

