# routers/login.py
from flask import Blueprint, request, jsonify
from sqlalchemy import text
from backend.extensions import db
import hashlib

login_bp = Blueprint("login_bp", __name__)

@login_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}
    correo = data.get("correo")
    clave = data.get("clave")

    if not correo or not clave:
        return jsonify({"error": "Correo y clave son requeridos"}), 400

    try:
        sql_user = text("""
            SELECT id, correo, password_hash, rol_id
            FROM usuarios
            WHERE correo = :correo AND activo = TRUE
            LIMIT 1
        """)
        user = db.session.execute(sql_user, {"correo": correo}).fetchone()

        if not user:
            return jsonify({"error": "Usuario o contraseña incorrectos"}), 401

        id_, correo_, password_hash, rol_id = user

        clave_hash = hashlib.sha256(clave.encode()).hexdigest()
        if clave_hash != password_hash:
            return jsonify({"error": "Usuario o contraseña incorrectos"}), 401

        sql_rol = text("SELECT nombre FROM roles WHERE id = :rol_id")
        rol_row = db.session.execute(sql_rol, {"rol_id": rol_id}).fetchone()
        rol_nombre = rol_row[0] if rol_row else "desconocido"

        return jsonify({
            "id": id_,
            "correo": correo_,
            "rol": rol_nombre
        }), 200

    except Exception as e:
        print("❌ Error login:", e)
        return jsonify({"error": "Error en el servidor"}), 500
