import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './Login';
import Registro from './Registro';
import Layout from './Layout';
import Inicio from './Inicio';
import Rutina from './Rutina';
import Ajustes from './Ajustes';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas Públicas (Pantalla completa) */}
        <Route path="/" element={<Login />} />
        <Route path="/registro" element={<Registro />} />
        
        {/* Rutas Privadas (Con barra lateral) */}
        <Route path="/app" element={<Layout />}>
          <Route index element={<Navigate to="inicio" replace />} />
          <Route path="inicio" element={<Inicio />} />
          <Route path="rutinas" element={<Rutina />} />
          <Route path="ajustes" element={<Ajustes />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;