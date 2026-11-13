import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from './api';

// Base de conocimiento interactiva de ActivaMente
const RESPUESTAS_BASE = [
  {
    claves: ['hola', 'buenos dias', 'buenas tardes', 'buenas noches', 'saludos', 'que tal', 'inicio', 'empezar', 'ayuda'],
    respuesta: '¡Hola! 👋 Soy **Menti**, tu asistente personal de bienestar y guía en ActivaMente.\n\nPuedo orientarte sobre cómo usar cualquier sección de la plataforma o darte consejos rápidos de ergonomía y pausas activas.\n\n¿En qué te gustaría que te ayude hoy?',
    sugerencias: ['🎯 ¿Cómo generar una rutina?', '⏳ Verificación de correo (7 días)', '🧘 Pausa rápida para cuello/ojos', '🔔 Recordatorios en el navegador']
  },
  {
    claves: ['generar', 'rutina', 'ejercicio', 'pausa', 'hacer rutina', 'generador', 'como empezar'],
    respuesta: 'Puedes generar una pausa activa en 3 simples pasos desde el **Generador de Rutinas**:\n\n1. Elige tu **Ubicación** (Oficina, Casa, Aula, etc.).\n2. Selecciona la **Duración** (5, 10 o 12 minutos).\n3. Escoge tu **Objetivo** (Concentración, Activación Física o Mente y Cuerpo).\n\n¡Al darle a *Generar Rutina*, el temporizador te guiará ejercicio por ejercicio!',
    accion: { texto: 'Ir al Generador de Rutinas 🚀', ruta: '/app/rutinas' },
    sugerencias: ['⏱️ ¿Cómo funciona el temporizador?', '🎯 Elegir objetivo por defecto']
  },
  {
    claves: ['temporizador', 'reloj', 'sonido', 'campana', 'alarma'],
    respuesta: 'El **temporizador inteligente** avanza automáticamente entre cada ejercicio de tu rutina.\n\n🔔 Puedes activar o silenciar el **sonido de campana** de finalización desde la sección de **Ajustes** en cualquier momento.',
    accion: { texto: 'Ajustar sonido en Ajustes ⚙️', ruta: '/app/ajustes' },
    sugerencias: ['🎯 ¿Cómo generar una rutina?', '🔔 Recordatorios en el navegador']
  },
  {
    claves: ['correo', 'verificar', 'confirmar', 'confirmacion', '7 dias', 'una semana', 'eliminar cuenta', 'se borra', 'expira'],
    respuesta: '⚠️ **Importante sobre la verificación de correo:**\n\n• Tienes un plazo de **1 semana (7 días)** desde que creaste tu cuenta para confirmar tu correo electrónico.\n• Si no confirmas tu correo en ese plazo, la cuenta se eliminará automáticamente por seguridad.\n• Puedes acceder y usar la app de inmediato, y reenviar el enlace desde **Ajustes** si no te llegó.',
    accion: { texto: 'Verificar o Reenviar en Ajustes 📨', ruta: '/app/ajustes' },
    sugerencias: ['🔑 Cambiar contraseña', '📧 Reenviar correo']
  },
  {
    claves: ['cuello', 'cervical', 'hombros', 'trapecio', 'dolor de cuello'],
    respuesta: '🧘 **Alivio rápido para tensión de cuello y hombros (1 minuto):**\n\n1. **Inclinación lateral:** Inclina suavemente la oreja derecha hacia tu hombro derecho. Mantén 15 segundos sin forzar. Cambia al lado izquierdo.\n2. **Rotación de hombros:** Dibuja 5 círculos lentos hacia atrás con tus hombros y luego 5 hacia adelante.\n3. **Barbilla al pecho:** Baja la cabeza lentamente mirando al suelo para estirar la parte posterior del cuello durante 15 segundos.',
    accion: { texto: 'Generar rutina de Mente y Cuerpo 🧘', ruta: '/app/rutinas' },
    sugerencias: ['👀 Fatiga visual (ojos cansados)', '🪑 Dolor de espalda o lumbar']
  },
  {
    claves: ['ojos', 'vista', 'pantalla', 'cansancio visual', 'fatiga visual', 'ceguera', 'parpadeo'],
    respuesta: '👀 **Aplica la Regla 20-20-20 para fatiga visual:**\n\nCada **20 minutos** de mirar la pantalla:\n• Mira un objeto que esté a **20 pies (unos 6 metros)** de distancia.\n• Mantén la mirada durante **20 segundos**.\n• Parpadea suavemente 10 veces seguidas para rehidratar tus ojos.\n\nEsto relaja el músculo ciliar y previene el dolor de cabeza.',
    sugerencias: ['🧘 Pausa rápida para cuello/ojos', '🔔 Recordatorios automáticos']
  },
  {
    claves: ['espalda', 'lumbar', 'columna', 'postura', 'sentado', 'silla'],
    respuesta: '🪑 **Reset postural para espalda y zona lumbar:**\n\n1. Apoya ambos pies planos en el piso a la anchura de tus caderas.\n2. Entrelaza tus manos y estira los brazos hacia el techo, inhalando hondo.\n3. Rota suavemente el torso hacia la derecha sujetando el respaldo de tu silla 10 segundos, luego hacia la izquierda.\n4. Ponte de pie y camina 1 minuto para reactivar la circulación.',
    accion: { texto: 'Hacer una pausa activa ahora 💪', ruta: '/app/rutinas' },
    sugerencias: ['🧘 Pausa rápida para cuello/ojos', '🎯 ¿Cómo generar una rutina?']
  },
  {
    claves: ['muneca', 'munecas', 'manos', 'dedos', 'teclado', 'raton', 'mouse', 'tunel carpiano'],
    respuesta: '🤲 **Estiramiento de muñecas y manos:**\n\n1. Extiende un brazo al frente con la palma hacia adelante (como diciendo "alto").\n2. Con la otra mano, jala suavemente los dedos hacia ti durante 15 segundos.\n3. Ahora gira la palma hacia ti (dedos apuntando al suelo) y jala con suavidad 15 segundos.\n4. Sacude ambas manos como si estuvieras secándote agua.',
    sugerencias: ['🧘 Pausa rápida para cuello/ojos', '🎯 ¿Cómo generar una rutina?']
  },
  {
    claves: ['recordatorio', 'recordatorios', 'notificacion', 'notificaciones', 'avisar', 'aviso'],
    respuesta: '🔔 **Recordatorios Inteligentes en el Navegador:**\n\nPuedes configurar que ActivaMente te envíe una notificación en tu computadora cada **30 min, 45 min, 1 hora o 2 horas** mientras estás en la web.\n\nSolo activa la opción en **Ajustes** y acepta los permisos de notificación de tu navegador.',
    accion: { texto: 'Configurar Recordatorios en Ajustes 🔔', ruta: '/app/ajustes' },
    sugerencias: ['🎯 Meta diaria de bienestar', '⏳ Verificación de correo (7 días)']
  },
  {
    claves: ['meta', 'metas', 'minutos al dia', 'meta diaria', 'objetivo diario'],
    respuesta: '🎯 **Meta Diaria de Bienestar:**\n\nPuedes definir una meta de **10, 20, 30 o 45 minutos** de pausas al día.\n\nEn tu pantalla de **Inicio** verás una barra de progreso porcentual que se llena en tiempo real conforme completas rutinas.',
    accion: { texto: 'Ver mi progreso en Inicio 📊', ruta: '/app/inicio' },
    sugerencias: ['🔥 ¿Cómo funciona la racha diaria?', '⚙️ Cambiar meta en Ajustes']
  },
  {
    claves: ['racha', 'dias consecutivos', 'historial', 'fuego', 'progreso'],
    respuesta: '🔥 **Racha de Días Consecutivos:**\n\nTu racha aumenta en +1 cada día que completas al menos una pausa activa en la plataforma.\n\nSi dejas pasar un día completo sin realizar ninguna pausa, la racha vuelve a cero. ¡Mantén vivo el hábito!',
    accion: { texto: 'Revisar mi racha en Inicio 🔥', ruta: '/app/inicio' },
    sugerencias: ['🎯 Meta diaria de bienestar', '📥 Exportar historial a Excel']
  },
  {
    claves: ['modo oscuro', 'tema', 'oscuro', 'claro', 'noche'],
    respuesta: '🌙 **Modo Oscuro / Claro:**\n\nPuedes alternar el tema visual de toda la plataforma en la esquina superior derecha de **Ajustes** con el botón `🌙 Modo Oscuro / ☀️ Modo Claro`.\n\nEs ideal para descansar la vista en ambientes con poca iluminación.',
    accion: { texto: 'Cambiar Modo en Ajustes 🌙', ruta: '/app/ajustes' },
    sugerencias: ['👀 Fatiga visual (ojos cansados)', '⚙️ Ir a Ajustes']
  },
  {
    claves: ['password', 'contrasena', 'clave', 'cambiar password', 'olvide mi clave', 'restablecer'],
    respuesta: '🔑 **Gestión de Contraseña:**\n\n• **Si estás dentro de tu cuenta:** Puedes cambiar tu contraseña en **Ajustes → Seguridad de la Cuenta** ingresando tu clave actual y la nueva.\n• **Si olvidaste tu clave:** En la pantalla de **Iniciar Sesión**, presiona `¿Olvidaste tu contraseña?` y te enviaremos un enlace a tu correo real válido por 30 minutos.',
    accion: { texto: 'Ir a Seguridad en Ajustes 🔑', ruta: '/app/ajustes' },
    sugerencias: ['⏳ Verificación de correo (7 días)', '⚙️ Ajustes de Cuenta']
  },
  {
    claves: ['exportar', 'csv', 'excel', 'descargar historial', 'reporte'],
    respuesta: '📥 **Descarga de Historial:**\n\nEn la sección de **Ajustes**, dentro de la tarjeta *Mis Datos y Reportes*, puedes descargar un archivo `.CSV` compatible con Excel con todas tus pausas, fechas, tiempos y calificaciones registradas.',
    accion: { texto: 'Descargar historial en Ajustes 📥', ruta: '/app/ajustes' },
    sugerencias: ['🔥 ¿Cómo funciona la racha diaria?', '⚙️ Ir a Ajustes']
  }
];

