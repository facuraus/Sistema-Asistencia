from flask import Blueprint, request, jsonify
from sqlalchemy import text
from backend.extensions import db
import math

gps_bp = Blueprint("gps_bp", __name__)

def haversine(lat1, lon1, lat2, lon2):
    R = 6371000  # radio de la Tierra en metros
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    distancia = R * c
    return distancia

def dentro_de_sucursal(lat, lon, sucursal_id):
    sql = text("""
        SELECT lat, lon, radio_metros
        FROM sucursales
        WHERE id = :sid
        LIMIT 1
    """)
    row = db.session.execute(sql, {"sid": sucursal_id}).fetchone()
    if not row:
        return False
    lat_s, lon_s, radio = row
    distancia = haversine(lat, lon, lat_s, lon_s)
    return distancia <= radio

@gps_bp.route("/ping", methods=["GET"])
def ping_gps():
    return jsonify({"mensaje": "GPS router activo"})

@gps_bp.route("/verificar-ubicacion", methods=["POST"])
def verificar_ubicacion():
    data = request.get_json()
    lat = data.get("lat")
    lon = data.get("lon")
    sucursal_id = data.get("sucursal_id")

    if lat is None or lon is None or sucursal_id is None:
        return jsonify({"error": "Faltan parámetros: lat, lon, sucursal_id"}), 400

    try:
        dentro = dentro_de_sucursal(float(lat), float(lon), int(sucursal_id))
        return jsonify({"dentro": dentro})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
