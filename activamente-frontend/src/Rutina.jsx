import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from './api';

export default function Rutina() {
  const [ubicacion, setUbicacion] = useState('oficina');
  const [tiempo, setTiempo] = useState('10');
  const [objetivo, setObjetivo] = useState('concentracion');
  
  const [rutina, setRutina] = useState(null);
  const [error, setError] = useState('');
  
  // Estados de Evaluación
  const [esfuerzo, setEsfuerzo] = useState(3);
  const [utilidad, setUtilidad] = useState(3);
  const [evaluada, setEvaluada] = useState(false);

  // Estados del Temporizador
  const [tiempoRestante, setTiempoRestante] = useState(0);
  const [timerActivo, setTimerActivo] = useState(false);
  const [rutinaFinalizada, setRutinaFinalizada] = useState(false);
  const [actividadActualIndex, setActividadActualIndex] = useState(0);

  useEffect(() => {
    api.get('/usuarios/perfil').then(res => {
      if (res.data?.ubicacionPorDefecto) setUbicacion(res.data.ubicacionPorDefecto);
      if (res.data?.tiempoPorDefecto) setTiempo(String(res.data.tiempoPorDefecto));
    }).catch(() => {});
  }, []);

  const marcarSesionCompletada = async (sesionId) => {
    if (!sesionId) return;
    try {
      await api.post('/rutinas/completar', { sesionId });
      window.dispatchEvent(new Event('progresoActualizado'));
    } catch (err) {
      console.error('Error al registrar finalización de sesión:', err);
    }
  };

  useEffect(() => {
    let intervalo = null;
    if (timerActivo && tiempoRestante > 0) {
      intervalo = setInterval(() => {
        setTiempoRestante((prev) => prev - 1);
      }, 1000);
    } else if (tiempoRestante === 0 && timerActivo) {
      setTimerActivo(false);
      setRutinaFinalizada(true);
      if (rutina?.sesionId) {
        marcarSesionCompletada(rutina.sesionId);
      }
    }
    return () => clearInterval(intervalo);
  }, [timerActivo, tiempoRestante, rutina]);

  const formatoTiempo = (segundos) => {
    const min = Math.floor(segundos / 60).toString().padStart(2, '0');
    const seg = (segundos % 60).toString().padStart(2, '0');
    return `${min}:${seg}`;
  };

  const generarRutina = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setRutina(null);
    setEvaluada(false);
    setRutinaFinalizada(false);
    setTimerActivo(false);
    setActividadActualIndex(0);

    try {
      const response = await api.post('/rutinas/generar', {
        ubicacion,
        tiempo: parseInt(tiempo, 10),
        objetivo
      });
      setRutina(response.data);
      setTiempoRestante(response.data.duracionEstimadaSegundos);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al generar la rutina');
    }
  };

  const terminarRutinaManualmente = async () => {
    setTimerActivo(false);
    setRutinaFinalizada(true);
    if (rutina?.sesionId) {
      await marcarSesionCompletada(rutina.sesionId);
    }
  };

  const enviarEvaluacion = async () => {
    try {
      await api.post('/rutinas/evaluar', {
        sesionId: rutina.sesionId,
        calificacionEsfuerzo: esfuerzo,
        calificacionUtilidad: utilidad,
        comentarios: 'Evaluado tras temporizador'
      });
      setEvaluada(true);
      window.dispatchEvent(new Event('progresoActualizado'));
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar la evaluación');
    }
  };

  const reiniciarPausa = () => {
    setRutina(null);
    setEvaluada(false);
    setRutinaFinalizada(false);
    setTimerActivo(false);
  };

  return (
    <div className="animate-fade-in text-gray-800 font-sans">
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-[#0F172A] tracking-tight">Mi Espacio de Bienestar</h1>
          <p className="text-gray-500 mt-1">Configura y ejecuta tus pausas activas diarias.</p>
        </div>
        <button onClick={reiniciarPausa} className="bg-[#0284C7] hover:bg-[#0369a1] text-white font-bold py-2.5 px-5 rounded-full flex items-center gap-2 shadow-sm transition-all cursor-pointer">
          <span>+</span> Nueva Pausa
        </button>
      </div>

      {/* CONTENEDOR EN REJILLA */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* PANEL CONFIGURADOR (Col 1-4) */}
        <section className="lg:col-span-4 bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col gap-6">
          <h2 className="text-xl font-bold text-[#0F172A]">Configurar Pausa</h2>
          
          {/* Ubicación */}
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-3">Ubicación</label>
            <div className="grid grid-cols-2 gap-2">
              {['oficina', 'casa', 'aula', 'area_trabajo'].map((loc) => (
                <button key={loc} type="button" onClick={() => setUbicacion(loc)} disabled={timerActivo}
                  className={`py-2 px-3 rounded-xl border text-sm font-medium transition-all ${ubicacion === loc ? 'border-[#0284C7] bg-[#F0F9FF] text-[#0369a1] font-semibold' : 'border-gray-200 text-gray-600 hover:bg-gray-50'} disabled:opacity-50 capitalize`}>
                  {loc.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Tiempo */}
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-3">Tiempo estimado</label>
            <div className="grid grid-cols-3 gap-2">
              {['5', '10', '12'].map((t) => (
                <button key={t} type="button" onClick={() => setTiempo(t)} disabled={timerActivo}
                  className={`py-2 px-1 rounded-xl border text-sm font-medium transition-all ${tiempo === t ? 'border-[#0284C7] bg-[#F0F9FF] text-[#0369a1] font-semibold' : 'border-gray-200 text-gray-600 hover:bg-gray-50'} disabled:opacity-50`}>
                  ⏱️ {t} min
                </button>
              ))}
            </div>
          </div>

          {/* Objetivo */}
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-3">Objetivo principal</label>
            <div className="flex flex-col gap-2">
              {[
                { id: 'concentracion', label: '🎯 Concentración' },
                { id: 'activacion_fisica', label: '💪 Activación Física' },
                { id: 'mente_cuerpo', label: '🧠 Mente y Cuerpo' }
              ].map((obj) => (
                <button key={obj.id} type="button" onClick={() => setObjetivo(obj.id)} disabled={timerActivo}
                  className={`py-3 px-4 rounded-xl border text-left text-sm font-medium transition-all ${objetivo === obj.id ? 'border-[#0284C7] bg-[#F0F9FF] text-[#0369a1] font-semibold' : 'border-gray-200 text-gray-600 hover:bg-gray-50'} disabled:opacity-50`}>
                  {obj.label}
                </button>
              ))}
            </div>
          </div>

          {/* Generar */}
          <button onClick={generarRutina} disabled={timerActivo}
            className="w-full bg-[#0284C7] hover:bg-[#0369a1] text-white font-bold py-3.5 px-4 rounded-2xl shadow-md transition-all hover:shadow-lg disabled:opacity-40 cursor-pointer">
            Generar Rutina
          </button>
          {error && <p className="text-red-500 text-sm mt-2 text-center">❌ {error}</p>}
        </section>

        {/* PANEL CENTRAL: RUTINA DE HOY (Col 5-8) & REPRODUCTOR (Col 9-12) */}
        <section className="lg:col-span-8 flex flex-col gap-6">
          
          {rutina ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* LISTA DE EJERCICIOS */}
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col gap-4">
                <div className="mb-2">
                  <h2 className="text-xl font-bold text-[#0F172A]">Mi Rutina de Hoy</h2>
                  <p className="text-xs text-gray-500">Haz clic en una actividad para ver detalles.</p>
                </div>
                
                {!rutinaFinalizada && !evaluada ? (
                  <div className="flex flex-col gap-3 overflow-y-auto max-h-[420px] pr-2">
                    {rutina.actividades.map((act, index) => (
                      <div key={act.id} onClick={() => setActividadActualIndex(index)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 ${actividadActualIndex === index ? 'border-[#0284C7] bg-[#F0F9FF]' : 'border-gray-100 bg-[#F8FAFC] hover:bg-gray-50'}`}>
                        
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center font-bold text-blue-700">
                          {act.orden}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-sm text-[#0F172A] truncate">{act.titulo}</h3>
                          <p className="text-xs text-gray-500">⏱️ {act.duracionTexto} • Suave</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-400 font-medium">
                    ✅ Sesión completada y guardada en tu progreso.
                  </div>
                )}
              </div>

              {/* REPRODUCTOR EN VIVO & EVALUACIÓN */}
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-between min-h-[460px]">
                
                {!rutinaFinalizada && !evaluada && (
                  <>
                    {/* Cabecera del reproductor */}
                    <div>
                      <span className="bg-[#E0F2FE] text-[#0369a1] text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">REPRODUCTOR EN VIVO</span>
                      <h2 className="text-2xl font-bold text-[#0F172A] mt-3 font-mono text-center my-6 tracking-tight">
                        {formatoTiempo(tiempoRestante)}
                      </h2>
                    </div>

                    {/* Miniatura y controles */}
                    <div className="flex-1 flex flex-col justify-center items-center gap-4 bg-[#F8FAFC] p-4 rounded-2xl border border-gray-50/50">
                      <div className="w-16 h-16 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-2xl shadow-inner">
                        {rutina.actividades[actividadActualIndex]?.orden}
                      </div>
                      <div className="text-center">
                        <h4 className="font-bold text-[#0F172A] text-sm">{rutina.actividades[actividadActualIndex]?.titulo}</h4>
                        <p className="text-xs text-gray-500 mt-1 px-4">{rutina.actividades[actividadActualIndex]?.descripcion || '¡Listo para el estiramiento!'}</p>
                      </div>
                    </div>

                    {/* Botones de acción */}
                    <div className="grid grid-cols-2 gap-2 mt-6">
                      <button onClick={() => setTimerActivo(!timerActivo)}
                        className={`py-2.5 px-4 rounded-xl text-xs font-bold text-white transition-all shadow-sm cursor-pointer ${timerActivo ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-[#0284C7] hover:bg-[#0369a1]'}`}>
                        {timerActivo ? 'PAUSAR' : 'INICIAR'}
                      </button>
                      <button onClick={terminarRutinaManualmente}
                        className="py-2.5 px-4 rounded-xl text-xs font-bold bg-red-500 hover:bg-red-600 text-white transition-all shadow-sm cursor-pointer">
                        TERMINAR
                      </button>
                    </div>
                  </>
                )}

                {/* PANEL DE EVALUACIÓN */}
                {rutinaFinalizada && !evaluada && (
                  <div className="flex-1 flex flex-col justify-between py-2">
                    <div className="text-center mb-4">
                      <span className="text-3xl">🎉</span>
                      <h3 className="font-bold text-xl text-[#0F172A] mt-2">¡Completado!</h3>
                      <p className="text-xs text-gray-500">Tu sesión ya se sumó a tu progreso. ¿Qué tal te fue en la pausa?</p>
                    </div>

                    <div className="flex flex-col gap-4 bg-[#F8FAFC] p-4 rounded-2xl">
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Nivel de Esfuerzo (1-5)</label>
                        <input type="range" min="1" max="5" value={esfuerzo} onChange={(e) => setEsfuerzo(e.target.value)} className="w-full accent-[#0284C7]" />
                        <div className="text-center font-extrabold text-[#0284C7] text-lg mt-1">{esfuerzo}</div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Utilidad (1-5)</label>
                        <input type="range" min="1" max="5" value={utilidad} onChange={(e) => setUtilidad(e.target.value)} className="w-full accent-[#0284C7]" />
                        <div className="text-center font-extrabold text-[#0284C7] text-lg mt-1">{utilidad}</div>
                      </div>
                    </div>

                    <button onClick={enviarEvaluacion}
                      className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-2xl shadow-md transition-all text-sm cursor-pointer">
                      Enviar Evaluación
                    </button>
                  </div>
                )}

                {/* ÉXITO */}
                {evaluada && (
                  <div className="flex-1 flex flex-col justify-center items-center text-center p-6 bg-green-50/50 border border-green-100 rounded-3xl gap-4">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-3xl shadow-inner">✅</div>
                    <div>
                      <h3 className="text-xl font-bold text-[#0F172A]">¡Sesión Registrada!</h3>
                      <p className="text-xs text-gray-500 mt-1 px-4">Gracias por tu retroalimentación. Hemos actualizado tu resumen de progreso en tiempo real.</p>
                    </div>
                    <div className="flex flex-wrap gap-3 justify-center mt-2">
                      <Link to="/app/inicio"
                        className="bg-[#0284C7] hover:bg-[#0369a1] text-white font-bold py-2.5 px-5 rounded-xl transition-all text-sm shadow-sm">
                        Ver mi progreso
                      </Link>
                      <button onClick={reiniciarPausa}
                        className="bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-5 rounded-xl transition-all text-sm cursor-pointer">
                        Comenzar de nuevo
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            // VISTA VACÍA
            <div className="bg-white p-12 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-center items-center text-center gap-4 min-h-[460px]">
              <div className="text-5xl">🧘‍♂️</div>
              <div>
                <h3 className="text-xl font-bold text-[#0F172A]">¡Todo listo para arrancar!</h3>
                <p className="text-sm text-gray-500 max-w-sm mt-1 mx-auto">Selecciona tus preferencias en el panel de la izquierda y haz clic en "Generar Rutina" para iniciar tu pausa activa.</p>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
