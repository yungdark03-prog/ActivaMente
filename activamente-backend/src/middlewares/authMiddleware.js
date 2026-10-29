require('dotenv').config();
const jwt = require('jsonwebtoken');

const verificarToken = (req, res, next) => {
  const token = req.header('Authorization');

  if (!token) {
    return res.status(401).json({ error: 'Acceso denegado. No se proporcionó un token.' });
  }

  try {
    const tokenLimpio = token.replace('Bearer ', '').trim();
    if (!process.env.JWT_SECRET) {
      console.error('⚠️ ALERTA DE SEGURIDAD: JWT_SECRET no está definido en el archivo .env');
    }
    const verificado = jwt.verify(tokenLimpio, process.env.JWT_SECRET || 'secreto_temporal');

    req.usuario = verificado;
    next();
  } catch (error) {
    console.error('❌ Error de verificación JWT:', error.message);
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
};

module.exports = { verificarToken };
