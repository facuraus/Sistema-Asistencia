import { useState } from "react";
import "./Supervisor.css";
import ModalCrearSucursal from "./ModalCrearSucursal";
// import ModalCrearSupervisor from "./ModalCrearSupervisor";
// import ModalMoverEmpleado from "./ModalMoverEmpleado";
// import ModalReportesGlobales from "./ModalReportesGlobales";
import ModalAsignarDispositivo from "./ModalAsignarDispositivo"; // ✅ Nuevo modal

export default function Gerente() {
  const [modalSucursal, setModalSucursal] = useState(false);
  const [modalSupervisor, setModalSupervisor] = useState(false);
  const [modalMoverEmpleado, setModalMoverEmpleado] = useState(false);
  const [modalReportes, setModalReportes] = useState(false);
  const [mostrarModalDispositivo, setMostrarModalDispositivo] = useState(false); // ✅ Nuevo estado

  const acciones = [
    {
      titulo: "Crear Sucursal / Área",
      descripcion: "Registrar una nueva sucursal o área en el sistema",
      onClick: () => setModalSucursal(true),
    },
    {
      titulo: "Asignar Dispositivo",
      descripcion: "Asigna dispositivo a una sucursal",
      onClick: () => setMostrarModalDispositivo(true), // ✅ Acción corregida
    },
    {
      titulo: "Crear Supervisor",
      descripcion: "Registrar un nuevo supervisor para una sucursal",
      onClick: () => setModalSupervisor(true),
    },
    {
      titulo: "Mover Empleados",
      descripcion: "Transferir empleados entre sucursales",
      onClick: () => setModalMoverEmpleado(true),
    },
    {
      titulo: "Ver Reportes Globales",
      descripcion: "Consultar estadísticas generales de asistencia",
      onClick: () => setModalReportes(true),
    },
  ];

  return (
    <div className="supervisor-container">
      <h2>Panel del Gerente</h2>
      <div className="tarjetas">
        {acciones.map((accion, index) => (
          <div className="tarjeta" key={index} onClick={accion.onClick}>
            <h3>{accion.titulo}</h3>
            <p>{accion.descripcion}</p>
          </div>
        ))}
      </div>

      {/* Modales */}
      {modalSucursal && (
        <ModalCrearSucursal onClose={() => setModalSucursal(false)} />
      )}

      {mostrarModalDispositivo && (
        <ModalAsignarDispositivo onClose={() => setMostrarModalDispositivo(false)} />
      )}
    </div>
  );
}
