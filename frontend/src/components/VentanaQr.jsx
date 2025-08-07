import { useState, useEffect } from "react";

export default function VentanaQr() {
  const [token, setToken] = useState("");
  const [dispositivoId, setDispositivoId] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  // Al montar, obtenemos el token de la URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get("token") || "";
    setToken(tokenParam);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje("");
    setError("");

    if (!token || !dispositivoId) {
      setError("Faltan datos para registrar el dispositivo.");
      return;
    }

    try {
      const res = await fetch("/api/registrar-dispositivo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, dispositivo_id: dispositivoId }),
      });

      const data = await res.json();

      if (res.ok) {
        setMensaje("Dispositivo registrado correctamente.");
      } else {
        setError(data.error || "Error al registrar dispositivo.");
      }
    } catch (err) {
      setError("Error de red o servidor.");
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Registro de dispositivo desde QR</h2>
      <p>Token: <strong>{token}</strong></p>

      <form onSubmit={handleSubmit}>
        <label>
          ID del dispositivo (ej: IMEI o identificador):
          <input
            type="text"
            value={dispositivoId}
            onChange={(e) => setDispositivoId(e.target.value)}
            required
          />
        </label>
        <br /><br />
        <button type="submit">Registrar dispositivo</button>
      </form>

      {mensaje && <p style={{ color: "green" }}>{mensaje}</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}
