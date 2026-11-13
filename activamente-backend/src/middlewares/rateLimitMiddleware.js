const rateLimit = require('express-rate-limit');

// Límite general para toda la API (protege contra abusos y scraping)
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Demasiadas peticiones en poco tiempo. Por favor espera un momento e intenta de nuevo.'
  }
});

// Límite estricto para rutas de autenticación y envío de correos (anti fuerza bruta)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Demasiados intentos de acceso o verificación. Por seguridad, espera 15 minutos antes de volver a intentarlo.'
  }
});

// Límite específico para el chatbot con IA (protege la cuota de Gemini API)
const chatLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutos
  max: 25,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Has enviado muchos mensajes seguidos al asistente. Espera unos minutos antes de continuar.'
  }
});

module.exports = {
  apiLimiter,
  authLimiter,
  chatLimiter
};
