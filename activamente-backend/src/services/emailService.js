const dns = require('dns');
const nodemailer = require('nodemailer');
const { poolPromise } = require('../config/db');
const { obtenerSecreto } = require('../config/secrets');

// Lista de dominios falsos, de ejemplo o temporales/desechables bloqueados
const DOMINIOS_BLOQUEADOS = new Set([
  'ejemplo.com',
  'example.com',
  'correo.com',
  'email.com',
  'test.com',
  'prueba.com',
  'fake.com',
  'falso.com',
  'dominio.com',
  'mailinator.com',
  'yopmail.com',
  'tempmail.com',
  'temp-mail.org',
  '10minutemail.com',
  'guerrillamail.com',
  'sharklasers.com',
  'trashmail.com',
  'maildrop.cc',
  'getnada.com',
  'dispostable.com',
  'throwawaymail.com',
  'fakeinbox.com',
  'mailnesia.com',
  'mohmal.com'
]);

/**
 * Valida que el correo tenga formato válido, no sea de un dominio falso/temporal
 * y que su dominio tenga registros MX reales capaces de recibir correo electrónico.
 */
const validarCorreoReal = async (email) => {
  if (!email || typeof email !== 'string') {
    return { valido: false, error: 'El correo electrónico es obligatorio.' };
  }

  const correo = email.trim().toLowerCase();
  const regexFormato = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  if (!regexFormato.test(correo)) {
    return {
      valido: false,
      error: 'El formato del correo electrónico no es válido.'
    };
  }

  const partes = correo.split('@');
  const usuarioLocal = partes[0];
  const dominio = partes[1];

  if (usuarioLocal.length < 2) {
    return {
      valido: false,
      error: 'Ingresa una dirección de correo electrónico real y válida.'
    };
  }

  if (DOMINIOS_BLOQUEADOS.has(dominio)) {
    return {
      valido: false,
      error: `El dominio @${dominio} es de prueba o temporal. Por favor utiliza un correo electrónico real (ej. Gmail, Outlook, iCloud, Yahoo o institucional).`
    };
  }

  // Verificar registros MX en DNS para comprobar que el dominio existe y recibe correos
  try {
    const resolverConTimeout = new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('DNS_TIMEOUT')), 4000);
      dns.resolveMx(dominio, (err, addresses) => {
        clearTimeout(timer);
        if (err) return reject(err);
        resolve(addresses);
      });
    });

    const mxRecords = await resolverConTimeout;
    if (!mxRecords || mxRecords.length === 0) {
      return {
        valido: false,
        error: `El dominio @${dominio} no puede recibir correos electrónicos. Usa un correo electrónico real.`
      };
    }
  } catch (err) {
    if (
      err.code === 'ENOTFOUND' ||
      err.code === 'ENODATA' ||
      err.code === 'ESERVFAIL' ||
      err.code === 'EBADNAME'
    ) {
      return {
        valido: false,
        error: `El dominio @${dominio} no existe o no tiene servidor de correo activo. Por favor ingresa un correo electrónico real.`
      };
    }
    console.warn(`⚠️ Aviso DNS al verificar @${dominio}:`, err.message);
  }

  return { valido: true, emailLimpio: correo };
};

let etherealTransporterCache = null;
let brevoSenderEmailCache = null;

/**
 * Obtiene automáticamente el correo remitente verificado en la cuenta de Brevo
 * si el usuario solo configuró BREVO_API_KEY sin EMAIL_FROM.
 */
const obtenerRemitenteBrevo = async (brevoApiKey) => {
  if (process.env.EMAIL_FROM?.trim()) {
    return process.env.EMAIL_FROM.trim();
  }
  if (brevoSenderEmailCache) {
    return brevoSenderEmailCache;
  }

  try {
    const res = await fetch('https://api.brevo.com/v3/account', {
      method: 'GET',
      headers: {
        accept: 'application/json',
        'api-key': brevoApiKey
      }
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.email) {
        brevoSenderEmailCache = data.email;
        return data.email;
      }
    }
  } catch (err) {
    console.warn('⚠️ No se pudo consultar el remitente automático de Brevo:', err.message);
  }

  return 'no-reply@activamente.app';
};

