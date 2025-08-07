import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";

export default function Login() {
  const [correo, setCorreo] = useState("");
  const [clave, setClave] = useState("");
  const [mensaje, setMensaje] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch("http://localhost:5000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correo, clave }),
      });

      const data = await res.json();

      if (res.ok) {
        setMensaje("✅ Login exitoso");

        // Guardar correo e id usuario para usar luego
        localStorage.setItem("correo_empleado", data.correo);
        localStorage.setItem("usuario_id", data.id);

        // Generar o recuperar UUID del dispositivo
        let uuid = localStorage.getItem("uuid_dispositivo");
        if (!uuid) {
          uuid = crypto.randomUUID();
          localStorage.setItem("uuid_dispositivo", uuid);
        }

        // Redirigir según rol
        if (data.rol === "supervisor") {
          navigate("/supervisor");
        } else if (data.rol === "admin_general") {
          navigate("/gerente"); // ← Cambiado a /gerente
        } else {
          navigate("/empleado");
        }
      } else {
        setMensaje(`❌ ${data.error || "Error en el login"}`);
      }
    } catch (error) {
      console.error("Error al conectarse:", error);
      setMensaje("❌ No se pudo conectar con el servidor");
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2 style={{ textAlign: "center", marginBottom: "1rem" }}>Iniciar sesión</h2>
        <form onSubmit={handleSubmit} className="login-form">
          <input
            type="email"
            placeholder="Correo electrónico"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={clave}
            onChange={(e) => setClave(e.target.value)}
            required
          />
          <button type="submit">Ingresar</button>
          {mensaje && <p className="mensaje">{mensaje}</p>}
        </form>
      </div>
    </div>
  );
}
