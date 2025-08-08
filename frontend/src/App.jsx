import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./components/Login";
import Supervisor from "./components/Supervisor";
import Empleado from "./components/Empleado";
import Gerente from "./components/Gerente";
import VentanaQr from "./components/VentanaQr"; // 👈 nuevo import

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/supervisor" element={<Supervisor />} />
        <Route path="/empleado" element={<Empleado />} />
        <Route path="/gerente" element={<Gerente />} /> 
        <Route path="/registrar-dispositivo" element={<VentanaQr />} /> {/* 👈 nueva ruta */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