/**
 * Construye el HTML del correo de confirmación de ActivaMente.
 */
const construirHtmlCorreo = (nombre, enlaceVerificacion) => `
  <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 560px; margin: 0 auto; background-color: #F8FAFC; padding: 32px 20px; border-radius: 20px;">
    <div style="background-color: #FFFFFF; padding: 36px 32px; border-radius: 16px; border: 1px solid #E2E8F0; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.05);">
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="display: inline-block; background: linear-gradient(135deg, #1E1B29, #0284C7); color: #FFFFFF; font-weight: 800; font-size: 20px; padding: 10px 20px; border-radius: 12px;">
          ActivaMente
        </span>
      </div>
      <h2 style="color: #0F172A; font-size: 22px; margin-top: 0; margin-bottom: 12px; text-align: center;">
        ¡Confirma tu correo electrónico, ${nombre}!
      </h2>
      <p style="color: #475569; font-size: 15px; line-height: 1.6; margin-bottom: 20px;">
        Gracias por unirte a <strong>ActivaMente</strong>. Ya puedes acceder y usar la plataforma desde ahora, pero necesitamos confirmar que este correo electrónico te pertenece.
      </p>
      <div style="background-color: #FEF3C7; border: 1px solid #FDE68A; color: #92400E; padding: 14px 16px; border-radius: 12px; font-size: 13.5px; line-height: 1.5; margin-bottom: 26px;">
        ⚠️ <strong>Importante:</strong> Tienes <strong>7 días (1 semana)</strong> desde la creación de tu cuenta para confirmar tu correo. Si no se confirma en ese plazo, la cuenta se eliminará automáticamente.
      </div>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${enlaceVerificacion}" style="background-color: #0284C7; color: #FFFFFF; text-decoration: none; font-weight: 700; font-size: 15px; padding: 14px 32px; border-radius: 12px; display: inline-block;">
          ✅ Confirmar mi correo ahora
        </a>
      </div>
      <p style="color: #64748B; font-size: 12.5px; line-height: 1.5; margin-top: 24px; word-break: break-all;">
        Si el botón no funciona, copia y pega este enlace en tu navegador:<br/>
        <a href="${enlaceVerificacion}" style="color: #0284C7;">${enlaceVerificacion}</a>
      </p>
    </div>
  </div>
`;

/**
 * Envía el correo de confirmación soportando:
 * 1) API de Brevo (BREVO_API_KEY) - Sin contraseñas personales, entrega a cualquier bandeja real
 * 2) API de Resend (RESEND_API_KEY) - Sin contraseñas personales, vía token API
 * 3) SMTP con Token de Aplicación (SMTP_USER + SMTP_PASS)
 * 4) Modo Prueba automático (Ethereal) si no se ha configurado ninguno de los anteriores
 */
