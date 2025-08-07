import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./components/Login";
import Supervisor from "./components/Supervisor";
import Empleado from "./components/Empleado";
import Gerente from "./components/Gerente"; // nuevo import

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/supervisor" element={<Supervisor />} />
        <Route path="/empleado" element={<Empleado />} />
        <Route path="/gerente" element={<Gerente />} /> 
      </Routes>
    </BrowserRouter>
  );
}

export default App;
