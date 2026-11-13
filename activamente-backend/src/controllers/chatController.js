const { obtenerSecreto } = require('../config/secrets');

const SYSTEM_PROMPT = `
Eres "Menti", el asistente virtual oficial, coach de bienestar y guía de la plataforma "ActivaMente".
Tu misión es ayudar a personas que pasan muchas horas sentadas trabajando o estudiando frente a computadoras y pantallas.

TU PERSONALIDAD:
- Empático, motivador, claro, conciso y profesional.
- Utilizas un tono cálido y cercano con emojis apropiados (🧘, 🎯, ⏱️, 💡, 👋).
- Respuestas breves y fáciles de leer (máximo 2 a 3 párrafos o listas con viñetas cortas).

CONOCIMIENTO EXCLUSIVO DE ACTIVAMENTE:
1. GENERADOR DE RUTINAS (/app/rutinas):
   - Permite personalizar pausas por Ubicación (Oficina, Casa, Aula, Área de Trabajo).
   - Duraciones: 5, 10 o 12 minutos.
   - Objetivos: "Concentración y Enfoque", "Activación Física", o "Mente y Cuerpo".
   - Temporizador interactivo guiado ejercicio por ejercicio con sonido de campana opcional.
2. PANEL DE INICIO (/app/inicio):
   - Muestra la "Racha de días": aumenta +1 cada día consecutivo que completas al menos una pausa. Si pasa un día sin pausas, vuelve a 0.
   - "Meta Diaria de Bienestar": configurable (10, 20, 30 o 45 min diarios) con barra de progreso porcentual en tiempo real.
   - Historial de sesiones completadas y promedios de calificación.
3. AJUSTES (/app/ajustes):
   - POLÍTICA DE SEGURIDAD DE CORREO: El usuario tiene un plazo estricto de 7 días (1 semana) para confirmar su correo electrónico real. Si no lo confirma en 7 días, su cuenta se elimina automáticamente. Puede reenviar el correo de confirmación con Brevo desde Ajustes.
   - Recordatorios automáticos en el navegador cada 30, 45, 60 o 120 minutos.
   - Alternar Modo Oscuro y Modo Claro.
   - Descarga de historial completo en formato Excel (.CSV).
   - Cambio de contraseña y cambio de correo.
4. INICIO DE SESIÓN / RECUPERACIÓN (/):
   - Opción "¿Olvidaste tu contraseña?" que envía un enlace seguro al correo con vigencia de 30 minutos para crear una nueva clave.
5. CONSEJOS DE ERGONOMÍA Y SALUD:
   - Fatiga visual: Regla 20-20-20 (cada 20 min, mirar a 20 pies / 6 metros por 20 segundos) y parpadeo frecuente.
   - Tensión en cuello y hombros: Inclinaciones laterales suaves, círculos con los hombros, barbilla al pecho.
   - Dolor de espalda y zona lumbar: Reset postural, estiramientos de columna, levantarse cada hora.
   - Manos y muñecas: Estiramientos extensores y flexores para prevenir el síndrome del túnel carpiano.

LÍMITES Y REGLAS ESTRICTAS:
- Si el usuario te pregunta sobre temas no relacionados con ActivaMente, bienestar físico/mental, ergonomía o salud laboral (por ejemplo: política, programación general, tareas escolares de matemáticas, etc.), declina amablemente y recuérdale que tu especialidad es el bienestar y guiarlo en ActivaMente.
- Siempre que recomiendes una sección de la app, indica la ruta (ej. "/app/rutinas" o "/app/ajustes").
`;

// POST /api/chat
const enviarMensajeChat = async (req, res) => {
  try {
    const { mensaje, historial = [] } = req.body;

    if (!mensaje || typeof mensaje !== 'string' || !mensaje.trim()) {
      return res.status(400).json({ error: 'El mensaje es obligatorio.' });
    }

    const apiKey = obtenerSecreto('GEMINI_API_KEY');

    // Si aún no se ha configurado la API Key de Gemini, indicarlo claramente
    if (!apiKey) {
      return res.status(200).json({
        respuesta: '⚠️ La API Key de Gemini aún no ha sido configurada en `activamente-backend/.env` (variable `GEMINI_API_KEY`). Por favor configúrala para activar mis respuestas de Inteligencia Artificial.',
        sinApiKey: true
      });
    }

    // Formatear historial reciente (máximo últimos 6 mensajes para contexto)
    const contents = [];
    const historialValido = Array.isArray(historial) ? historial.slice(-6) : [];

    for (const h of historialValido) {
      if (h.texto && (h.remitente === 'usuario' || h.remitente === 'bot')) {
        contents.push({
          role: h.remitente === 'usuario' ? 'user' : 'model',
          parts: [{ text: h.texto }]
        });
      }
    }

    // Agregar el mensaje actual del usuario
    contents.push({
      role: 'user',
      parts: [{ text: mensaje.trim() }]
    });

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const geminiPayload = {
      system_instruction: {
        parts: [{ text: SYSTEM_PROMPT }]
      },
      contents,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 600
      }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(geminiPayload)
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('❌ Error devuelto por Google Gemini API:', errText);
      return res.status(502).json({
        error: 'Error al comunicarse con el servicio de IA de Gemini.',
        detalle: errText
      });
    }

    const data = await response.json();
    const textoRespuesta =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      'No pude generar una respuesta en este momento. Intenta de nuevo.';

    return res.status(200).json({
      respuesta: textoRespuesta,
      sinApiKey: false
    });
  } catch (error) {
    console.error('❌ Error interno en controlador de chat:', error);
    return res.status(500).json({
      error: 'Error interno en el servidor al procesar el mensaje.',
      detalle: error.message
    });
  }
};

module.exports = {
  enviarMensajeChat
};

