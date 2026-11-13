const { poolPromise, sql } = require('../config/db');
const { obtenerSecreto } = require('../config/secrets');

const obtenerApiKeyGeoapify = () => {
  if (!process.env.GEOAPIFY_API_KEY) {
    require('dotenv').config({ override: true });
  }
  return obtenerSecreto('GEOAPIFY_API_KEY');
};

const traducirCategoria = (categories = []) => {
  if (categories.some((c) => c.includes('sport.fitness') || c.includes('sport.track'))) {
    return '🏋️ Área Deportiva / Fitness';
  }
  if (categories.some((c) => c.includes('natural'))) {
    return '🌲 Área Natural';
  }
  if (categories.some((c) => c.includes('playground'))) {
    return '🛝 Plaza / Área Recreativa';
  }
  return '🌳 Parque / Área Verde';
};

// GET /api/mapa/buscar-lugar?q=Monterrey
const buscarLugar = async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q || q.length < 2) {
      return res.status(400).json({ error: 'Ingresa al menos 2 caracteres para buscar una ubicación.' });
    }

    const apiKey = obtenerApiKeyGeoapify();
    if (!apiKey) {
      return res.status(200).json({
        sinApiKey: true,
        lugares: [],
        mensaje: 'Configura tu GEOAPIFY_API_KEY en activamente-backend/.env para habilitar la búsqueda de ubicaciones.'
      });
    }

    const url = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(q)}&lang=es&limit=5&apiKey=${apiKey}`;
    const response = await fetch(url);
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Geoapify Geocoding error: ${errText}`);
    }

    const data = await response.json();
    const lugares = (data.features || []).map((f) => ({
      nombre: f.properties.address_line1 || f.properties.city || f.properties.formatted,
      direccion: f.properties.formatted,
      lat: f.properties.lat,
      lon: f.properties.lon
    }));

    return res.status(200).json({ sinApiKey: false, lugares });
  } catch (error) {
    console.error('❌ Error al buscar lugar en Geoapify:', error.message);
    return res.status(500).json({ error: 'No se pudo buscar la ubicación en el servicio de mapas.' });
  }
};

