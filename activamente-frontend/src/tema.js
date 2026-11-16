import { useState, useEffect } from 'react';
import api from './api';

export function obtenerTemaGuardado() {
  try {
    return localStorage.getItem('temaOscuro') === 'true';
  } catch (e) {
    return false;
  }
}

export function aplicarTemaDOM(esOscuro) {
  const valor = Boolean(esOscuro);
  try {
    localStorage.setItem('temaOscuro', String(valor));
  } catch (e) {
    // Ignorar errores de almacenamiento
  }
  if (typeof document !== 'undefined') {
    document.documentElement.classList.toggle('tema-oscuro', valor);
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('temaCambiado', { detail: valor }));
  }
}

export async function cambiarTemaGlobal(nuevoValor) {
  const valor = Boolean(nuevoValor);
  aplicarTemaDOM(valor);

  const token = localStorage.getItem('token');
  if (token) {
    try {
      await api.put('/usuarios/perfil', { temaOscuro: valor });
    } catch (e) {
      // Si falla la red, ya quedó guardado en localStorage
    }
  } else {
    try {
      localStorage.setItem('temaElegidoAntesDeLogin', String(valor));
    } catch (e) {
      // Ignorar
    }
  }
}

export function useTemaOscuro() {
  const [temaOscuro, setTemaOscuro] = useState(() => obtenerTemaGuardado());

  useEffect(() => {
    // Asegurar que la clase en <html> coincida con el estado actual
    document.documentElement.classList.toggle('tema-oscuro', temaOscuro);

    const handleTemaCambiado = (e) => {
      if (typeof e.detail === 'boolean') {
        setTemaOscuro(e.detail);
      } else {
        setTemaOscuro(obtenerTemaGuardado());
      }
    };

    const handleStorage = (e) => {
      if (e.key === 'temaOscuro') {
        const activo = e.newValue === 'true';
        setTemaOscuro(activo);
        document.documentElement.classList.toggle('tema-oscuro', activo);
      }
    };

    window.addEventListener('temaCambiado', handleTemaCambiado);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('temaCambiado', handleTemaCambiado);
      window.removeEventListener('storage', handleStorage);
    };
  }, [temaOscuro]);

  const alternarTema = () => {
    cambiarTemaGlobal(!temaOscuro);
  };

  return { temaOscuro, alternarTema, cambiarTema: cambiarTemaGlobal };
}
