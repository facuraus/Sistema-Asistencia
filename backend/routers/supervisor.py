import os
import cv2
import numpy as np
import base64
import datetime
import re
import pymysql
from flask import Blueprint, request, jsonify

supervisor = Blueprint("supervisor", __name__)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMG_DIR = os.path.join(BASE_DIR, "IMG-Empleados")
os.makedirs(IMG_DIR, exist_ok=True)

# Conexión a MySQL
def get_db_connection():
    return pymysql.connect(
        host="localhost",
        user="root",
        password="Facuraus123-",  
        database="sistema_asistencias",
        cursorclass=pymysql.cursors.DictCursor
    )

@supervisor.route("/crear-empleado", methods=["POST"])
def crear_empleado():
    data = request.get_json()
    print("Datos recibidos:", data)  # Debug

    nombre = data.get("nombre")
    apellido = data.get("apellido")
    correo = data.get("correo")
    clave = data.get("clave")
    foto_base64 = data.get("foto")
    correo_supervisor = data.get("correo_supervisor")

    if not all([nombre, apellido, correo, clave, foto_base64, correo_supervisor]):
        return jsonify({"mensaje": "Faltan datos"}), 400

    try:
        # Decodificar imagen
        header, encoded = foto_base64.split(",", 1)
        img_bytes = base64.b64decode(encoded)
        nparr = np.frombuffer(img_bytes, np.uint8)
        img_np = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        safe_correo = re.sub(r"[@.]", "_", correo)
        timestamp = datetime.datetime.now().strftime("%Y%m%d%H%M%S")
        filename = f"{safe_correo}_{timestamp}.png"
        filepath = os.path.join(IMG_DIR, filename)

        if not cv2.imwrite(filepath, img_np):
            return jsonify({"mensaje": "No se pudo guardar la imagen"}), 500

        conn = get_db_connection()
        with conn:
            with conn.cursor() as cursor:
                # Verificar si el correo ya existe
                cursor.execute("SELECT id FROM usuarios WHERE correo = %s", (correo,))
                if cursor.fetchone():
                    return jsonify({"mensaje": "El correo ya está registrado"}), 409

                # Obtener ID del supervisor
                cursor.execute("SELECT id FROM usuarios WHERE correo = %s AND rol_id = 2", (correo_supervisor,))
                supervisor_row = cursor.fetchone()
                if not supervisor_row:
                    return jsonify({"mensaje": "Supervisor no encontrado"}), 404
                supervisor_id = supervisor_row["id"]

                # Obtener la sucursal del supervisor
                cursor.execute("""
                    SELECT sucursal_id FROM usuarios_sucursales
                    WHERE usuario_id = %s LIMIT 1
                """, (supervisor_id,))
                sucursal_row = cursor.fetchone()
                if not sucursal_row:
                    return jsonify({"mensaje": "Sucursal del supervisor no encontrada"}), 404
                sucursal_id = sucursal_row["sucursal_id"]

                # Insertar empleado
                cursor.execute("""
                    INSERT INTO usuarios (nombre, apellido, correo, password_hash, rol_id, foto_path)
                    VALUES (%s, %s, %s, SHA2(%s, 256), %s, %s)
                """, (nombre, apellido, correo, clave, 3, filename))
                empleado_id = cursor.lastrowid

                # Relacionar con sucursal
                cursor.execute("""
                    INSERT INTO usuarios_sucursales (usuario_id, sucursal_id)
                    VALUES (%s, %s)
                """, (empleado_id, sucursal_id))

                conn.commit()

        return jsonify({"success": True, "mensaje": "Empleado creado correctamente"})

    except Exception as e:
        print("Error:", e)
        return jsonify({"mensaje": "Error al procesar la solicitud"}), 500
