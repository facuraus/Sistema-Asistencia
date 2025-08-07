import React, { useEffect, useRef, useState } from "react";
import * as faceMesh from "@mediapipe/face_mesh";
import * as cam from "@mediapipe/camera_utils";
import "./LivenessCheck.css";

export default function LivenessCheck({ onVerificacionExitosa, datosEmpleado }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const photoRef = useRef(null);
  const blinkCountRef = useRef(0);
  const lastBlinkTimeRef = useRef(null);
  const estabaParpadeandoRef = useRef(false);
  const timerFotoRef = useRef(null);
  const vistaAlFrenteRef = useRef(false);
  const camera = useRef(null);

  const [blinkCount, setBlinkCount] = useState(0);
  const [statusMessage, setStatusMessage] = useState({ text: "", tipo: "" });
  const [verificando, setVerificando] = useState(true);
  const [vistaAlFrente, setVistaAlFrente] = useState(false);
  const [fotoBase64, setFotoBase64] = useState(null);
  const [esperandoParaFoto, setEsperandoParaFoto] = useState(false);
  const [fotoTomada, setFotoTomada] = useState(false);
  const [registrando, setRegistrando] = useState(false);
  const [mensajeRegistro, setMensajeRegistro] = useState("");

  const resetProceso = (mensaje) => {
    setStatusMessage({ text: mensaje, tipo: "error" });
    blinkCountRef.current = 0;
    lastBlinkTimeRef.current = null;
    estabaParpadeandoRef.current = false;
    setBlinkCount(0);
    setVistaAlFrente(false);
    vistaAlFrenteRef.current = false;
    setEsperandoParaFoto(false);
    if (timerFotoRef.current) clearTimeout(timerFotoRef.current);
    setTimeout(() => setStatusMessage({ text: "", tipo: "" }), 5000);
  };

  useEffect(() => {
    const faceMeshInstance = new faceMesh.FaceMesh({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
    });

    faceMeshInstance.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.7,
    });

    faceMeshInstance.onResults(onResults);

    if (videoRef.current) {
      camera.current = new cam.Camera(videoRef.current, {
        onFrame: async () => {
          await faceMeshInstance.send({ image: videoRef.current });
        },
        width: 640,
        height: 480,
      });
      camera.current.start();
    }

    return () => {
      if (camera.current) camera.current.stop();
      if (timerFotoRef.current) clearTimeout(timerFotoRef.current);
    };
  }, []);

  const dist = (p1, p2) => Math.hypot(p1.x - p2.x, p1.y - p2.y);

  const getEAR = (landmarks, left) => {
    const points = left
      ? [33, 160, 158, 133, 153, 144]
      : [362, 385, 387, 263, 373, 380];
    const [p1, p2, p3, p4, p5, p6] = [
      landmarks[points[0]],
      landmarks[points[1]],
      landmarks[points[2]],
      landmarks[points[3]],
      landmarks[points[4]],
      landmarks[points[5]],
    ];
    const vertical = (dist(p2, p6) + dist(p3, p5)) / 2.0;
    const horizontal = dist(p1, p4);
    return vertical / horizontal;
  };

  const estaVistaAlFrente = (landmarks) => {
    const eyeDistance = dist(landmarks[33], landmarks[263]);
    const narizX = (landmarks[1].x + landmarks[2].x) / 2;
    const ojosCentroX = (landmarks[33].x + landmarks[263].x) / 2;
    const margen = 0.015;
    return eyeDistance > 0.08 && Math.abs(narizX - ojosCentroX) < margen;
  };

  const tomarFoto = () => {
    const video = videoRef.current;
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = video.videoWidth;
    tempCanvas.height = video.videoHeight;
    const ctx = tempCanvas.getContext("2d");
    ctx.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);
    const foto = tempCanvas.toDataURL("image/png");
    photoRef.current = foto;
    setFotoBase64(foto);
    setFotoTomada(true);
    setVerificando(false);
    console.log("Foto capturada:", foto);

    if (camera.current) camera.current.stop();
    onVerificacionExitosa(foto);
  };

  const onResults = (results) => {
    if (!verificando) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext("2d");

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

    if (results.multiFaceLandmarks && results.multiFaceLandmarks.length === 1) {
      const landmarks = results.multiFaceLandmarks[0];

      const eyeDistance = dist(landmarks[33], landmarks[263]);
      if (eyeDistance < 0.08) {
        resetProceso("Rostro parcialmente cubierto o deformado.");
        ctx.restore();
        return;
      }

      const puntosClave = [13, 14, 33, 263];
      const visibles = puntosClave.every((i) => {
        const p = landmarks[i];
        return p.visibility === undefined || p.visibility > 0.5;
      });

      if (!visibles) {
        resetProceso("⚠️ Por favor, descubrí tu rostro.");
        ctx.restore();
        return;
      }

      const frente = estaVistaAlFrente(landmarks);
      setVistaAlFrente(frente);
      vistaAlFrenteRef.current = frente;

      if (!frente) {
        resetProceso("Girá la cabeza al frente.");
        ctx.restore();
        return;
      }

      // Dibujo de puntos sobre la cara
      ctx.strokeStyle = "white";
      ctx.lineWidth = 1;
      for (let point of landmarks) {
        ctx.beginPath();
        ctx.arc(point.x * canvas.width, point.y * canvas.height, 1, 0, 2 * Math.PI);
        ctx.stroke();
      }

      const leftEAR = getEAR(landmarks, true);
      const rightEAR = getEAR(landmarks, false);
      const blinkEARThreshold = 0.25;
      const parpadeandoAhora = leftEAR < blinkEARThreshold && rightEAR < blinkEARThreshold;

      if (parpadeandoAhora) {
        estabaParpadeandoRef.current = true;
      } else {
        if (estabaParpadeandoRef.current) {
          blinkCountRef.current += 1;
          setBlinkCount(blinkCountRef.current);
          estabaParpadeandoRef.current = false;
          lastBlinkTimeRef.current = Date.now();
        }
      }

      if (
        blinkCountRef.current >= 5 &&
        frente
      ) {
        if (!esperandoParaFoto) {
          setStatusMessage({ text: "Preparando para tomar la foto...", tipo: "success" });
          setEsperandoParaFoto(true);

          timerFotoRef.current = setTimeout(() => {
            if (!estabaParpadeandoRef.current && vistaAlFrenteRef.current) {
              setStatusMessage({ text: "✅ Verificación exitosa.", tipo: "success" });
              setVerificando(false);
              tomarFoto();
            } else {
              resetProceso("No mantuviste la vista al frente o parpadeaste, intenta de nuevo.");
            }
            setEsperandoParaFoto(false);
          }, 1500);
        }
      } else {
        if (esperandoParaFoto) {
          clearTimeout(timerFotoRef.current);
          setEsperandoParaFoto(false);
          setStatusMessage({ text: "", tipo: "" });
        }
      }
    } else {
      resetProceso("No se detectó una única cara.");
    }

    ctx.restore();
  };

  const registrarEmpleado = async () => {
    setRegistrando(true);
    setMensajeRegistro("");
    try {
      const res = await fetch("http://localhost:5000/api/supervisor/crear-empleado", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          foto: fotoBase64,
          nombre: datosEmpleado.nombre,
          apellido: datosEmpleado.apellido,
          correo: datosEmpleado.correo,
          clave: datosEmpleado.clave,
        }),
      });
      const data = await res.json();
      setMensajeRegistro(data.success ? "Empleado registrado correctamente." : "Error: " + data.mensaje);
    } catch (error) {
      setMensajeRegistro("Error al conectar con el servidor");
      console.error(error);
    }
    setRegistrando(false);
  };

  return (
    <div className="liveness-container">
      {!fotoTomada && (
        <>
          <div className="video-container">
            <video ref={videoRef} className="input_video" autoPlay muted></video>
            <canvas ref={canvasRef} className="output_canvas"></canvas>
          </div>

          <div className="estado-verificacion">
            <p>Vista al frente: {vistaAlFrente ? "✅" : "❌"}</p>
            <p>Parpadeos: {blinkCount} / 5</p>
            {statusMessage.text && (
              <p className={statusMessage.tipo === "error" ? "error-message" : "success-message"}>
                {statusMessage.text}
              </p>
            )}
          </div>
        </>
      )}

      {fotoBase64 && (
        <div className="foto-capturada">
          <h3>Foto Capturada:</h3>
          <img src={fotoBase64} alt="Foto capturada" style={{ width: "320px", borderRadius: "10px" }} />
          <button
            onClick={registrarEmpleado}
            disabled={registrando}
            style={{ marginTop: "10px", padding: "8px 16px" }}
          >
            {registrando ? "Registrando..." : "Registrar empleado"}
          </button>
          {mensajeRegistro && (
            <p
              style={{
                marginTop: "10px",
                color: mensajeRegistro.toLowerCase().includes("error") ? "red" : "green",
                fontWeight: "bold",
              }}
            >
              {mensajeRegistro}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
