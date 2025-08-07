from flask import Blueprint, request, jsonify
from backend.extensions import db
from datetime import datetime
from sqlalchemy import text
import base64
import os
import math
import face_recognition
import numpy as np
import io
from PIL import Image

empleado_bp = Blueprint("empleado_bp", __name__)

ASISTENCIAS_DIR = "IMG-Asistencias"
EMPLEADOS_DIR = "IMG-Empleados"
os.makedirs(ASISTENCIAS_DIR, exist_ok=True)
os.makedirs(EMPLEADOS_DIR, exist_ok=True)

def calcular_distancia(lat1, lon1, lat2, lon2):
    R = 6371000
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    d_phi = math.radians(lat2 - lat1)
    d_lambda = math.radians(lon2 - lon1)
    a = math.sin(d_phi/2)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(d_lambda/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    return R * c

def base64_to_image(base64_str):
    header, encoded = base64_str.split(",", 1)
    image_data = base64.b64decode(encoded)
    image = Image.open(io.BytesIO(image_data))
    return image

def imagen_a_np(image):
    return np.array(image.convert('RGB'))

@empleado_bp.route("/crear-empleado", methods=["POST"])
def crear_empleado():
    data = request.get_json()
    nombre = data.get("nombre")
    apellido = data.get("apellido")
    correo = data.get("correo")
    clave = data.get("clave")
    foto_base64 = data.get("foto")

    if not all([nombre, apellido, correo, clave, foto_base64]):
        return jsonify({"success": False, "mensaje": "Faltan datos obligatorios"}), 400

    # Guardar foto
    try:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{correo}_{timestamp}.png"
        filepath = os.path.join(EMPLEADOS_DIR, filename)
        header, encoded = foto_base64.split(",", 1)
        with open(filepath, "wb") as f:
            f.write(base64.b64decode(encoded))
    except Exception as e:
        return jsonify({"success": False, "mensaje": "Error guardando foto"}), 500

    try:
        # Insertar usuario con foto_path en DB
        insert_sql = text("""
            INSERT INTO usuarios (nombre, apellido, correo, password_hash, rol_id, foto_path, activo)
            VALUES (:nombre, :apellido, :correo, SHA2(:clave, 256), 3, :foto_path, TRUE)
        """)
        db.session.execute(insert_sql, {
            "nombre": nombre,
            "apellido": apellido,
            "correo": correo,
            "clave": clave,
            "foto_path": filename
        })
        db.session.commit()
        return jsonify({"success": True, "mensaje": "Empleado creado correctamente."})
    except Exception as e:
        db.session.rollback()
        print("Error al crear empleado:", e)
        return jsonify({"success": False, "mensaje": "Error interno creando empleado"}), 500

@empleado_bp.route("/registrar-asistencia", methods=["POST"])
def registrar_asistencia():
    data = request.get_json()
    correo = data.get("correo")
    foto_base64 = data.get("foto")
    lat = data.get("lat")
    lon = data.get("lon")
    tipo = data.get("tipo", "entrada")
    uuid_dispositivo = data.get("uuid_dispositivo")

    if not all([correo, foto_base64, lat, lon, tipo, uuid_dispositivo]):
        return jsonify({"success": False, "mensaje": "Faltan datos obligatorios"}), 400

    try:
        # Obtener usuario
        user = db.session.execute(
            text("SELECT id, foto_path FROM usuarios WHERE correo = :correo AND activo = 1"),
            {"correo": correo}
        ).fetchone()

        if not user:
            return jsonify({"success": False, "mensaje": "Usuario no encontrado o inactivo"}), 404

        usuario_id = user.id
        foto_registro_path = user.foto_path
        if not foto_registro_path:
            return jsonify({"success": False, "mensaje": "El usuario no tiene foto de registro"}), 400

        # Validar dispositivo
        disp = db.session.execute(
            text("SELECT id FROM dispositivos WHERE uuid_dispositivo = :uuid"),
            {"uuid": uuid_dispositivo}
        ).fetchone()

        if not disp:
            return jsonify({"success": False, "mensaje": "Dispositivo no registrado"}), 400

        dispositivo_id = disp.id

        # Validar sucursales
        sucursales = db.session.execute(
            text("""
                SELECT s.id, s.lat, s.lon, s.radio_metros
                FROM sucursales s
                JOIN usuarios_sucursales us ON us.sucursal_id = s.id
                WHERE us.usuario_id = :uid
            """), {"uid": usuario_id}).fetchall()

        sucursal_fichada_id = None
        for s in sucursales:
            dist = calcular_distancia(lat, lon, s.lat, s.lon)
            if dist <= s.radio_metros:
                sucursal_fichada_id = s.id
                break

        if not sucursal_fichada_id:
            return jsonify({"success": False, "mensaje": "No estás dentro del rango permitido de tu sucursal."}), 403

        # Cargar imagen registro y foto actual para comparar
        ruta_foto_registro = os.path.join(EMPLEADOS_DIR, foto_registro_path)
        if not os.path.isfile(ruta_foto_registro):
            return jsonify({"success": False, "mensaje": "Foto de registro no encontrada en servidor"}), 500

        foto_registro_img = base64_to_image("data:image/png;base64," + open(ruta_foto_registro, "rb").read().encode("base64"))
        # Pero para simplificar, mejor cargar con PIL directamente:
        foto_registro_img = Image.open(ruta_foto_registro)
        foto_registro_np = np.array(foto_registro_img.convert("RGB"))

        foto_actual_img = base64_to_image(foto_base64)
        foto_actual_np = np.array(foto_actual_img.convert("RGB"))

        enc_registro = face_recognition.face_encodings(foto_registro_np)
        enc_actual = face_recognition.face_encodings(foto_actual_np)

        if not enc_registro or not enc_actual:
            return jsonify({"success": False, "mensaje": "No se pudo detectar rostro en alguna de las imágenes"}), 400

        distancia = face_recognition.face_distance(enc_registro, enc_actual[0])[0]
        umbral = 0.5  # Ajustar según pruebas

        if distancia > umbral:
            return jsonify({"success": False, "mensaje": "La cara no coincide con la foto de registro."}), 401

        # Guardar imagen asistencia
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{usuario_id}_{timestamp}.png"
        filepath = os.path.join(ASISTENCIAS_DIR, filename)
        header, encoded = foto_base64.split(",", 1)
        with open(filepath, "wb") as f:
            f.write(base64.b64decode(encoded))

        # Registrar asistencia
        sql_insert = text("""
            INSERT INTO asistencias (
                usuario_id, fecha_hora, tipo, lat, lon, llego_tarde,
                estado_asistencia, sucursal_fichada_id, dispositivo_id, validacion_facial
            )
            VALUES (
                :usuario_id, :fecha_hora, :tipo, :lat, :lon, :llego_tarde,
                :estado_asistencia, :sucursal_id, :dispositivo_id, :validacion_facial
            )
        """)

        db.session.execute(sql_insert, {
            "usuario_id": usuario_id,
            "fecha_hora": datetime.now(),
            "tipo": tipo,
            "lat": lat,
            "lon": lon,
            "llego_tarde": False,
            "estado_asistencia": "presente",
            "sucursal_id": sucursal_fichada_id,
            "dispositivo_id": dispositivo_id,
            "validacion_facial": True
        })

        db.session.commit()

        return jsonify({"success": True, "mensaje": "Asistencia registrada correctamente."})

    except Exception as e:
        db.session.rollback()
        print("Error:", e)
        return jsonify({"success": False, "mensaje": "Error interno del servidor"}), 500
