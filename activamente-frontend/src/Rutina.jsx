import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from './api';
import { obtenerGuiaEjercicio, IlustracionEjercicio } from './guiaEjercicios';

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
  const [sonidoHabilitado, setSonidoHabilitado] = useState(true);

  const reproducirSonidoCampana = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      [523.25, 659.25, 783.99].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.18);
        gain.gain.setValueAtTime(0.22, ctx.currentTime + idx * 0.18);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.18 + 0.6);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.18);
        osc.stop(ctx.currentTime + idx * 0.18 + 0.6);
      });
    } catch (e) {
      // Ignorar si el navegador bloquea audio automático
    }
  };

  useEffect(() => {
    api.get('/usuarios/perfil').then(res => {
      if (res.data?.ubicacionPorDefecto) setUbicacion(res.data.ubicacionPorDefecto);
      if (res.data?.tiempoPorDefecto) setTiempo(String(res.data.tiempoPorDefecto));
      if (res.data?.objetivoPorDefecto) setObjetivo(res.data.objetivoPorDefecto);
      if (res.data?.sonidoTemporizador !== undefined) setSonidoHabilitado(Boolean(res.data.sonidoTemporizador));
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
      if (sonidoHabilitado) {
        reproducirSonidoCampana();
      }
      if (rutina?.sesionId) {
        marcarSesionCompletada(rutina.sesionId);
      }
    }
    return () => clearInterval(intervalo);
  }, [timerActivo, tiempoRestante, rutina, sonidoHabilitado]);

  // Avance automático de ejercicio según el tiempo transcurrido cuando el temporizador está activo
  useEffect(() => {
    if (!timerActivo || !rutina?.actividades?.length) return;
    const total = Number(rutina.duracionEstimadaSegundos || 0);
    if (total <= 0) return;

    const transcurrido = total - tiempoRestante;
    let acumulado = 0;
    for (let i = 0; i < rutina.actividades.length; i++) {
      acumulado += Number(rutina.actividades[i].duracionSegundos || 60);
      if (transcurrido < acumulado) {
        if (i !== actividadActualIndex) {
          setActividadActualIndex(i);
        }
        break;
      }
    }
  }, [tiempoRestante, timerActivo, rutina]);

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

  const actividadActual = rutina?.actividades?.[actividadActualIndex] || null;
  const guiaActual = actividadActual ? obtenerGuiaEjercicio(actividadActual) : null;

  return (
    <div className="animate-fade-in text-gray-800 font-sans">
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-[#0F172A] tracking-tight">Mi Espacio de Bienestar</h1>
          <p className="text-gray-500 mt-1">Configura y ejecuta tus pausas activas diarias con guía visual paso a paso.</p>
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

        {/* PANEL CENTRAL: RUTINA DE HOY Y GUÍA INTERACTIVA (Col 5-12) */}
        <section className="lg:col-span-8 flex flex-col gap-6">
          
          {rutina ? (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              
              {/* LISTA DE EJERCICIOS (Col 1-5) */}
              <div className="md:col-span-5 bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col gap-4">
                <div className="mb-1">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-[#0F172A]">Mi Rutina de Hoy</h2>
                    <span className="text-xs font-bold text-[#0284C7] bg-[#F0F9FF] px-2.5 py-1 rounded-full">
                      {rutina.actividades.length} ejercicios
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Selecciona cualquier ejercicio para ver su ilustración y pasos.
                  </p>
                </div>
                
                {!rutinaFinalizada && !evaluada ? (
                  <div className="flex flex-col gap-3 overflow-y-auto max-h-[580px] pr-1">
                    {rutina.actividades.map((act, index) => {
                      const guiaItem = obtenerGuiaEjercicio(act);
                      const seleccionado = actividadActualIndex === index;
                      return (
                        <div
                          key={act.id || index}
                          onClick={() => setActividadActualIndex(index)}
                          className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                            seleccionado
                              ? 'border-[#0284C7] bg-[#F0F9FF] shadow-sm'
                              : 'border-gray-100 bg-[#F8FAFC] hover:bg-gray-50'
                          }`}
                        >
                          <div
                            className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center font-bold shrink-0 ${
                              seleccionado ? 'bg-[#0284C7] text-white' : 'bg-blue-100 text-blue-700'
                            }`}
                          >
                            <span className="text-base leading-none">{guiaItem.icono}</span>
                            <span className="text-[10px] leading-none mt-0.5">#{act.orden}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-sm text-[#0F172A] leading-snug">{act.titulo}</h3>
                            <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full border mt-1 ${guiaItem.colorBadge}`}>
                              {guiaItem.categoria}
                            </span>
                            <p className="text-xs text-gray-500 mt-1">
                              ⏱️ {act.duracionSegundos ? `${act.duracionSegundos}s (${act.duracionTexto})` : act.duracionTexto} • {guiaItem.pasos.length} pasos
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-400 font-medium">
                    ✅ Sesión completada y guardada en tu progreso.
                  </div>
                )}
              </div>

              {/* REPRODUCTOR EN VIVO + ILUSTRACIÓN + INSTRUCCIONES PASO A PASO (Col 6-12) */}
              <div className="md:col-span-7 bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-between min-h-[540px]">
                
                {!rutinaFinalizada && !evaluada && actividadActual && guiaActual && (
                  <>
                    {/* Cabecera del reproductor y temporizador */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-gray-100">
                      <div className="flex items-center gap-2">
                        <span className="bg-[#E0F2FE] text-[#0369a1] text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                          Ejercicio {actividadActual.orden} de {rutina.actividades.length}
                        </span>
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${guiaActual.colorBadge}`}>
                          {guiaActual.icono} {guiaActual.categoria}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-[#F8FAFC] px-3.5 py-1.5 rounded-xl border border-gray-200">
                        <span className="text-xs text-gray-500 font-semibold">Tiempo total:</span>
                        <span className="text-xl font-extrabold text-[#0F172A] font-mono tracking-tight">
                          {formatoTiempo(tiempoRestante)}
                        </span>
                      </div>
                    </div>

                    {/* Título y descripción general */}
                    <div className="mt-4 mb-3">
                      <h3 className="text-lg font-extrabold text-[#0F172A]">
                        {actividadActual.orden}. {actividadActual.titulo}
                      </h3>
                      {actividadActual.descripcion && (
                        <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                          {actividadActual.descripcion}
                        </p>
                      )}
                    </div>

                    {/* Ilustración animada del ejercicio */}
                    <IlustracionEjercicio
                      idGuia={guiaActual.idGuia}
                      multimedia={actividadActual.multimedia}
                      titulo={actividadActual.titulo}
                    />

                    {/* Tarjetas rápidas de Postura y Respiración */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-3">
                      <div className="bg-[#F8FAFC] p-3 rounded-xl border border-gray-100">
                        <p className="text-[11px] font-bold text-[#0284C7] uppercase tracking-wide">
                          🪑 Postura inicial
                        </p>
                        <p className="text-xs text-gray-700 mt-0.5 font-medium">
                          {guiaActual.postura}
                        </p>
                      </div>
                      <div className="bg-[#F8FAFC] p-3 rounded-xl border border-gray-100">
                        <p className="text-[11px] font-bold text-teal-700 uppercase tracking-wide">
                          🌬️ Respiración
                        </p>
                        <p className="text-xs text-gray-700 mt-0.5 font-medium">
                          {guiaActual.respiracion}
                        </p>
                      </div>
                    </div>

                    {/* Lista de Instrucciones Paso a Paso */}
                    <div className="mt-4 bg-[#F8FAFC] p-4 rounded-2xl border border-gray-100">
                      <h4 className="text-xs font-extrabold text-[#0F172A] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                        <span>📋</span> Instrucciones paso a paso
                      </h4>
                      <ol className="flex flex-col gap-2.5">
                        {guiaActual.pasos.map((paso, idx) => (
                          <li key={idx} className="flex items-start gap-2.5 text-xs text-gray-700 leading-relaxed">
                            <span className="w-5 h-5 rounded-full bg-[#0284C7] text-white font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                              {idx + 1}
                            </span>
                            <span>{paso}</span>
                          </li>
                        ))}
                      </ol>
                    </div>

                    {/* Consejo ergonómico */}
                    <div className="mt-3 bg-amber-50/80 border border-amber-200/80 rounded-xl p-3 flex items-start gap-2">
                      <span className="text-base leading-none mt-0.5">💡</span>
                      <p className="text-xs text-amber-900 leading-snug">
                        <strong className="font-bold">Consejo saludable: </strong>
                        {guiaActual.consejo}
                      </p>
                    </div>

                    {/* Navegación entre ejercicios (Anterior / Siguiente) */}
                    <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-gray-100">
                      <button
                        type="button"
                        onClick={() => setActividadActualIndex((prev) => Math.max(0, prev - 1))}
                        disabled={actividadActualIndex === 0}
                        className="py-2 px-3.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-40 cursor-pointer"
                      >
                        ← Ejercicio anterior
                      </button>
                      <span className="text-xs text-gray-400 font-semibold">
                        {actividadActualIndex + 1} / {rutina.actividades.length}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setActividadActualIndex((prev) =>
                            Math.min(rutina.actividades.length - 1, prev + 1)
                          )
                        }
                        disabled={actividadActualIndex === rutina.actividades.length - 1}
                        className="py-2 px-3.5 rounded-xl border border-gray-200 text-xs font-bold text-[#0284C7] hover:bg-[#F0F9FF] disabled:opacity-40 cursor-pointer"
                      >
                        Siguiente ejercicio →
                      </button>
                    </div>

                    {/* Botones de acción del temporizador */}
                    <div className="grid grid-cols-2 gap-3 mt-4">
                      <button onClick={() => setTimerActivo(!timerActivo)}
                        className={`py-3 px-4 rounded-xl text-xs font-bold text-white transition-all shadow-sm cursor-pointer ${timerActivo ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-[#0284C7] hover:bg-[#0369a1]'}`}>
                        {timerActivo ? '⏸ PAUSAR TEMPORIZADOR' : '▶ INICIAR PAUSA ACTIVA'}
                      </button>
                      <button onClick={terminarRutinaManualmente}
                        className="py-3 px-4 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-sm cursor-pointer">
                        ✓ COMPLETAR Y EVALUAR
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
            // VISTA VACÍA CON VISTA PREVIA DE LAS GUÍAS DISPONIBLES
            <div className="bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-center items-center text-center gap-6 min-h-[460px]">
              <div className="text-5xl">🧘‍♂️</div>
              <div>
                <h3 className="text-xl font-bold text-[#0F172A]">¡Todo listo para arrancar!</h3>
                <p className="text-sm text-gray-500 max-w-md mt-1 mx-auto">
                  Selecciona tus preferencias en el panel de la izquierda y haz clic en <strong>"Generar Rutina"</strong>. Cada ejercicio incluirá su <strong>ilustración animada</strong> e <strong>instrucciones paso a paso</strong>.
                </p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-xl mt-2">
                {[
                  { icono: '🦒', nombre: 'Cuello y Cervicales' },
                  { icono: '🙆‍♂️', nombre: 'Hombros y Espalda' },
                  { icono: '👁️', nombre: 'Descanso Visual' },
                  { icono: '🌬️', nombre: 'Respiración Guiada' }
                ].map((item) => (
                  <div key={item.nombre} className="bg-[#F8FAFC] border border-gray-100 rounded-2xl p-3 flex flex-col items-center gap-1">
                    <span className="text-2xl">{item.icono}</span>
                    <span className="text-xs font-semibold text-gray-600">{item.nombre}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
