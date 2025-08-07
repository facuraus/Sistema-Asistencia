import React, { useState } from "react";
import "./Empleado.css";
import LivenessAsistencia from "./LivenessAsistencia"; // Importamos el componente

const cards = [
  {
    id: "registro",
    title: "Registrar Ingreso/Egreso",
    description: "Controla tus entradas y salidas.",
  },
];

export default function Empleado() {
  const [modalOpen, setModalOpen] = useState(null);

  function openModal(id) {
    setModalOpen(id);
  }

  function closeModal() {
    setModalOpen(null);
  }

  return (
    <div className="empleado-container">
      <h1 className="empleado-title">Panel Empleado</h1>
      <div className="cards-grid">
        {cards.map(({ id, title, description }) => (
          <div
            key={id}
            className="card"
            onClick={() => openModal(id)}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter") openModal(id);
            }}
            role="button"
            aria-label={`Abrir ${title}`}
          >
            <h3>{title}</h3>
            <p>{description}</p>
          </div>
        ))}
      </div>

      {/* Modal base */}
      {modalOpen && (
        <div
          className="modal-overlay"
          onClick={closeModal}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            tabIndex={-1}
          >
            <button
              className="modal-close"
              onClick={closeModal}
              aria-label="Cerrar modal"
            >
              &times;
            </button>
            <h2>{cards.find((c) => c.id === modalOpen)?.title}</h2>
            <div className="modal-body">
              {modalOpen === "registro" && <LivenessAsistencia onClose={closeModal} />}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
