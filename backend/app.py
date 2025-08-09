import os
from flask import Flask
from flask_cors import CORS
from backend.extensions import db
from backend.routers.utils_gps import gps_bp
from backend.routers.login import login_bp
from backend.routers.supervisor import supervisor
from backend.routers.empleado import empleado_bp
from backend.routers.gerente import gerente_bp
from backend.init_db import crear_base_si_no_existe

app = Flask(__name__)

# Leer la URL de conexión desde variable de entorno (Railway)
db_url = os.getenv("DATABASE_URL")

if not db_url:
    raise ValueError("❌ No se encontró la variable DATABASE_URL en el entorno.")

# Asegurar formato compatible con SQLAlchemy
if db_url.startswith("mysql://"):
    db_url = db_url.replace("mysql://", "mysql+pymysql://", 1)

app.config["SQLALCHEMY_DATABASE_URI"] = db_url
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

# Inicializar base de datos y CORS
db.init_app(app)
CORS(app)

# Crear base si no existe (dentro de contexto de app)
with app.app_context():
    crear_base_si_no_existe()

# Registrar rutas
app.register_blueprint(gps_bp, url_prefix="/api")
app.register_blueprint(login_bp, url_prefix="/api")
app.register_blueprint(supervisor, url_prefix="/api/supervisor")
app.register_blueprint(empleado_bp, url_prefix="/api/empleado")
app.register_blueprint(gerente_bp, url_prefix="/api")

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)), debug=True)
