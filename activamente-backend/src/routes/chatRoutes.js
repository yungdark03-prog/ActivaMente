const express = require('express');
const router = express.Router();
const { enviarMensajeChat } = require('../controllers/chatController');
const { verificarToken } = require('../middlewares/authMiddleware');
const { chatLimiter } = require('../middlewares/rateLimitMiddleware');

// POST /api/chat (Protegido con JWT y límite de tasa para usuarios autenticados)
router.post('/', chatLimiter, verificarToken, enviarMensajeChat);

module.exports = router;