const enviarCorreoVerificacion = async ({ email, nombre, token }) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5174';
  const enlaceVerificacion = `${frontendUrl}/verificar-email?token=${encodeURIComponent(token)}`;
  const asunto = 'Confirma tu cuenta de ActivaMente (Plazo de 7 días)';
  const html = construirHtmlCorreo(nombre, enlaceVerificacion);

  if (!process.env.BREVO_API_KEY) {
    require('dotenv').config({ override: true });
  }
  const brevoApiKey = obtenerSecreto('BREVO_API_KEY');
  const resendApiKey = obtenerSecreto('RESEND_API_KEY');
  const smtpUser = process.env.SMTP_USER?.trim();
  const smtpPass = obtenerSecreto('SMTP_PASS');

  try {
    // OPCIÓN 1: Envío real mediante API de Brevo (Sin contraseña personal)
    if (brevoApiKey) {
      const remitenteEmail = await obtenerRemitenteBrevo(brevoApiKey);
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': brevoApiKey,
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          sender: { name: 'ActivaMente', email: remitenteEmail },
          to: [{ email, name: nombre }],
          subject: asunto,
          htmlContent: html
        })
      });

      if (!response.ok) {
        const errData = await response.text();
        throw new Error(`Brevo API error: ${errData}`);
      }

      console.log(`📧 Correo real enviado vía Brevo API (remitente: ${remitenteEmail}) a ${email}`);
      return {
        enviado: true,
        esModoPrueba: false,
        previewUrl: null,
        enlaceVerificacion
      };
    }

    // OPCIÓN 2: Envío real mediante API de Resend (Sin contraseña personal)
    if (resendApiKey) {
      const remitenteResend = process.env.EMAIL_FROM?.trim() || 'ActivaMente <onboarding@resend.dev>';
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: remitenteResend,
          to: [email],
          subject: asunto,
          html
        })
      });

      if (!response.ok) {
        const errData = await response.text();
        throw new Error(`Resend API error: ${errData}`);
      }

      console.log(`📧 Correo real enviado vía Resend API a ${email}`);
      return {
        enviado: true,
        esModoPrueba: false,
        previewUrl: null,
        enlaceVerificacion
      };
    }

    // OPCIÓN 3: Envío real mediante SMTP (con Token de Aplicación, no contraseña personal)
    if (smtpUser && smtpPass) {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: Number(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_SECURE === 'true' || Number(process.env.SMTP_PORT) === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass.replace(/\s+/g, '')
        }
      });

      await transporter.sendMail({
        from: `"ActivaMente" <${smtpUser}>`,
        to: email,
        subject: asunto,
        html
      });

      console.log(`📧 Correo real enviado vía SMTP a ${email}`);
      return {
        enviado: true,
        esModoPrueba: false,
        previewUrl: null,
        enlaceVerificacion
      };
    }

    // OPCIÓN 4: Fallback automático a Ethereal Email (Modo Desarrollo sin credenciales)
    if (!etherealTransporterCache) {
      const testAccount = await nodemailer.createTestAccount();
      etherealTransporterCache = nodemailer.createTransport({
        host: testAccount.smtp.host,
        port: testAccount.smtp.port,
        secure: testAccount.smtp.secure,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
    }

    const info = await etherealTransporterCache.sendMail({
      from: '"ActivaMente" <no-reply@activamente.app>',
      to: email,
      subject: asunto,
      html
    });

    const previewUrl = nodemailer.getTestMessageUrl(info);
    console.log(`📧 Correo de verificación generado para ${email}`);
    console.log(`🔗 Enlace de verificación directo: ${enlaceVerificacion}`);
    if (previewUrl) {
      console.log(`📬 Vista previa del correo (Modo Prueba Ethereal): ${previewUrl}`);
    }

    return {
      enviado: true,
      esModoPrueba: true,
      previewUrl,
      enlaceVerificacion
    };
  } catch (error) {
    console.error('❌ Error al enviar correo de verificación:', error.message);
    return {
      enviado: false,
      esModoPrueba: false,
      previewUrl: null,
      enlaceVerificacion,
      error: error.message
    };
  }
};

/**
 * Asegura que las columnas de verificación existan en dbo.Usuarios y elimina
 * automáticamente las cuentas no verificadas con más de 7 días (1 semana) de antigüedad.
 */
