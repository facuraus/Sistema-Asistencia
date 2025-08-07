import { useState } from "react";
import "./Supervisor.css";
import ModalCrearEmpleado from "./ModalCrearEmpleado";

export default function Supervisor() {
  const [modalCrearEmpleadoVisible, setModalCrearEmpleadoVisible] = useState(false);

  const acciones = [
    {
      titulo: "Crear Empleado",
      descripcion: "Registrar un nuevo empleado en tu sucursal",
      onClick: () => setModalCrearEmpleadoVisible(true),
    },
    {
      titulo: "Ver Asistencias",
      descripcion: "Consultar registros de entrada/salida",
      onClick: () => alert("Abrir modal: Ver Asistencias"),
    },
    {
      titulo: "Justificaciones",
      descripcion: "Ver y registrar justificaciones de inasistencias",
      onClick: () => alert("Abrir modal: Justificaciones"),
    },
    {
      titulo: "Generar Reporte",
      descripcion: "Exportar asistencia de tu grupo",
      onClick: () => alert("Abrir modal: Reporte"),
    },
  ];

  return (
    <div className="supervisor-container">
      <h2>Panel del Supervisor</h2>
      <div className="tarjetas">
        {acciones.map((accion, index) => (
          <div className="tarjeta" key={index} onClick={accion.onClick}>
            <h3>{accion.titulo}</h3>
            <p>{accion.descripcion}</p>
          </div>
        ))}
      </div>

      {/* Modal para Crear Empleado */}
      {modalCrearEmpleadoVisible && (
        <ModalCrearEmpleado onClose={() => setModalCrearEmpleadoVisible(false)} />
      )}
    </div>
  );
}
