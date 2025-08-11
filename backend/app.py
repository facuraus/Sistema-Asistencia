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
from dotenv import load_dotenv

# Cargar variables desde .env si existe (modo local)
load_dotenv()

app = Flask(__name__)

# Intentar leer desde Railway (variable real de entorno)
db_url = os.getenv("DATABASE_URL")

# Si no existe, usar la del .env local (SQLALCHEMY_DATABASE_URI)
if not db_url:
    db_url = os.getenv("SQLALCHEMY_DATABASE_URI")

# Validar que tenemos URL de DB
if not db_url:
    raise ValueError("❌ No se encontró configuración de base de datos.")

# Ajustar formato para SQLAlchemy si es MySQL
if db_url.startswith("mysql://"):
    db_url = db_url.replace("mysql://", "mysql+pymysql://", 1)

print(f"🔗 Conectando a base de datos: {db_url}")

app.config["SQLALCHEMY_DATABASE_URI"] = db_url
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "clave_por_defecto")

# Inicializar DB y CORS
db.init_app(app)
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

# Setear variable de entorno para init_db.py
os.environ["DATABASE_URL"] = db_url

# Crear base y tablas si no existen
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