export default function Chatbot() {
  const navigate = useNavigate();
  const [abierto, setAbierto] = useState(false);
  const [mensajes, setMensajes] = useState([
    {
      id: 1,
      remitente: 'bot',
      texto: '¡Hola! Soy **Menti**, tu asistente de ActivaMente 👋\n\n¿En qué puedo ayudarte hoy?',
      sugerencias: [
        '🎯 ¿Cómo generar una rutina?',
        '⏳ Verificación de correo',
        '🧘 Pausa rápida (cuello/ojos)',
        '🔔 Recordatorios'
      ]
    }
  ]);
  const [inputTexto, setInputTexto] = useState('');
  const [escribiendo, setEscribiendo] = useState(false);
  const mensajesFinRef = useRef(null);

  const scrollToBottom = () => {
    mensajesFinRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (abierto) {
      scrollToBottom();
    }
  }, [mensajes, abierto, escribiendo]);

  const normalizar = (txt) => {
    return txt
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  };

  const buscarRespuesta = (consulta) => {
    const limpia = normalizar(consulta);

    // Buscar coincidencia en la base de conocimientos
    for (const item of RESPUESTAS_BASE) {
      const coincide = item.claves.some((clave) => limpia.includes(normalizar(clave)));
      if (coincide) {
        return item;
      }
    }

    // Respuesta por defecto con sugerencias útiles
    return {
      respuesta: 'No estoy seguro de entender esa consulta exacta, pero puedo orientarte en los temas principales de **ActivaMente**:\n\n• ¿Cómo generar pausas activas?\n• Ejercicios rápidos para cuello, espalda o vista.\n• Verificación de cuenta y seguridad.\n• Configuración de metas y recordatorios.\n\nPrueba seleccionando una de las opciones:',
      sugerencias: [
        '🎯 ¿Cómo generar una rutina?',
        '🧘 Pausa rápida para cuello/ojos',
        '⏳ Verificación de correo (7 días)',
        '🔔 Recordatorios en el navegador'
      ]
    };
  };

  const enviarMensaje = async (textoAEnviar) => {
    const texto = (textoAEnviar || inputTexto).trim();
    if (!texto) return;

    const mensajeUsuario = {
      id: Date.now(),
      remitente: 'usuario',
      texto
    };

    const nuevoHistorial = [...mensajes, mensajeUsuario];
    setMensajes(nuevoHistorial);
    setInputTexto('');
    setEscribiendo(true);

    try {
      // 1. Intentar responder con la IA de Google Gemini mediante el backend
      const res = await api.post('/chat', {
        mensaje: texto,
        historial: nuevoHistorial.slice(-6)
      });

      if (res.data?.sinApiKey) {
        // Si aún no han pegado la clave en .env, usamos la base inteligente local
        const match = buscarRespuesta(texto);
        setMensajes((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            remitente: 'bot',
            texto: `${match.respuesta}\n\n💡 *(Para activar el razonamiento con IA de Gemini en tiempo real, pega tu \`GEMINI_API_KEY\` en \`.env\`)*`,
            accion: match.accion,
            sugerencias: match.sugerencias
          }
        ]);
      } else {
        const respuestaIA = res.data.respuesta;
        let accionDetectada = null;

        if (respuestaIA.includes('/app/rutinas')) {
          accionDetectada = { texto: 'Ir al Generador de Rutinas 🚀', ruta: '/app/rutinas' };
        } else if (respuestaIA.includes('/app/ajustes')) {
          accionDetectada = { texto: 'Ir a Ajustes de Cuenta ⚙️', ruta: '/app/ajustes' };
        } else if (respuestaIA.includes('/app/inicio')) {
          accionDetectada = { texto: 'Ver mi Panel de Inicio 📊', ruta: '/app/inicio' };
        }

        setMensajes((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            remitente: 'bot',
            texto: respuestaIA,
            accion: accionDetectada,
            esIA: true,
            sugerencias: ['🎯 Generar una pausa', '🧘 Ejercicios para cuello/espalda', '⏳ Verificación de cuenta']
          }
        ]);
      }
    } catch (err) {
      // Fallback automático local si no hay internet o falla el servidor
      const match = buscarRespuesta(texto);
      setMensajes((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          remitente: 'bot',
          texto: match.respuesta,
          accion: match.accion,
          sugerencias: match.sugerencias
        }
      ]);
    } finally {
      setEscribiendo(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      enviarMensaje();
    }
  };

  const ejecutarAccion = (ruta) => {
    if (ruta) {
      navigate(ruta);
      setAbierto(false);
    }
  };

  const formatearTexto = (txt) => {
    return txt.split('\n').map((linea, idx) => {
      // Reemplazo básico de negrita markdown **texto**
      const partes = linea.split(/(\*\*.*?\*\*)/g);
      return (
        <span key={idx} className="block min-h-[1.1rem]">
          {partes.map((parte, pIdx) => {
            if (parte.startsWith('**') && parte.endsWith('**')) {
              return <strong key={pIdx}>{parte.slice(2, -2)}</strong>;
            }
            return parte;
          })}
        </span>
      );
    });
  };

  return (
    <div className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-50 font-sans">
      {/* VENTANA DEL CHAT */}
      {abierto && (
        <div className="w-[calc(100vw-2rem)] sm:w-[400px] h-[500px] sm:h-[540px] max-h-[75vh] bg-white rounded-3xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden animate-fade-in mb-3">
          
          {/* ENCABEZADO */}
          <div className="bg-gradient-to-r from-[#1E1B29] to-[#0284C7] p-4 text-white flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-xl shadow-inner border border-white/20">
                🤖
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-extrabold text-sm tracking-tight leading-none">Menti</h3>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="bg-white/20 text-[10px] font-bold px-1.5 py-0.5 rounded-md text-blue-100">IA</span>
                </div>
                <p className="text-[11px] text-blue-100 mt-0.5">Asistente ActivaMente (Gemini)</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() =>
                  setMensajes([
                    {
                      id: Date.now(),
                      remitente: 'bot',
                      texto: '¡Chat reiniciado! ¿En qué otra cosa te puedo ayudar? 😊',
                      sugerencias: [
                        '🎯 ¿Cómo generar una rutina?',
                        '🧘 Pausa rápida (cuello/ojos)',
                        '⏳ Verificación de correo'
                      ]
                    }
                  ])
                }
                title="Reiniciar conversación"
                className="p-1.5 rounded-xl hover:bg-white/10 text-blue-100 hover:text-white transition-all text-xs"
              >
                🔄
              </button>
              <button
                type="button"
                onClick={() => setAbierto(false)}
                title="Cerrar chat"
                className="p-1.5 rounded-xl hover:bg-white/10 text-blue-100 hover:text-white transition-all text-sm font-bold"
              >
                ✕
              </button>
            </div>
          </div>

          {/* CUERPO DE MENSAJES */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-[#F8FAFC]/50 text-sm">
            {mensajes.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${
                  m.remitente === 'usuario' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`max-w-[85%] p-3.5 rounded-2xl shadow-sm text-[13px] leading-relaxed ${
                    m.remitente === 'usuario'
                      ? 'bg-[#0284C7] text-white rounded-br-sm'
                      : 'bg-white text-gray-800 border border-gray-100 rounded-bl-sm'
                  }`}
                >
                  {formatearTexto(m.texto)}

                  {/* Botón de acción directa si la respuesta lo incluye */}
                  {m.accion && (
                    <button
                      type="button"
                      onClick={() => ejecutarAccion(m.accion.ruta)}
                      className="mt-3 w-full bg-[#0F172A] hover:bg-[#1E293B] text-white font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
                    >
                      {m.accion.texto}
                    </button>
                  )}
                </div>

                {/* Sugerencias interactivas asociadas a la respuesta */}
                {m.sugerencias && m.sugerencias.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2 max-w-[92%]">
                    {m.sugerencias.map((sug, sIdx) => (
                      <button
                        key={sIdx}
                        type="button"
                        onClick={() => enviarMensaje(sug)}
                        className="bg-white hover:bg-blue-50 text-[#0284C7] border border-blue-200/80 rounded-xl px-2.5 py-1 text-[11px] font-semibold transition-all hover:scale-[1.02] shadow-xs cursor-pointer text-left"
                      >
                        {sug}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {escribiendo && (
              <div className="flex items-center gap-1.5 bg-white border border-gray-100 px-3.5 py-2 rounded-2xl w-fit shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0284C7] animate-bounce"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#0284C7] animate-bounce [animation-delay:0.15s]"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#0284C7] animate-bounce [animation-delay:0.3s]"></span>
              </div>
            )}
            <div ref={mensajesFinRef} />
          </div>

          {/* BARRA DE ENTRADA */}
          <div className="p-3 bg-white border-t border-gray-100 flex items-center gap-2">
            <input
              type="text"
              value={inputTexto}
              onChange={(e) => setInputTexto(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Pregúntame algo sobre la web o ejercicios..."
              className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-800 placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-[#0284C7] outline-none transition-all"
            />
            <button
              type="button"
              onClick={() => enviarMensaje()}
              disabled={!inputTexto.trim()}
              className="w-9 h-9 rounded-xl bg-[#0284C7] hover:bg-[#0369a1] disabled:opacity-40 text-white flex items-center justify-center transition-all shadow-sm shrink-0 cursor-pointer"
              title="Enviar mensaje"
            >
              <svg className="w-4 h-4 translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* BOTÓN FLOTANTE TRIGGER */}
      <button
        type="button"
        onClick={() => setAbierto(!abierto)}
        className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#1E1B29] to-[#0284C7] hover:scale-105 active:scale-95 text-white flex items-center justify-center shadow-xl transition-all border-2 border-white cursor-pointer relative group"
        title="Abrir asistente Menti"
      >
        <span className="text-2xl transition-transform group-hover:rotate-12">
          {abierto ? '✕' : '🤖'}
        </span>

        {!abierto && (
          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-white"></span>
          </span>
        )}
      </button>
    </div>
  );
}

