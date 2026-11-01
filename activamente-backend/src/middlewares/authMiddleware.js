require('dotenv').config();
const jwt = require('jsonwebtoken');
const { obtenerSecreto } = require('../config/secrets');

const verificarToken = (req, res, next) => {
  const token = req.header('Authorization');

  if (!token) {
    return res.status(401).json({ error: 'Acceso denegado. No se proporcionó un token.' });
  }

  try {
    const tokenLimpio = token.replace('Bearer ', '').trim();
    const jwtSecret = obtenerSecreto('JWT_SECRET');
    if (!jwtSecret) {
      console.error('⚠️ ALERTA DE SEGURIDAD: JWT_SECRET no está definido en el archivo .env');
    }
    const verificado = jwt.verify(tokenLimpio, jwtSecret || 'secreto_temporal');

    req.usuario = verificado;
    next();
  } catch (error) {
    console.error('❌ Error de verificación JWT:', error.message);
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
};

module.exports = { verificarToken };
