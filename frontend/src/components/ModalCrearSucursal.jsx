import { useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./ModalCrearSucursal.css";

// Para corregir icono default en Leaflet (por defecto no carga bien)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

export default function CrearSucursal({ onClose }) {
  const [nombre, setNombre] = useState("");
  const [direccion, setDireccion] = useState("");
  const [latLon, setLatLon] = useState(null); // { lat, lon }
  const [cargando, setCargando] = useState(false);
  const [confirmar, setConfirmar] = useState(false);
  const [error, setError] = useState("");

  const RADIO_METROS = 100;

  const buscarDireccion = async () => {
    setError("");
    setCargando(true);
    try {
      const resGeo = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          direccion
        )}`
      );
      const datosGeo = await resGeo.json();

      if (datosGeo.length === 0) {
        setError("No se pudo encontrar la dirección. Verificá que sea correcta.");
        setCargando(false);
        return;
      }

      const lat = parseFloat(datosGeo[0].lat);
      const lon = parseFloat(datosGeo[0].lon);
      setLatLon({ lat, lon });
      setConfirmar(true);
    } catch {
      setError("Error al buscar la dirección.");
    }
    setCargando(false);
  };

  const handleCrear = async () => {
    setCargando(true);
    try {
      const res = await fetch("http://localhost:5000/api/sucursales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre,
          direccion,
          radio_metros: RADIO_METROS,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        alert("Error: " + (errorData.error || "Error desconocido"));
        setCargando(false);
        return;
      }

      alert("Sucursal creada correctamente");
      onClose();
    } catch (err) {
      alert("Error de red: " + err.message);
    }
    setCargando(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!nombre.trim() || !direccion.trim()) {
      alert("Nombre y dirección son obligatorios");
      return;
    }
    buscarDireccion();
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-container" style={{ maxWidth: 500 }}>
        <h3>Crear Nueva Sucursal</h3>
        <form onSubmit={handleSubmit}>
          <label>
            Nombre: <br />
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
              disabled={confirmar}
            />
          </label>

          <label>
            Dirección: <br />
            <textarea
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
              rows={3}
              required
              disabled={confirmar}
            />
          </label>

          <p>
            <strong>Radio:</strong> {RADIO_METROS} metros (fijo)
          </p>

          {!confirmar && (
            <button type="submit" disabled={cargando}>
              {cargando ? "Buscando..." : "Buscar Dirección"}
            </button>
          )}

          {error && <p style={{ color: "red" }}>{error}</p>}

          {confirmar && latLon && (
            <>
              <p>¿Confirmás esta ubicación en el mapa?</p>
              <div style={{ height: 300, marginBottom: 10 }}>
                <MapContainer
                  center={[latLon.lat, latLon.lon]}
                  zoom={16}
                  style={{ height: "100%", width: "100%" }}
                  scrollWheelZoom={false}
                >
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <Marker position={[latLon.lat, latLon.lon]}>
                    <Popup>{direccion}</Popup>
                  </Marker>
                </MapContainer>
              </div>

              <button onClick={handleCrear} disabled={cargando}>
                {cargando ? "Creando..." : "Confirmar y Crear Sucursal"}
              </button>{" "}
              <button
                onClick={() => {
                  setConfirmar(false);
                  setLatLon(null);
                  setError("");
                }}
                disabled={cargando}
              >
                Cancelar
              </button>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
