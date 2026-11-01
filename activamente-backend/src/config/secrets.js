const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const os = require('os');

const ALGORITMO = 'aes-256-gcm';
const PREFIJO_ENCRIPTADO = 'ENC:';

// La llave maestra se guarda fuera de la carpeta del proyecto (en tu carpeta de usuario de Windows)
// para que aunque compartas o subas la carpeta del proyecto, nadie pueda desencriptar tus APIs.
const RUTA_LLAVE_MAESTRA = path.join(os.homedir(), '.activamente_master.key');

/**
 * Obtiene o genera automáticamente la llave maestra de 256 bits en tu equipo local.
 */
const obtenerLlaveMaestra = () => {
  if (process.env.MASTER_ENCRYPTION_KEY) {
    return crypto.createHash('sha256').update(process.env.MASTER_ENCRYPTION_KEY).digest();
  }

  if (fs.existsSync(RUTA_LLAVE_MAESTRA)) {
    const hexKey = fs.readFileSync(RUTA_LLAVE_MAESTRA, 'utf8').trim();
    return Buffer.from(hexKey, 'hex');
  }

  const nuevaLlave = crypto.randomBytes(32);
  fs.writeFileSync(RUTA_LLAVE_MAESTRA, nuevaLlave.toString('hex'), { mode: 0o600 });
  return nuevaLlave;
};

/**
 * Encripta cualquier API Key o secreto con AES-256-GCM.
 */
const encriptarSecreto = (textoPlano) => {
  if (!textoPlano || typeof textoPlano !== 'string') return '';
  const limpio = textoPlano.trim();
  if (!limpio || limpio.startsWith(PREFIJO_ENCRIPTADO)) return limpio;

  const key = obtenerLlaveMaestra();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITMO, key, iv);

  const encriptado = Buffer.concat([cipher.update(limpio, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return `${PREFIJO_ENCRIPTADO}${iv.toString('hex')}:${authTag.toString('hex')}:${encriptado.toString('hex')}`;
};

/**
 * Desencripta en memoria RAM un valor que empiece con "ENC:".
 * Si el valor aún está en texto plano, lo devuelve tal cual para no romper compatibilidad.
 */
const desencriptarSecreto = (valor) => {
  if (!valor || typeof valor !== 'string') return '';
  const limpio = valor.trim();
  if (!limpio.startsWith(PREFIJO_ENCRIPTADO)) return limpio;

  try {
    const partes = limpio.slice(PREFIJO_ENCRIPTADO.length).split(':');
    if (partes.length !== 3) {
      throw new Error('Formato de secreto encriptado inválido');
    }

    const [ivHex, authTagHex, encryptedHex] = partes;
    const key = obtenerLlaveMaestra();
    const decipher = crypto.createDecipheriv(ALGORITMO, key, Buffer.from(ivHex, 'hex'));
    decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));

    const desencriptado = Buffer.concat([
      decipher.update(Buffer.from(encryptedHex, 'hex')),
      decipher.final()
    ]);

    return desencriptado.toString('utf8');
  } catch (error) {
    console.error('❌ Error al desencriptar secreto:', error.message);
    return '';
  }
};

/**
 * Lee una variable de entorno y la desencripta automáticamente en memoria.
 */
const obtenerSecreto = (nombreVariable, valorPorDefecto = '') => {
  const valorCrudo = process.env[nombreVariable];
  if (!valorCrudo) return valorPorDefecto;
  return desencriptarSecreto(valorCrudo);
};

/**
 * Escanea el archivo .env y encripta automáticamente todas las variables sensibles
 * (cualquier variable que termine en _KEY, _SECRET, _PASS, _TOKEN) que estén en texto plano.
 */
const encriptarArchivoEnv = (rutaArchivoEnv) => {
  if (!fs.existsSync(rutaArchivoEnv)) {
    throw new Error(`No se encontró el archivo: ${rutaArchivoEnv}`);
  }

  const contenido = fs.readFileSync(rutaArchivoEnv, 'utf8');
  const lineas = contenido.split(/\r?\n/);
  const variablesEncriptadas = [];

  const patronSensible = /(?:_KEY|_SECRET|_PASS|_PASSWORD|_TOKEN)$/i;

  const nuevasLineas = lineas.map((linea) => {
    const trimLinea = linea.trim();
    if (!trimLinea || trimLinea.startsWith('#') || !trimLinea.includes('=')) {
      return linea;
    }

    const indiceIgual = linea.indexOf('=');
    const nombreVar = linea.slice(0, indiceIgual).trim();
    const valorVar = linea.slice(indiceIgual + 1).trim();

    if (patronSensible.test(nombreVar) && valorVar && !valorVar.startsWith(PREFIJO_ENCRIPTADO)) {
      const cifrado = encriptarSecreto(valorVar);
      variablesEncriptadas.push(nombreVar);
      return `${nombreVar}=${cifrado}`;
    }

    return linea;
  });

  if (variablesEncriptadas.length > 0) {
    fs.writeFileSync(rutaArchivoEnv, nuevasLineas.join('\n'), 'utf8');
  }

  return variablesEncriptadas;
};

module.exports = {
  encriptarSecreto,
  desencriptarSecreto,
  obtenerSecreto,
  encriptarArchivoEnv,
  RUTA_LLAVE_MAESTRA
};