const limpiarCuentasNoVerificadasExpiradas = async () => {
  try {
    const pool = await poolPromise;

    await pool.request().query(`
      IF COL_LENGTH('dbo.Usuarios', 'EmailVerificado') IS NULL
      BEGIN
        ALTER TABLE dbo.Usuarios ADD EmailVerificado BIT NOT NULL CONSTRAINT DF_Usuarios_EmailVerificado DEFAULT 0;
      END

      IF COL_LENGTH('dbo.Usuarios', 'TokenVerificacion') IS NULL
      BEGIN
        ALTER TABLE dbo.Usuarios ADD TokenVerificacion NVARCHAR(255) NULL;
      END

      IF COL_LENGTH('dbo.Usuarios', 'FechaEnvioVerificacion') IS NULL
      BEGIN
        ALTER TABLE dbo.Usuarios ADD FechaEnvioVerificacion DATETIME2 NULL;
      END

      IF COL_LENGTH('dbo.Usuarios', 'objetivoPorDefecto') IS NULL
        ALTER TABLE dbo.Usuarios ADD objetivoPorDefecto VARCHAR(50) NOT NULL CONSTRAINT DF_Usuarios_Objetivo DEFAULT 'concentracion';

      IF COL_LENGTH('dbo.Usuarios', 'metaDiariaMin') IS NULL
        ALTER TABLE dbo.Usuarios ADD metaDiariaMin INT NOT NULL CONSTRAINT DF_Usuarios_MetaDiaria DEFAULT 20;

      IF COL_LENGTH('dbo.Usuarios', 'sonidoTemporizador') IS NULL
        ALTER TABLE dbo.Usuarios ADD sonidoTemporizador BIT NOT NULL CONSTRAINT DF_Usuarios_Sonido DEFAULT 1;

      IF COL_LENGTH('dbo.Usuarios', 'frecuenciaRecordatorioMin') IS NULL
        ALTER TABLE dbo.Usuarios ADD frecuenciaRecordatorioMin INT NOT NULL CONSTRAINT DF_Usuarios_Recordatorio DEFAULT 0;

      IF COL_LENGTH('dbo.Usuarios', 'notificacionesEmail') IS NULL
        ALTER TABLE dbo.Usuarios ADD notificacionesEmail BIT NOT NULL CONSTRAINT DF_Usuarios_NotifEmail DEFAULT 1;

      IF COL_LENGTH('dbo.Usuarios', 'temaOscuro') IS NULL
        ALTER TABLE dbo.Usuarios ADD temaOscuro BIT NOT NULL CONSTRAINT DF_Usuarios_TemaOscuro DEFAULT 0;

      IF COL_LENGTH('dbo.Usuarios', 'TokenRecuperacion') IS NULL
        ALTER TABLE dbo.Usuarios ADD TokenRecuperacion NVARCHAR(255) NULL;

      IF COL_LENGTH('dbo.Usuarios', 'ExpiracionRecuperacion') IS NULL
        ALTER TABLE dbo.Usuarios ADD ExpiracionRecuperacion DATETIME2 NULL;
    `);

    const deleteRes = await pool.request().query(`
      DELETE FROM dbo.Usuarios
      OUTPUT DELETED.Id, DELETED.Email
      WHERE EmailVerificado = 0
        AND FechaRegistro IS NOT NULL
        AND DATEDIFF(HOUR, FechaRegistro, GETDATE()) >= 168
    `);

    if (deleteRes.recordset && deleteRes.recordset.length > 0) {
      console.log(
        `🗑️ Se eliminaron ${deleteRes.recordset.length} cuenta(s) no verificada(s) tras 1 semana:`,
        deleteRes.recordset.map((u) => u.Email).join(', ')
      );
    }
  } catch (error) {
    console.error('⚠️ Error en limpieza de cuentas no verificadas:', error.message);
  }
};

/**
 * Envía un resumen de progreso y bienestar por correo electrónico (usando Brevo / proveedor activo).
 */
