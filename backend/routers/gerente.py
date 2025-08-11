from flask import Blueprint, request, jsonify, make_response
from backend.extensions import db
from geopy.geocoders import Nominatim  # type: ignore
from geopy.exc import GeocoderTimedOut  # type: ignore
from sqlalchemy import text
import uuid
from datetime import datetime

gerente_bp = Blueprint("gerente_bp", __name__)

# Crear sucursal con geocoding
@gerente_bp.route("/sucursales", methods=["POST", "OPTIONS"])
def crear_sucursal():
    if request.method == "OPTIONS":
        response = make_response()
        response.headers.add("Access-Control-Allow-Origin", "*")
        response.headers.add("Access-Control-Allow-Headers", "Content-Type")
        response.headers.add("Access-Control-Allow-Methods", "POST, OPTIONS")
        return response, 200

    try:
        data = request.get_json(force=True, silent=True) or {}
        nombre = data.get("nombre")
        direccion = data.get("direccion")
        radio = data.get("radio_metros", 100)

        if not nombre or not direccion:
            return jsonify({"error": "Faltan datos obligatorios: nombre o dirección"}), 400

        geolocator = Nominatim(user_agent="sistema_asistencias")
        try:
            location = geolocator.geocode(direccion, timeout=10)
        except GeocoderTimedOut:
            return jsonify({"error": "Timeout al obtener coordenadas de la dirección"}), 504

        if not location:
            return jsonify({"error": "No se pudo obtener coordenadas de la dirección"}), 400

        lat = location.latitude
        lon = location.longitude

        query = """
            INSERT INTO sucursales (nombre, direccion, lat, lon, radio_metros)
            VALUES (:nombre, :direccion, :lat, :lon, :radio)
        """
        db.session.execute(text(query), {
            "nombre": nombre,
            "direccion": direccion,
            "lat": lat,
            "lon": lon,
            "radio": radio,
        })
        db.session.commit()

        return jsonify({"mensaje": "Sucursal creada correctamente"}), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Error interno del servidor: {str(e)}"}), 500


# Listar sucursales sin dispositivo asignado
@gerente_bp.route("/sucursales/sin-dispositivo", methods=["GET"])
def sucursales_sin_dispositivo():
    result = db.session.execute(text("""
        SELECT id, nombre FROM sucursales WHERE dispositivo_id IS NULL
    """)).fetchall()

    sucursales = [{"id": r.id, "nombre": r.nombre} for r in result]
    return jsonify(sucursales), 200


# Generar token QR para asignar dispositivo
@gerente_bp.route("/sucursales/<int:sucursal_id>/generar-token", methods=["POST"])
def generar_token_qr(sucursal_id):
    token = str(uuid.uuid4())
    base_url = "https://sistema-asistencia-gzo5.vercel.app"  # sin "/" final para evitar doble slash

    db.session.execute(text("""
        INSERT INTO registros_dispositivos (token, sucursal_id, creado_en, usado) 
        VALUES (:token, :sid, :creado, FALSE)
    """), {"token": token, "sid": sucursal_id, "creado": datetime.utcnow()})
    db.session.commit()

    qr_url = f"{base_url}/registrar-dispositivo?token={token}"
    return jsonify({"token": token, "url": qr_url})


# Registrar dispositivo con token desde celular
@gerente_bp.route("/registrar-dispositivo", methods=["POST", "OPTIONS"])
def registrar_dispositivo():
    if request.method == "OPTIONS":
        response = make_response()
        response.headers.add("Access-Control-Allow-Origin", "*")
        response.headers.add("Access-Control-Allow-Headers", "Content-Type")
        response.headers.add("Access-Control-Allow-Methods", "POST, OPTIONS")
        return response, 200

    data = request.json
    token = data.get("token")
    dispositivo_id = data.get("dispositivo_id")
    print(f"Registrar dispositivo - token: {token}, dispositivo_id: {dispositivo_id}")  # DEBUG

    if not token or not dispositivo_id:
        return jsonify({"error": "Faltan datos"}), 400

    result = db.session.execute(text("""
        SELECT * FROM registros_dispositivos 
        WHERE token = :token AND usado = FALSE
    """), {"token": token}).fetchone()

    if not result:
        print("Token inválido o ya usado")  # DEBUG
        return jsonify({"error": "Token inválido o ya usado"}), 403

    db.session.execute(text("""
        UPDATE sucursales SET dispositivo_id = :disp 
        WHERE id = :sid
    """), {"disp": dispositivo_id, "sid": result.sucursal_id})

    db.session.execute(text("""
        UPDATE registros_dispositivos SET usado = TRUE 
        WHERE token = :token
    """), {"token": token})
    db.session.commit()

    print("Dispositivo registrado correctamente")  # DEBUG
    return jsonify({"mensaje": "Dispositivo registrado correctamente"}), 200
