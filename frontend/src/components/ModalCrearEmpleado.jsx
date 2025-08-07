import { useState } from "react";
import LivenessCheck from "./LivenessCheck";
import "./ModalCrearEmpleado.css";

export default function CrearEmpleado({ onClose }) {
  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    correo: "",
    clave: "",
  });

  const [verificacionExitosa, setVerificacionExitosa] = useState(false);
  const [mostrarLiveness, setMostrarLiveness] = useState(false);
  const [fotoCapturada, setFotoCapturada] = useState(null);
  const [mensajeServidor, setMensajeServidor] = useState("");
  const [errorServidor, setErrorServidor] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setMostrarLiveness(true);
    setMensajeServidor("");
    setErrorServidor("");
  };

  // Recibe la foto base64 desde LivenessCheck
  const handleLivenessSuccess = (fotoBase64) => {
    setFotoCapturada(fotoBase64);
    setMostrarLiveness(false);
  };

  // Enviar datos al backend para registrar empleado
  const registrarEmpleado = async () => {
    setMensajeServidor("");
    setErrorServidor("");
    const correoSupervisor = localStorage.getItem("correo_supervisor"); // Aquí toma el correo del supervisor

    if (!correoSupervisor) {
      setErrorServidor("No se encontró correo del supervisor. Por favor, inicie sesión nuevamente.");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/supervisor/crear-empleado", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          foto: fotoCapturada,
          nombre: form.nombre,
          apellido: form.apellido,
          correo: form.correo,
          clave: form.clave,
          correo_supervisor: correoSupervisor,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setMensajeServidor("Empleado registrado correctamente.");
        setVerificacionExitosa(true);
      } else {
        setErrorServidor(data.mensaje || "Error al registrar empleado.");
      }
    } catch (error) {
      setErrorServidor("Error de conexión con el servidor.");
      console.error(error);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="close-button" onClick={onClose}>
          &times;
        </button>
        <h2>Crear Empleado</h2>

        {mostrarLiveness ? (
          <LivenessCheck onVerificacionExitosa={handleLivenessSuccess} datosEmpleado={form} />
        ) : verificacionExitosa ? (
          <>
            <p className="success-message">✅ {mensajeServidor}</p>
            <button onClick={onClose}>Cerrar</button>
          </>
        ) : fotoCapturada ? (
          <>
            <p>Foto capturada:</p>
            <img
              src={fotoCapturada}
              alt="Foto capturada"
              style={{ width: "320px", borderRadius: "10px" }}
            />
            <button onClick={registrarEmpleado}>Registrar Empleado</button>
            <button
              onClick={() => {
                setFotoCapturada(null);
                setVerificacionExitosa(false);
                setMensajeServidor("");
                setErrorServidor("");
                setMostrarLiveness(true);
              }}
            >
              Reintentar verificación
            </button>
            {mensajeServidor && <p className="success-message">{mensajeServidor}</p>}
            {errorServidor && <p className="error-message">{errorServidor}</p>}
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              name="nombre"
              placeholder="Nombre"
              value={form.nombre}
              onChange={handleChange}
              required
            />
            <input
              type="text"
              name="apellido"
              placeholder="Apellido"
              value={form.apellido}
              onChange={handleChange}
              required
            />
            <input
              type="email"
              name="correo"
              placeholder="Correo Electrónico"
              value={form.correo}
              onChange={handleChange}
              required
            />
            <input
              type="password"
              name="clave"
              placeholder="Contraseña"
              value={form.clave}
              onChange={handleChange}
              required
            />
            <button type="submit">Verificar Rostro</button>
          </form>
        )}
      </div>
    </div>
  );
}
