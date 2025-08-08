import { useState, useEffect } from "react";

export default function VentanaQr() {
  const [token, setToken] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  // Función para generar UUID
  const generarUUID = () =>
    "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
      const r = (Math.random() * 16) | 0,
        v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });

  useEffect(() => {
    // Obtener token de la URL
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get("token") || "";
    setToken(tokenParam);

    // Obtener o generar deviceId persistente
    let storedId = localStorage.getItem("device_id");
    if (!storedId) {
      storedId = generarUUID();
      localStorage.setItem("device_id", storedId);
    }
    setDeviceId(storedId);
  }, []);

  const registrarDispositivo = async () => {
    setMensaje("");
    setError("");

    if (!token || !deviceId) {
      setError("Faltan datos para registrar el dispositivo.");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/registrar-dispositivo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, dispositivo_id: deviceId }),
      });

      const data = await res.json();

      if (res.ok) {
        setMensaje("✅ Dispositivo registrado correctamente.");
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
      <p><strong>Token:</strong> {token}</p>
      <p><strong>Device ID:</strong> {deviceId}</p>

      <button onClick={registrarDispositivo}>Registrar este dispositivo</button>

      {mensaje && <p style={{ color: "green" }}>{mensaje}</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}
