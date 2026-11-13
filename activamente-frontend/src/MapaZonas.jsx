import { useState, useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from './api';

// Centro inicial por defecto: Monterrey, Nuevo León
const CENTRO_INICIAL = { lat: 25.6866, lon: -100.3161, etiqueta: 'Monterrey, Nuevo León' };

export default function MapaZonas() {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const tileLayerRef = useRef(null);
  const markersLayerRef = useRef(null);
  const routeLayerRef = useRef(null);

  const [origen, setOrigen] = useState(CENTRO_INICIAL);
  const [busqueda, setBusqueda] = useState('');
  const [resultadosBusqueda, setResultadosBusqueda] = useState([]);
  const [espacios, setEspacios] = useState([]);
  const [espacioSeleccionado, setEspacioSeleccionado] = useState(null);
  const [rutaActiva, setRutaActiva] = useState(null);

  const [cargandoEspacios, setCargandoEspacios] = useState(false);
  const [calculandoRuta, setCalculandoRuta] = useState(false);
  const [registrandoCaminata, setRegistrandoCaminata] = useState(false);
  const [sinApiKey, setSinApiKey] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

  // Inicializar mapa de Leaflet una sola vez
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [CENTRO_INICIAL.lat, CENTRO_INICIAL.lon],
      zoom: 14,
      zoomControl: true
    });

    const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map);

    const markersLayer = L.layerGroup().addTo(map);
    const routeLayer = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;
    tileLayerRef.current = tiles;
    markersLayerRef.current = markersLayer;
    routeLayerRef.current = routeLayer;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Cargar parques y espacios activos cercanos desde el backend (Geoapify Places)
  const cargarEspacios = useCallback(async (lat, lon) => {
    setCargandoEspacios(true);
    setRutaActiva(null);
    setEspacioSeleccionado(null);
    if (routeLayerRef.current) routeLayerRef.current.clearLayers();

    try {
      const res = await api.get('/mapa/espacios', {
        params: { lat, lon, radio: 2500 }
      });

      if (res.data?.sinApiKey) {
        setSinApiKey(true);
        setEspacios([]);
      } else {
        setSinApiKey(false);
        setEspacios(res.data?.espacios || []);
      }
    } catch (error) {
      setMensaje({
        tipo: 'error',
        texto: error.response?.data?.error || 'No se pudieron cargar los espacios cercanos.'
      });
    } finally {
      setCargandoEspacios(false);
    }
  }, []);

  useEffect(() => {
    cargarEspacios(origen.lat, origen.lon);
  }, [origen.lat, origen.lon, cargarEspacios]);

  // Dibujar marcadores en el mapa cuando cambia el origen o los espacios
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();
    map.setView([origen.lat, origen.lon], 14, { animate: true });

    // Marcador del punto de origen del usuario
    L.circleMarker([origen.lat, origen.lon], {
      radius: 10,
      fillColor: '#0284C7',
      color: '#FFFFFF',
      weight: 3,
      opacity: 1,
      fillOpacity: 1
    })
      .bindPopup(`<strong>📍 Tu punto de partida</strong><br/>${origen.etiqueta}`)
      .addTo(markersLayer);

    // Marcadores de espacios verdes / deportivos cercanos
    espacios.forEach((esp) => {
      const esSeleccionado = espacioSeleccionado?.id === esp.id;
      const marker = L.circleMarker([esp.lat, esp.lon], {
        radius: esSeleccionado ? 11 : 8,
        fillColor: esSeleccionado ? '#F59E0B' : '#10B981',
        color: '#FFFFFF',
        weight: 2.5,
        opacity: 1,
        fillOpacity: 0.95
      });

      marker.bindPopup(
        `<strong>${esp.nombre}</strong><br/><span style="font-size:11px;color:#475569">${esp.categoria} • ${esp.distanciaMetros} m</span>`
      );
      marker.on('click', () => seleccionarEspacioYCalcularRuta(esp));
      marker.addTo(markersLayer);
    });
  }, [origen, espacios, espacioSeleccionado]);

  const seleccionarEspacioYCalcularRuta = async (espacio) => {
    setEspacioSeleccionado(espacio);
    setCalculandoRuta(true);
    setMensaje({ tipo: '', texto: '' });

    try {
      const res = await api.get('/mapa/ruta', {
        params: {
          origenLat: origen.lat,
          origenLon: origen.lon,
          destinoLat: espacio.lat,
          destinoLon: espacio.lon
        }
      });

      if (res.data?.sinApiKey) {
        setSinApiKey(true);
        return;
      }

      setRutaActiva(res.data);

      if (routeLayerRef.current && mapInstanceRef.current && res.data?.coordenadas?.length > 0) {
        routeLayerRef.current.clearLayers();
        const polyline = L.polyline(res.data.coordenadas, {
          color: '#0284C7',
          weight: 5,
          opacity: 0.85,
          dashArray: '8, 6'
        }).addTo(routeLayerRef.current);

        mapInstanceRef.current.fitBounds(polyline.getBounds(), { padding: [40, 40] });
      }
    } catch (error) {
      setMensaje({
        tipo: 'error',
        texto: error.response?.data?.error || 'No se pudo calcular la ruta caminando.'
      });
    } finally {
      setCalculandoRuta(false);
    }
  };

  const usarMiUbicacion = () => {
    setMensaje({ tipo: '', texto: '' });
    if (!('geolocation' in navigator)) {
      setMensaje({ tipo: 'error', texto: 'Tu navegador no soporta geolocalización.' });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setResultadosBusqueda([]);
        setOrigen({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          etiqueta: 'Tu ubicación actual'
        });
      },
      () => {
        setMensaje({
          tipo: 'error',
          texto: 'No se pudo obtener tu ubicación. Verifica los permisos del navegador o busca tu municipio manualmente.'
        });
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const buscarUbicacionManual = async (e) => {
    e.preventDefault();
    if (!busqueda.trim()) return;
    setMensaje({ tipo: '', texto: '' });

    try {
      const res = await api.get('/mapa/buscar-lugar', { params: { q: busqueda.trim() } });
      if (res.data?.sinApiKey) {
        setSinApiKey(true);
        return;
      }
      const lugares = res.data?.lugares || [];
      setResultadosBusqueda(lugares);
      if (lugares.length === 0) {
        setMensaje({ tipo: 'error', texto: 'No se encontraron resultados para esa ubicación.' });
      }
    } catch (error) {
      setMensaje({
        tipo: 'error',
        texto: error.response?.data?.error || 'Error al buscar la ubicación.'
      });
    }
  };

  const registrarCaminataEnProgreso = async () => {
    if (!espacioSeleccionado || !rutaActiva) return;
    setRegistrandoCaminata(true);
    setMensaje({ tipo: '', texto: '' });

    // Si camina ida y vuelta o mínimo 5 minutos
    const minutosTotales = Math.max(5, Math.min(60, rutaActiva.tiempoMin * 2));

    try {
      const res = await api.post('/mapa/registrar-caminata', {
        nombreLugar: espacioSeleccionado.nombre,
        minutos: minutosTotales
      });
      window.dispatchEvent(new Event('progresoActualizado'));
      setMensaje({
        tipo: 'exito',
        texto: res.data?.mensaje || `¡Caminata de ${minutosTotales} min sumada a tu progreso!`
      });
    } catch (error) {
      setMensaje({
        tipo: 'error',
        texto: error.response?.data?.error || 'No se pudo registrar la caminata.'
      });
    } finally {
      setRegistrandoCaminata(false);
    }
  };

  return (
    <div className="animate-fade-in flex flex-col gap-6 pb-10 font-sans text-gray-800">
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#0F172A] tracking-tight">
            Zonas Activas al Aire Libre
          </h1>
          <p className="text-gray-500 mt-1">
            Encuentra parques y espacios verdes cercanos para despejar tu mente y suma tu caminata a tu meta diaria.
          </p>
        </div>

        <button
          type="button"
          onClick={usarMiUbicacion}
          className="bg-[#0284C7] hover:bg-[#0369a1] text-white font-bold text-sm px-5 py-3 rounded-2xl shadow-md transition-all cursor-pointer self-start md:self-auto whitespace-nowrap"
        >
          📍 Usar mi ubicación actual
        </button>
      </div>

      {/* Aviso si aún no se pega GEOAPIFY_API_KEY */}
      {sinApiKey && (
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5 text-sm text-amber-900">
          <h2 className="font-extrabold text-base mb-1">🔑 Falta configurar tu API Key gratuita de Geoapify</h2>
          <p className="text-xs leading-relaxed">
            Crea tu clave gratuita (sin tarjeta bancaria) en{' '}
            <a
              href="https://myprojects.geoapify.com/"
              target="_blank"
              rel="noreferrer"
              className="font-bold underline"
            >
              myprojects.geoapify.com
            </a>{' '}
            y pégala en <code>activamente-backend/.env</code> dentro de <code>GEOAPIFY_API_KEY=</code> para activar la búsqueda de parques y rutas peatonales.
          </p>
        </div>
      )}

      {/* Buscador de ciudad / zona */}
      <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100">
        <form onSubmit={buscarUbicacionManual} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar ciudad, colonia o punto (ej. San Nicolás, Monterrey, Parque Fundidora)..."
            className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#0284C7] outline-none text-base md:text-sm"
          />
          <button
            type="submit"
            className="bg-[#0F172A] hover:bg-[#1E293B] text-white font-bold text-sm px-6 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap"
          >
            🔍 Buscar zona
          </button>
        </form>

        {resultadosBusqueda.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {resultadosBusqueda.map((lug, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setOrigen({ lat: lug.lat, lon: lug.lon, etiqueta: lug.nombre });
                  setResultadosBusqueda([]);
                }}
                className="text-xs bg-blue-50 hover:bg-blue-100 text-[#0369a1] border border-blue-200 px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer text-left"
              >
                📍 {lug.direccion}
              </button>
            ))}
          </div>
        )}
      </div>

      {mensaje.texto && (
        <div
          className={`p-4 rounded-2xl text-sm font-semibold border ${
            mensaje.tipo === 'exito'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-red-50 text-red-700 border-red-200'
          }`}
        >
          {mensaje.tipo === 'exito' ? '✅ ' : '❌ '}
          {mensaje.texto}
        </div>
      )}

      {/* Contenedor Mapa + Lista */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Mapa interactivo */}
        <div className="lg:col-span-7 bg-white p-3 rounded-3xl shadow-sm border border-gray-100 flex flex-col gap-3">
          <div
            ref={mapContainerRef}
            className="w-full h-[290px] sm:h-[380px] md:h-[440px] rounded-2xl overflow-hidden z-10"
          />
          <div className="flex flex-wrap items-center justify-between gap-2 px-2 pb-1 text-xs text-gray-500">
            <span>🔵 Punto de partida: <strong>{origen.etiqueta}</strong></span>
            <span>🟢 Parques / Áreas activas • 🟠 Seleccionado</span>
          </div>
        </div>

        {/* Panel derecho: Ruta activa y lista de espacios */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {espacioSeleccionado && (
            <div className="bg-gradient-to-br from-[#1E1B29] to-[#0284C7] text-white p-5 rounded-3xl shadow-md">
              <p className="text-[11px] uppercase tracking-wider text-blue-200 font-bold">
                Ruta de Pausa Activa Seleccionada
              </p>
              <h2 className="text-lg font-extrabold mt-0.5">{espacioSeleccionado.nombre}</h2>
              <p className="text-xs text-blue-100 mt-0.5">{espacioSeleccionado.categoria}</p>

              {calculandoRuta ? (
                <p className="text-xs mt-4 text-blue-100 animate-pulse">⏳ Calculando ruta caminando...</p>
              ) : rutaActiva ? (
                <div className="mt-4 space-y-3">
                  <div className="grid grid-cols-2 gap-2.5 bg-white/10 p-3 rounded-2xl text-xs">
                    <div>
                      <span className="text-blue-200 block">Distancia (solo ida)</span>
                      <strong className="text-base">
                        {rutaActiva.distanciaMetros >= 1000
                          ? `${(rutaActiva.distanciaMetros / 1000).toFixed(2)} km`
                          : `${rutaActiva.distanciaMetros} m`}
                      </strong>
                    </div>
                    <div>
                      <span className="text-blue-200 block">Caminata ida y vuelta</span>
                      <strong className="text-base">~{Math.max(5, rutaActiva.tiempoMin * 2)} min</strong>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={registrarCaminataEnProgreso}
                    disabled={registrandoCaminata}
                    className="w-full bg-white hover:bg-gray-100 disabled:opacity-60 text-[#0284C7] font-extrabold text-xs py-3 px-4 rounded-xl shadow-sm transition-all cursor-pointer"
                  >
                    {registrandoCaminata
                      ? 'Guardando en tu progreso...'
                      : '🚶 Registrar caminata como Pausa Activa'}
                  </button>
                </div>
              ) : null}
            </div>
          )}

          <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-extrabold text-[#0F172A]">
                Espacios cercanos (2.5 km)
              </h2>
              <span className="text-xs font-bold text-gray-400">
                {espacios.length} encontrados
              </span>
            </div>

            {cargandoEspacios ? (
              <div className="py-12 text-center text-sm text-gray-400">
                Buscando parques y áreas verdes cercanas...
              </div>
            ) : espacios.length === 0 ? (
              <div className="py-10 text-center text-xs text-gray-400">
                {sinApiKey
                  ? 'Configura tu GEOAPIFY_API_KEY para ver los espacios cercanos.'
                  : 'No se encontraron parques registrados en este radio. Prueba otra ubicación.'}
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
                {espacios.map((esp) => {
                  const activo = espacioSeleccionado?.id === esp.id;
                  return (
                    <button
                      key={esp.id}
                      type="button"
                      onClick={() => seleccionarEspacioYCalcularRuta(esp)}
                      className={`w-full text-left p-3.5 rounded-2xl border transition-all cursor-pointer ${
                        activo
                          ? 'border-[#0284C7] bg-[#F0F9FF] shadow-xs'
                          : 'border-gray-100 bg-[#F8FAFC] hover:bg-white hover:border-gray-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="font-bold text-sm text-[#0F172A] truncate">{esp.nombre}</h3>
                          <p className="text-[11px] text-gray-500 mt-0.5">{esp.categoria}</p>
                        </div>
                        <span className="text-xs font-extrabold text-[#0284C7] shrink-0">
                          {esp.distanciaMetros >= 1000
                            ? `${(esp.distanciaMetros / 1000).toFixed(1)} km`
                            : `${esp.distanciaMetros} m`}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