// GET /api/mapa/espacios?lat=25.6866&lon=-100.3161&radio=2500
const obtenerEspaciosCercanos = async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat);
    const lon = parseFloat(req.query.lon);
    const radio = Math.min(5000, Math.max(500, parseInt(req.query.radio, 10) || 2500));

    if (Number.isNaN(lat) || Number.isNaN(lon)) {
      return res.status(400).json({ error: 'Coordenadas inválidas.' });
    }

    const apiKey = obtenerApiKeyGeoapify();
    if (!apiKey) {
      return res.status(200).json({
        sinApiKey: true,
        espacios: [],
        mensaje: 'Aún no has configurado GEOAPIFY_API_KEY en activamente-backend/.env.'
      });
    }

    const categorias = 'leisure.park,leisure.playground,sport.fitness,sport.track,natural.forest';
    const url = `https://api.geoapify.com/v2/places?categories=${categorias}&filter=circle:${lon},${lat},${radio}&bias=proximity:${lon},${lat}&limit=15&lang=es&apiKey=${apiKey}`;

    const response = await fetch(url);
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Geoapify Places error: ${errText}`);
    }

    const data = await response.json();
    const espacios = (data.features || []).map((f, idx) => {
      const props = f.properties || {};
      const coords = f.geometry?.coordinates || [lon, lat];
      const nombreLimpio =
        props.name ||
        (props.street ? `Espacio en ${props.street}` : null) ||
        (props.suburb ? `Parque en ${props.suburb}` : null) ||
        'Parque / Área Verde';
      return {
        id: props.place_id || `lugar-${idx}`,
        nombre: nombreLimpio,
        direccion: props.address_line2 || props.formatted || 'Espacio cercano',
        categoria: traducirCategoria(props.categories || []),
        lat: coords[1],
        lon: coords[0],
        distanciaMetros: Math.round(props.distance || 0)
      };
    });

    return res.status(200).json({ sinApiKey: false, espacios });
  } catch (error) {
    console.error('❌ Error al consultar espacios en Geoapify:', error.message);
    return res.status(500).json({ error: 'Error al buscar parques y espacios activos cercanos.' });
  }
};

// GET /api/mapa/ruta?origenLat=...&origenLon=...&destinoLat=...&destinoLon=...
const calcularRutaCaminando = async (req, res) => {
  try {
    const origenLat = parseFloat(req.query.origenLat);
    const origenLon = parseFloat(req.query.origenLon);
    const destinoLat = parseFloat(req.query.destinoLat);
    const destinoLon = parseFloat(req.query.destinoLon);

    if ([origenLat, origenLon, destinoLat, destinoLon].some(Number.isNaN)) {
      return res.status(400).json({ error: 'Coordenadas de origen o destino inválidas.' });
    }

    const apiKey = obtenerApiKeyGeoapify();
    if (!apiKey) {
      return res.status(200).json({ sinApiKey: true });
    }

    const url = `https://api.geoapify.com/v1/routing?waypoints=${origenLat},${origenLon}|${destinoLat},${destinoLon}&mode=walk&apiKey=${apiKey}`;
    const response = await fetch(url);
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Geoapify Routing error: ${errText}`);
    }

    const data = await response.json();
    const feature = data.features?.[0];
    if (!feature) {
      return res.status(404).json({ error: 'No se encontró una ruta peatonal hacia este punto.' });
    }

    const props = feature.properties || {};
    const geom = feature.geometry || {};

    // GeoJSON usa [lon, lat]; Leaflet usa [lat, lon]
    let coordenadas = [];
    if (geom.type === 'MultiLineString' && Array.isArray(geom.coordinates)) {
      coordenadas = geom.coordinates.flat().map(([cLon, cLat]) => [cLat, cLon]);
    } else if (geom.type === 'LineString' && Array.isArray(geom.coordinates)) {
      coordenadas = geom.coordinates.map(([cLon, cLat]) => [cLat, cLon]);
    }

    return res.status(200).json({
      sinApiKey: false,
      distanciaMetros: Math.round(props.distance || 0),
      tiempoMin: Math.max(1, Math.round((props.time || 60) / 60)),
      coordenadas
    });
  } catch (error) {
    console.error('❌ Error al calcular ruta en Geoapify:', error.message);
    return res.status(500).json({ error: 'No se pudo calcular la ruta caminando.' });
  }
};

// POST /api/mapa/registrar-caminata
const registrarCaminata = async (req, res) => {
  try {
    const usuarioId = Number(req.usuario.id || req.usuario.usuarioId);
    const { minutos } = req.body;
    const tiempoValido = Math.min(120, Math.max(1, parseInt(minutos, 10) || 10));

    const pool = await poolPromise;
    const result = await pool.request()
      .input('usuarioId', sql.Int, usuarioId)
      .input('ubicacion', sql.NVarChar, 'aire_libre')
      .input('tiempo', sql.Int, tiempoValido)
      .input('objetivo', sql.NVarChar, 'activacion_fisica')
      .query(`
        INSERT INTO dbo.Sesiones (UsuarioId, Ubicacion, TiempoSolicitadoMin, Objetivo, FechaInicio, Completada)
        OUTPUT INSERTED.Id AS id
        VALUES (@usuarioId, @ubicacion, @tiempo, @objetivo, GETDATE(), 1)
      `);

    return res.status(201).json({
      mensaje: `¡Pausa de caminata al aire libre (${tiempoValido} min) sumada a tu progreso diario!`,
      sesionId: Number(result.recordset[0].id)
    });
  } catch (error) {
    console.error('❌ Error al registrar caminata:', error);
    return res.status(500).json({ error: 'No se pudo registrar la caminata en tu historial.' });
  }
};

module.exports = {
  buscarLugar,
  obtenerEspaciosCercanos,
  calcularRutaCaminando,
  registrarCaminata
};
