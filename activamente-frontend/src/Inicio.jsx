import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from './api';

const ETIQUETAS_OBJETIVO = {
  concentracion: { texto: 'Concentración', icono: '🎯', color: 'bg-blue-50 text-blue-700 border-blue-100' },
  activacion_fisica: { texto: 'Activación Física', icono: '💪', color: 'bg-orange-50 text-orange-700 border-orange-100' },
  mente_cuerpo: { texto: 'Mente y Cuerpo', icono: '🧠', color: 'bg-purple-50 text-purple-700 border-purple-100' }
};

export default function Inicio() {
  const [progreso, setProgreso] = useState({
    usuario: { nombre: '', tiempoPorDefecto: 10 },
    rachaActual: 0,
    minutosInvertidos: 0,
    sesionesCompletadas: 0,
    sesionesHoy: 0,
    minutosHoy: 0,
    promedioEsfuerzo: null,
    promedioUtilidad: null,
    historialReciente: []
  });
  const [cargando, setCargando] = useState(true);

  const cargarProgreso = useCallback(async () => {
    try {
      const response = await api.get('/usuarios/progreso');
      setProgreso(response.data);
    } catch (error) {
      console.error('Error al cargar el progreso del usuario:', error);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarProgreso();

    const handleActualizacion = () => cargarProgreso();
    window.addEventListener('progresoActualizado', handleActualizacion);
    window.addEventListener('perfilActualizado', handleActualizacion);
    window.addEventListener('focus', handleActualizacion);

    // Sincronización periódica en segundo plano para reflejar cambios en tiempo real
    const intervalo = setInterval(cargarProgreso, 5000);

    return () => {
      window.removeEventListener('progresoActualizado', handleActualizacion);
      window.removeEventListener('perfilActualizado', handleActualizacion);
      window.removeEventListener('focus', handleActualizacion);
      clearInterval(intervalo);
    };
  }, [cargarProgreso]);

  const formatearFecha = (fechaIso) => {
    if (!fechaIso) return '';
    const fecha = new Date(fechaIso);
    return fecha.toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const primerNombre = progreso.usuario?.nombre
    ? progreso.usuario.nombre.split(' ')[0]
    : '';

  return (
    <div className="animate-fade-in flex flex-col gap-8 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#0F172A] tracking-tight">
            Hola de nuevo{primerNombre ? `, ${primerNombre}` : ''} 👋
          </h1>
          <p className="text-gray-500 mt-1">
            Aquí tienes el resumen en tiempo real de tu progreso guardado en ActivaMente.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3.5 py-2 rounded-full self-start sm:self-auto">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Sincronizado en tiempo real
        </div>
      </div>

      {/* TARJETAS DE RESUMEN DE PROGRESO */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-14 h-14 bg-blue-50 text-[#0284C7] rounded-2xl flex items-center justify-center text-2xl font-bold">
            🔥
          </div>
          <div>
            <p className="text-gray-500 text-sm font-semibold">Racha actual</p>
            <h3 className="text-2xl font-black text-[#0F172A]">
              {cargando ? '...' : `${progreso.rachaActual} ${progreso.rachaActual === 1 ? 'Día' : 'Días'}`}
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {progreso.sesionesHoy > 0
                ? '¡Ya cumpliste tu pausa de hoy!'
                : 'Completa una pausa hoy para sumar'}
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-14 h-14 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center text-2xl font-bold">
            ⏱️
          </div>
          <div>
            <p className="text-gray-500 text-sm font-semibold">Minutos invertidos</p>
            <h3 className="text-2xl font-black text-[#0F172A]">
              {cargando ? '...' : `${progreso.minutosInvertidos} min`}
            </h3>
            <p className="text-xs text-emerald-600 font-medium mt-0.5">
              {progreso.minutosHoy > 0
                ? `+${progreso.minutosHoy} min registrados hoy`
                : '0 min registrados hoy'}
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center text-2xl font-bold">
            🧘
          </div>
          <div>
            <p className="text-gray-500 text-sm font-semibold">Sesiones completadas</p>
            <h3 className="text-2xl font-black text-[#0F172A]">
              {cargando ? '...' : `${progreso.sesionesCompletadas} ${progreso.sesionesCompletadas === 1 ? 'Sesión' : 'Sesiones'}`}
            </h3>
            <p className="text-xs text-purple-600 font-medium mt-0.5">
              {progreso.promedioUtilidad
                ? `⭐ Utilidad promedio: ${progreso.promedioUtilidad}/5`
                : `${progreso.sesionesHoy} completadas hoy`}
            </p>
          </div>
        </div>
      </div>

      {/* META DIARIA DE BIENESTAR */}
      {(() => {
        const metaMin = progreso.usuario?.metaDiariaMin || 20;
        const porcentajeMeta = Math.min(100, Math.round(((progreso.minutosHoy || 0) / metaMin) * 100));
        return (
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🎯</span>
                <div>
                  <h2 className="text-base font-extrabold text-[#0F172A]">
                    Meta Diaria de Bienestar ({metaMin} min)
                  </h2>
                  <p className="text-xs text-gray-500">
                    {porcentajeMeta >= 100
                      ? '¡Felicidades! Ya cumpliste tu meta diaria configurada en Ajustes.'
                      : `Llevas ${progreso.minutosHoy || 0} de ${metaMin} minutos hoy (${porcentajeMeta}%).`}
                  </p>
                </div>
              </div>
              <Link
                to="/app/ajustes"
                className="text-xs font-bold text-[#0284C7] hover:underline self-start sm:self-auto"
              >
                Cambiar meta en Ajustes →
              </Link>
            </div>
            <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#0284C7] to-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${porcentajeMeta}%` }}
              />
            </div>
          </div>
        );
      })()}

      {/* BANNER DE ACCIÓN */}
      <div className="bg-gradient-to-r from-[#1E1B29] to-[#0284C7] rounded-3xl p-8 text-white shadow-lg flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">Es hora de tu pausa activa</h2>
          <p className="text-blue-100 max-w-lg">
            Desconecta {progreso.usuario?.tiempoPorDefecto || 10} minutos para mejorar tu concentración y evitar la fatiga visual. Tu cuerpo te lo agradecerá.
          </p>
        </div>
        <Link
          to="/app/rutinas"
          className="bg-white text-[#0284C7] font-bold py-3 px-8 rounded-2xl hover:bg-gray-50 transition-colors whitespace-nowrap shadow-md"
        >
          Generar Rutina
        </Link>
      </div>

      {/* HISTORIAL RECIENTE GUARDADO */}
      <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h2 className="text-xl font-bold text-[#0F172A]">Historial de Pausas Completadas</h2>
            <p className="text-sm text-gray-500">
              Registro personal guardado automáticamente conforme terminas y evalúas tus rutinas.
            </p>
          </div>
          {progreso.sesionesCompletadas > 0 && (
            <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-1.5 rounded-xl self-start sm:self-auto">
              Últimas {progreso.historialReciente.length} sesiones
            </span>
          )}
        </div>

        {cargando ? (
          <div className="py-10 text-center text-gray-400 font-medium">
            Cargando tu historial de progreso...
          </div>
        ) : progreso.historialReciente.length === 0 ? (
          <div className="py-10 px-4 text-center bg-[#F8FAFC] rounded-2xl border border-dashed border-gray-200 flex flex-col items-center gap-3">
            <span className="text-4xl">🌱</span>
            <div>
              <h3 className="font-bold text-[#0F172A]">Aún no tienes sesiones completadas</h3>
              <p className="text-xs text-gray-500 max-w-md mt-1">
                Genera y finaliza tu primera rutina en el Generador para que tus minutos, racha de días y evaluaciones se guarden aquí.
              </p>
            </div>
            <Link
              to="/app/rutinas"
              className="mt-2 bg-[#0284C7] hover:bg-[#0369a1] text-white text-xs font-bold py-2.5 px-5 rounded-xl transition-all"
            >
              Iniciar mi primera pausa
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {progreso.historialReciente.map((sesion) => {
              const infoObj = ETIQUETAS_OBJETIVO[sesion.objetivo] || {
                texto: sesion.objetivo,
                icono: '🧘',
                color: 'bg-gray-50 text-gray-700 border-gray-100'
              };
              return (
                <div
                  key={sesion.id}
                  className="p-4 rounded-2xl border border-gray-100 bg-[#F8FAFC] hover:bg-white hover:shadow-sm transition-all flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center text-xl shrink-0 ${infoObj.color}`}>
                      {infoObj.icono}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-sm text-[#0F172A] truncate">
                        {infoObj.texto}
                      </h4>
                      <p className="text-xs text-gray-500 capitalize mt-0.5">
                        📍 {(sesion.ubicacion || '').replace('_', ' ')} • ⏱️ {sesion.tiempoMin} min
                        {sesion.totalEjercicios ? ` • ${sesion.totalEjercicios} ejercicios` : ''}
                      </p>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {formatearFecha(sesion.fechaInicio)}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end shrink-0">
                    {sesion.calificacionUtilidad ? (
                      <span className="text-xs font-bold text-amber-600 bg-amber-50 border border-amber-100 px-2.5 py-1 rounded-lg">
                        ⭐ {sesion.calificacionUtilidad}/5
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-lg">
                        ✅ Completada
                      </span>
                    )}
                    {sesion.calificacionEsfuerzo && (
                      <span className="text-[11px] text-gray-400 mt-1">
                        Esfuerzo: {sesion.calificacionEsfuerzo}/5
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
