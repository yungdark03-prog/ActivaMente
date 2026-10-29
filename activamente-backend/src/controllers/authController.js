const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { poolPromise, sql } = require('../config/db');

// POST /api/auth/registro
const registrarUsuario = async (req, res) => {
  try {
    const { nombre, email, password, ocupacion } = req.body;

    if (!nombre || !email || !password) {
      return res.status(400).json({ error: 'Nombre, email y password son obligatorios' });
    }

    const emailLimpio = email.trim().toLowerCase();
    const pool = await poolPromise;

    const checkUser = await pool.request()
      .input('email', sql.NVarChar, emailLimpio)
      .query('SELECT Id FROM dbo.Usuarios WHERE Email = @email');

    if (checkUser.recordset.length > 0) {
      return res.status(400).json({ error: 'El correo electrónico ya está registrado' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const insertReq = pool.request();
    insertReq.input('nombre', sql.NVarChar, nombre.trim());
    insertReq.input('email', sql.NVarChar, emailLimpio);
    insertReq.input('passwordHash', sql.NVarChar, passwordHash);
    insertReq.input('ocupacion', sql.NVarChar, ocupacion || 'estudiante');

    const result = await insertReq.query(`
      INSERT INTO dbo.Usuarios (Nombre, Email, PasswordHash, Ocupacion, Rol)
      OUTPUT INSERTED.Id, INSERTED.Nombre, INSERTED.Email, INSERTED.Rol, INSERTED.Ocupacion
      VALUES (@nombre, @email, @passwordHash, @ocupacion, 'usuario')
    `);

    const newUser = result.recordset[0];
    const userId = Number(newUser.Id);

    const token = jwt.sign(
      { id: userId, rol: newUser.Rol },
      process.env.JWT_SECRET || 'secreto_temporal',
      { expiresIn: '24h' }
    );

    return res.status(201).json({
      mensaje: 'Usuario registrado exitosamente',
      token,
      usuario: {
        id: userId,
        nombre: newUser.Nombre,
        email: newUser.Email,
        rol: newUser.Rol,
        ocupacion: newUser.Ocupacion
      }
    });

  } catch (error) {
    console.error('❌ Error crítico en registro:', error);
    return res.status(500).json({ error: 'Error interno del servidor al registrar usuario' });
  }
};

// POST /api/auth/login
const loginUsuario = async (req, res) => {
  try {
    const rawEmail = req.body.email || req.body.correo;
    const { password } = req.body;

    if (!rawEmail || !password) {
      return res.status(400).json({ error: 'Email y contraseña son obligatorios' });
    }

    const email = rawEmail.trim().toLowerCase();
    const pool = await poolPromise;

    const resultado = await pool.request()
      .input('email', sql.NVarChar, email)
      .query(`
        SELECT Id, Nombre, Email, PasswordHash, Rol, Ocupacion, Activo
        FROM dbo.Usuarios
        WHERE Email = @email
      `);

    const usuario = resultado.recordset[0];

    if (!usuario) {
      return res.status(401).json({ error: 'Correo o contraseña incorrectos' });
    }

    let passwordValido = false;
    if (
      usuario.PasswordHash &&
      (usuario.PasswordHash.startsWith('$2a$') ||
        usuario.PasswordHash.startsWith('$2b$') ||
        usuario.PasswordHash.startsWith('$2y$'))
    ) {
      passwordValido = await bcrypt.compare(password, usuario.PasswordHash);
    } else if (usuario.PasswordHash === password) {
      passwordValido = true;
    }

    if (!passwordValido) {
      return res.status(401).json({ error: 'Correo o contraseña incorrectos' });
    }

    const userId = Number(usuario.Id);

    const token = jwt.sign(
      { id: userId, rol: usuario.Rol },
      process.env.JWT_SECRET || 'secreto_temporal',
      { expiresIn: '24h' }
    );

    return res.status(200).json({
      mensaje: 'Login exitoso',
      token,
      usuario: {
        id: userId,
        nombre: usuario.Nombre,
        email: usuario.Email,
        rol: usuario.Rol,
        ocupacion: usuario.Ocupacion
      }
    });

  } catch (error) {
    console.error('❌ ERROR CRÍTICO EN LOGIN:', error);
    return res.status(500).json({ error: 'Error en el servidor al iniciar sesión' });
  }
};

module.exports = {
  registrarUsuario,
  loginUsuario
};
