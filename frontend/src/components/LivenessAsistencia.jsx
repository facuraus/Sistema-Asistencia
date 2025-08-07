import { useState } from "react";
import LivenessCheck from "./LivenessCheck";
import "./LivenessAsistencia.css"; // Asegurate de crear este archivo con estilos

export default function LivenessAsistencia({ onClose }) {
  const [fotoCapturada, setFotoCapturada] = useState(null);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [tipoAsistencia, setTipoAsistencia] = useState("entrada");

  const obtenerUbicacion = () =>
    new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject("Geolocalización no soportada.");
      } else {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            resolve({
              lat: pos.coords.latitude,
              lon: pos.coords.longitude,
            });
          },
          () => reject("Error al obtener ubicación.")
        );
      }
    });

  const handleVerificacionExitosa = async (fotoBase64) => {
    setFotoCapturada(fotoBase64);
    setMensaje("");
    setError("");
    setEnviando(true);

    const correo = localStorage.getItem("correo_empleado");
    const uuid_dispositivo = localStorage.getItem("uuid_dispositivo");

    if (!correo || !uuid_dispositivo) {
      setError("Faltan datos del usuario o dispositivo.");
      setEnviando(false);
      return;
    }

    try {
      const { lat, lon } = await obtenerUbicacion();

      const res = await fetch("http://localhost:5000/api/empleado/registrar-asistencia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          correo,
          foto: fotoBase64,
          lat,
          lon,
          tipo: tipoAsistencia,
          uuid_dispositivo,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setMensaje("✅ Asistencia registrada correctamente.");
      } else {
        setError(data.mensaje || "Error al registrar asistencia.");
      }
    } catch (err) {
      console.error(err);
      setError("Error al registrar asistencia.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="close-button" onClick={onClose} aria-label="Cerrar modal">
          &times;
        </button>
        <h2>Registrar Asistencia</h2>

        {!fotoCapturada && !mensaje && !error && (
          <>
            <label htmlFor="tipoAsistencia">
              Tipo:
              <select
                id="tipoAsistencia"
                value={tipoAsistencia}
                onChange={(e) => setTipoAsistencia(e.target.value)}
                style={{ marginLeft: 8 }}
              >
                <option value="entrada">Entrada</option>
                <option value="salida">Salida</option>
              </select>
            </label>
            <LivenessCheck onVerificacionExitosa={handleVerificacionExitosa} />
          </>
        )}

        {enviando && <p>Registrando asistencia...</p>}

        {mensaje && (
          <>
            <p className="success-message">{mensaje}</p>
            <button onClick={onClose}>Cerrar</button>
          </>
        )}

        {error && (
          <>
            <p className="error-message">{error}</p>
            <button
              onClick={() => {
                setFotoCapturada(null);
                setMensaje("");
                setError("");
              }}
            >
              Reintentar
            </button>
          </>
        )}
      </div>
    </div>
  );
}
