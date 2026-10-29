import { useState, useEffect } from 'react';
import api from './api';

export default function Ajustes() {
  const [nombre, setNombre] = useState('');
  const [ocupacion, setOcupacion] = useState('estudiante');
  const [fotoPerfil, setFotoPerfil] = useState('https://api.dicebear.com/7.x/notionists/svg?seed=Generico');
  const [fotoModificada, setFotoModificada] = useState(false);
  const [ubicacionPorDefecto, setUbicacionPorDefecto] = useState('oficina');
  const [tiempoPorDefecto, setTiempoPorDefecto] = useState('10');
  const [estadoGuardado, setEstadoGuardado] = useState({ tipo: '', texto: '' });

  const avataresPredefinidos = [
    'https://api.dicebear.com/7.x/notionists/svg?seed=Ramses',
    'https://api.dicebear.com/7.x/notionists/svg?seed=Felix',
    'https://api.dicebear.com/7.x/notionists/svg?seed=Aneka',
    'https://api.dicebear.com/7.x/notionists/svg?seed=Caleb',
    'https://api.dicebear.com/7.x/notionists/svg?seed=Jude'
  ];

  useEffect(() => {
    const cargarPerfil = async () => {
      try {
        const response = await api.get('/usuarios/perfil');
        const data = response.data;
        setNombre(data.nombre || '');
        setOcupacion(data.ocupacion || 'estudiante');
        const foto = data.fotoPerfil || 'https://api.dicebear.com/7.x/notionists/svg?seed=Generico';
        setFotoPerfil(foto);
        setUbicacionPorDefecto(data.ubicacionPorDefecto || 'oficina');
        setTiempoPorDefecto(data.tiempoPorDefecto ? data.tiempoPorDefecto.toString() : '10');
        localStorage.setItem('fotoPerfil', foto);
        window.dispatchEvent(new Event('perfilActualizado'));
      } catch (error) {
        console.error('Error al cargar el perfil:', error);
      }
    };
    cargarPerfil();
  }, []);

  const handleSubirFoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 400;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height = Math.round((height * MAX_SIZE) / width);
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width = Math.round((width * MAX_SIZE) / height);
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setFotoPerfil(compressedDataUrl);
        setFotoModificada(true);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const confirmarCambioFoto = async () => {
    setEstadoGuardado({ tipo: '', texto: '' });
    try {
      await api.put('/usuarios/perfil', {
        nombre,
        ocupacion,
        fotoPerfil,
        ubicacionPorDefecto,
        tiempoPorDefecto: parseInt(tiempoPorDefecto, 10) || 10
      });
      localStorage.setItem('fotoPerfil', fotoPerfil);
      window.dispatchEvent(new Event('perfilActualizado'));
      setFotoModificada(false);
      setEstadoGuardado({ tipo: 'exito', texto: '¡Foto de perfil actualizada correctamente en la base de datos!' });
    } catch (error) {
      console.error(error);
      setEstadoGuardado({ tipo: 'error', texto: error.response?.data?.detalle || 'Error al guardar la foto en el servidor' });
    }
  };

  const guardarCambiosPersonales = async (e) => {
    e.preventDefault();
    setEstadoGuardado({ tipo: '', texto: '' });
    try {
      await api.put('/usuarios/perfil', {
        nombre,
        ocupacion,
        fotoPerfil,
        ubicacionPorDefecto,
        tiempoPorDefecto: parseInt(tiempoPorDefecto, 10) || 10
      });
      localStorage.setItem('fotoPerfil', fotoPerfil);
      window.dispatchEvent(new Event('perfilActualizado'));
      setFotoModificada(false);
      setEstadoGuardado({ tipo: 'exito', texto: '¡Ajustes guardados correctamente en la base de datos!' });
    } catch (error) {
      console.error(error);
      setEstadoGuardado({ tipo: 'error', texto: error.response?.data?.detalle || 'Error al guardar los ajustes' });
    }
  };

  return (
    <div className="animate-fade-in text-gray-800 font-sans pb-10">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-[#0F172A] tracking-tight">Ajustes de Cuenta</h1>
        <p className="text-gray-500 mt-1">Personaliza tu perfil y preferencias de pausas activas.</p>
      </div>

      {estadoGuardado.texto && (
        <div className={`mb-6 p-4 rounded-2xl text-sm font-semibold border ${estadoGuardado.tipo === 'exito' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
          {estadoGuardado.tipo === 'exito' ? '✅ ' : '❌ '}{estadoGuardado.texto}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* COLUMNA IZQUIERDA: Foto de Perfil */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
            <h2 className="text-lg font-bold text-[#0F172A] mb-6 w-full text-left">Foto de Perfil</h2>

            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-blue-50 shadow-md mb-4 bg-gray-50">
              <img src={fotoPerfil} alt="Perfil" className="w-full h-full object-cover" />
            </div>

            <label className="bg-[#F8FAFC] hover:bg-gray-100 border border-gray-200 text-[#0F172A] font-semibold py-2 px-4 rounded-xl cursor-pointer transition-colors text-sm w-full mb-6">
              📷 Subir mi propia foto
              <input type="file" accept="image/*" className="hidden" onChange={handleSubirFoto} />
            </label>

            <h3 className="text-sm font-semibold text-gray-500 mb-3 w-full text-left">O elige un avatar:</h3>
            <div className="flex flex-wrap gap-3 justify-center">
              {avataresPredefinidos.map((avatar, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setFotoPerfil(avatar);
                    setFotoModificada(true);
                  }}
                  className={`w-12 h-12 rounded-full border-2 overflow-hidden transition-all hover:scale-110 ${fotoPerfil === avatar ? 'border-[#0284C7] shadow-md scale-110' : 'border-transparent opacity-70 hover:opacity-100'}`}
                >
                  <img src={avatar} alt={`Avatar ${idx}`} className="w-full h-full bg-gray-50" />
                </button>
              ))}
            </div>

            {fotoModificada && (
              <button
                type="button"
                onClick={confirmarCambioFoto}
                className="w-full mt-6 bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 rounded-xl shadow-md transition-all text-sm animate-fade-in cursor-pointer"
              >
                ✅ Confirmar nueva foto
              </button>
            )}
          </div>
        </div>

        {/* COLUMNA DERECHA: Formularios */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <form onSubmit={guardarCambiosPersonales} className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col gap-8">
            <div>
              <h2 className="text-xl font-bold text-[#0F172A] mb-4">Información Personal</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nombre Completo</label>
                  <input
                    type="text"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    required
                    className="w-full border border-gray-200 rounded-xl p-3 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#0284C7] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Ocupación</label>
                  <select
                    value={ocupacion}
                    onChange={(e) => setOcupacion(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl p-3 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#0284C7] outline-none"
                  >
                    <option value="estudiante">Estudiante</option>
                    <option value="trabajador_oficina">Trabajador de Oficina</option>
                    <option value="docente">Docente</option>
                    <option value="operativo">Personal Operativo</option>
                    <option value="personal_administrativo">Personal Administrativo</option>
                    <option value="oficinista">Oficinista</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
              </div>
            </div>

            <hr className="border-gray-100" />

            <div>
              <h2 className="text-xl font-bold text-[#0F172A] mb-1">Preferencias de Pausas</h2>
              <p className="text-sm text-gray-500 mb-4">Estos valores aparecerán preseleccionados al generar una rutina nueva.</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Ubicación frecuente</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['oficina', 'casa', 'aula', 'area_trabajo'].map((loc) => (
                      <button
                        key={loc}
                        type="button"
                        onClick={() => setUbicacionPorDefecto(loc)}
                        className={`py-2 px-2 rounded-lg border text-sm font-medium transition-all capitalize ${ubicacionPorDefecto === loc ? 'border-[#0284C7] bg-[#F0F9FF] text-[#0369a1]' : 'border-gray-200 text-gray-600'}`}
                      >
                        {loc.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Tiempo preferido</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['5', '10', '12'].map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setTiempoPorDefecto(t)}
                        className={`py-2 px-1 rounded-lg border text-sm font-medium transition-all ${tiempoPorDefecto === t ? 'border-[#0284C7] bg-[#F0F9FF] text-[#0369a1]' : 'border-gray-200 text-gray-600'}`}
                      >
                        {t} min
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                className="bg-[#0284C7] hover:bg-[#0369a1] text-white font-bold py-3 px-8 rounded-2xl shadow-md transition-all cursor-pointer"
              >
                Guardar Cambios
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}