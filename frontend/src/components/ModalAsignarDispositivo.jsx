import { useEffect, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import "./ModalAsignarDispositivo.css";

export default function ModalAsignarDispositivo({ onClose }) {
  const [sucursales, setSucursales] = useState([]);
  const [sucursalSeleccionada, setSucursalSeleccionada] = useState("");
  const [qrUrl, setQrUrl] = useState("");

  useEffect(() => {
    // ⚠️ Usar la URL completa si el backend está en otro puerto
    fetch("http://localhost:5000/api/sucursales/sin-dispositivo")
      .then((res) => res.json())
      .then((data) => {
        console.log("Sucursales sin dispositivo:", data);
        setSucursales(data);
      })
      .catch((err) => console.error("Error al cargar sucursales", err));
  }, []);

  const generarQR = async () => {
    if (!sucursalSeleccionada) return;

    const res = await fetch(`http://localhost:5000/api/sucursales/${sucursalSeleccionada}/generar-token`, {
      method: "POST",
    });

    const data = await res.json();
    setQrUrl(data.url);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <h2>Asignar dispositivo a una sucursal</h2>

        <label>Seleccioná una sucursal:</label>
        <select
          value={sucursalSeleccionada}
          onChange={(e) => setSucursalSeleccionada(e.target.value)}
        >
          <option value="">-- Seleccionar --</option>
          {sucursales.map((suc) => (
            <option key={suc.id} value={suc.id}>
              {suc.nombre}
            </option>
          ))}
        </select>

        <button onClick={generarQR} disabled={!sucursalSeleccionada}>
          Generar QR
        </button>

        {qrUrl && (
          <div className="qr-container">
            <p>Escaneá este QR desde el celular:</p>
            <QRCodeCanvas value={qrUrl} size={256} />
          </div>
        )}

        <button onClick={onClose} style={{ marginTop: "20px" }}>
          Cerrar
        </button>
      </div>
    </div>
  );
}