const enviarResumenProgresoEmail = async ({
  email,
  nombre,
  rachaActual,
  minutosInvertidos,
  sesionesCompletadas,
  minutosHoy,
  metaDiariaMin
}) => {
  if (!process.env.BREVO_API_KEY) {
    require('dotenv').config({ override: true });
  }
  const brevoApiKey = obtenerSecreto('BREVO_API_KEY');
  const asunto = `📊 Tu resumen de bienestar en ActivaMente, ${nombre}`;

  const porcentajeHoy = Math.min(100, Math.round(((minutosHoy || 0) / (metaDiariaMin || 20)) * 100));

  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 560px; margin: 0 auto; background-color: #F8FAFC; padding: 32px 20px; border-radius: 20px;">
      <div style="background-color: #FFFFFF; padding: 36px 32px; border-radius: 16px; border: 1px solid #E2E8F0;">
        <div style="text-align: center; margin-bottom: 24px;">
          <span style="display: inline-block; background: linear-gradient(135deg, #1E1B29, #0284C7); color: #FFFFFF; font-weight: 800; font-size: 20px; padding: 10px 20px; border-radius: 12px;">
            ActivaMente
          </span>
        </div>
        <h2 style="color: #0F172A; font-size: 22px; margin-top: 0; text-align: center;">
          ¡Hola, ${nombre}! 👋
        </h2>
        <p style="color: #475569; font-size: 15px; line-height: 1.6; text-align: center; margin-bottom: 24px;">
          Aquí tienes el corte actual de tu progreso y pausas activas registradas en la plataforma:
        </p>
        <div style="background-color: #F0F9FF; border: 1px solid #BAE6FD; padding: 18px; border-radius: 14px; margin-bottom: 20px;">
          <p style="margin: 0 0 8px 0; color: #0369A1; font-weight: 700; font-size: 14px;">
            🎯 Meta de hoy: ${minutosHoy} / ${metaDiariaMin} min (${porcentajeHoy}%)
          </p>
          <p style="margin: 6px 0; color: #0F172A; font-size: 15px;">🔥 <strong>Racha actual:</strong> ${rachaActual} ${rachaActual === 1 ? 'día' : 'días'}</p>
          <p style="margin: 6px 0; color: #0F172A; font-size: 15px;">⏱️ <strong>Minutos totales invertidos:</strong> ${minutosInvertidos} min</p>
          <p style="margin: 6px 0; color: #0F172A; font-size: 15px;">🧘 <strong>Sesiones completadas:</strong> ${sesionesCompletadas}</p>
        </div>
        <p style="color: #64748B; font-size: 13px; text-align: center; margin-top: 24px;">
          Sigue cuidando tu mente y cuerpo con micro-pausas diarias en ActivaMente.
        </p>
      </div>
    </div>
  `;

  if (brevoApiKey) {
    const remitenteEmail = await obtenerRemitenteBrevo(brevoApiKey);
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'api-key': brevoApiKey,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        sender: { name: 'ActivaMente', email: remitenteEmail },
        to: [{ email, name: nombre }],
        subject: asunto,
        htmlContent: html
      })
    });

    if (!response.ok) {
      const errData = await response.text();
      throw new Error(`Brevo API error: ${errData}`);
    }
    return { enviado: true };
  }

  throw new Error('Configura BREVO_API_KEY para enviar resúmenes reales por correo.');
};

/**
 * Envía el correo con el enlace para restablecer la contraseña olvidada (válido por 30 minutos).
 */
const enviarCorreoRecuperacionPassword = async ({ email, nombre, token }) => {
  if (!process.env.BREVO_API_KEY) {
    require('dotenv').config({ override: true });
  }
  const brevoApiKey = obtenerSecreto('BREVO_API_KEY');
  const resendApiKey = obtenerSecreto('RESEND_API_KEY');
  const smtpUser = process.env.SMTP_USER?.trim();
  const smtpPass = obtenerSecreto('SMTP_PASS');

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5174';
  const enlaceRecuperacion = `${frontendUrl}/restablecer-password?token=${encodeURIComponent(token)}`;
  const asunto = '🔑 Restablece tu contraseña de ActivaMente';

  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 560px; margin: 0 auto; background-color: #F8FAFC; padding: 32px 20px; border-radius: 20px;">
      <div style="background-color: #FFFFFF; padding: 36px 32px; border-radius: 16px; border: 1px solid #E2E8F0; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.05);">
        <div style="text-align: center; margin-bottom: 24px;">
          <span style="display: inline-block; background: linear-gradient(135deg, #1E1B29, #0284C7); color: #FFFFFF; font-weight: 800; font-size: 20px; padding: 10px 20px; border-radius: 12px;">
            ActivaMente
          </span>
        </div>
        <h2 style="color: #0F172A; font-size: 22px; margin-top: 0; margin-bottom: 12px; text-align: center;">
          ¿Olvidaste tu contraseña, ${nombre}?
        </h2>
        <p style="color: #475569; font-size: 15px; line-height: 1.6; margin-bottom: 20px;">
          Recibimos una solicitud para restablecer la contraseña de tu cuenta en <strong>ActivaMente</strong>. Haz clic en el botón de abajo para crear una contraseña nueva:
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${enlaceRecuperacion}" style="background-color: #0284C7; color: #FFFFFF; text-decoration: none; font-weight: 700; font-size: 15px; padding: 14px 32px; border-radius: 12px; display: inline-block;">
            🔑 Crear nueva contraseña
          </a>
        </div>
        <div style="background-color: #F1F5F9; border: 1px solid #E2E8F0; color: #475569; padding: 12px 16px; border-radius: 12px; font-size: 13px; line-height: 1.5; margin-bottom: 20px;">
          ⏳ Por tu seguridad, este enlace es válido únicamente durante <strong>30 minutos</strong>. Si tú no solicitaste este cambio, puedes ignorar este correo con tranquilidad.
        </div>
        <p style="color: #64748B; font-size: 12.5px; line-height: 1.5; margin-top: 20px; word-break: break-all;">
          Si el botón no funciona, copia y pega este enlace en tu navegador:<br/>
          <a href="${enlaceRecuperacion}" style="color: #0284C7;">${enlaceRecuperacion}</a>
        </p>
      </div>
    </div>
  `;

  try {
    if (brevoApiKey) {
      const remitenteEmail = await obtenerRemitenteBrevo(brevoApiKey);
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'api-key': brevoApiKey,
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          sender: { name: 'ActivaMente', email: remitenteEmail },
          to: [{ email, name: nombre }],
          subject: asunto,
          htmlContent: html
        })
      });

      if (!response.ok) {
        const errData = await response.text();
        throw new Error(`Brevo API error: ${errData}`);
      }

      console.log(`📧 Correo de recuperación enviado vía Brevo a ${email}`);
      return { enviado: true, esModoPrueba: false, enlaceRecuperacion };
    }

    if (resendApiKey) {
      const remitenteResend = process.env.EMAIL_FROM?.trim() || 'ActivaMente <onboarding@resend.dev>';
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: remitenteResend,
          to: [email],
          subject: asunto,
          html
        })
      });

      if (!response.ok) {
        const errData = await response.text();
        throw new Error(`Resend API error: ${errData}`);
      }

      return { enviado: true, esModoPrueba: false, enlaceRecuperacion };
    }

    if (smtpUser && smtpPass) {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: Number(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_SECURE === 'true' || Number(process.env.SMTP_PORT) === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass.replace(/\s+/g, '')
        }
      });

      await transporter.sendMail({
        from: `"ActivaMente" <${smtpUser}>`,
        to: email,
        subject: asunto,
        html
      });

      return { enviado: true, esModoPrueba: false, enlaceRecuperacion };
    }

    if (!etherealTransporterCache) {
      const testAccount = await nodemailer.createTestAccount();
      etherealTransporterCache = nodemailer.createTransport({
        host: testAccount.smtp.host,
        port: testAccount.smtp.port,
        secure: testAccount.smtp.secure,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
    }

    const info = await etherealTransporterCache.sendMail({
      from: '"ActivaMente" <no-reply@activamente.app>',
      to: email,
      subject: asunto,
      html
    });

    return {
      enviado: true,
      esModoPrueba: true,
      previewUrl: nodemailer.getTestMessageUrl(info),
      enlaceRecuperacion
    };
  } catch (error) {
    console.error('❌ Error al enviar correo de recuperación:', error.message);
    return { enviado: false, error: error.message };
  }
};

module.exports = {
  validarCorreoReal,
  enviarCorreoVerificacion,
  enviarResumenProgresoEmail,
  enviarCorreoRecuperacionPassword,
  limpiarCuentasNoVerificadasExpiradas
};
