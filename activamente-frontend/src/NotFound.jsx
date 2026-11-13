import { Link, useNavigate } from 'react-router-dom';

export default function NotFound() {
  const navigate = useNavigate();
  const tieneSesion = Boolean(localStorage.getItem('token'));

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-6 font-sans text-gray-800">
      <div className="max-w-lg w-full bg-white rounded-[2rem] shadow-xl border border-gray-100 p-10 text-center">
        <div className="w-20 h-20 mx-auto rounded-3xl bg-blue-50 text-[#0284C7] flex items-center justify-center text-4xl font-black mb-5 border border-blue-100">
          404
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight mb-2">
          Página no encontrada
        </h1>
        <p className="text-sm text-gray-500 leading-relaxed mb-8">
          La ruta que buscas no existe o fue movida. Aprovecha este momento para respirar profundo y regresar a tu espacio de bienestar.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="bg-gray-100 hover:bg-gray-200 text-[#0F172A] font-bold py-3 px-6 rounded-2xl transition-all text-sm cursor-pointer"
          >
            ← Regresar
          </button>
          <Link
            to={tieneSesion ? '/app/inicio' : '/'}
            className="bg-[#0284C7] hover:bg-[#0369a1] text-white font-bold py-3 px-6 rounded-2xl shadow-md transition-all text-sm"
          >
            {tieneSesion ? 'Ir a mi Panel de Inicio' : 'Ir a Iniciar Sesión'}
          </Link>
        </div>
      </div>
    </div>
  );
}
