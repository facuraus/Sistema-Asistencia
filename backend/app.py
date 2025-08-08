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

# Obtener la URL desde la variable de entorno de Railway y adaptarla
db_url = os.getenv("DATABASE_URL", "mysql://root:pass@localhost/sistema_asistencias")
if db_url.startswith("mysql://"):
    db_url = db_url.replace("mysql://", "mysql+mysqlconnector://", 1)

app.config["SQLALCHEMY_DATABASE_URI"] = db_url
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db.init_app(app)
CORS(app)

crear_base_si_no_existe()

app.register_blueprint(gps_bp, url_prefix="/api")
app.register_blueprint(login_bp, url_prefix="/api")
app.register_blueprint(supervisor, url_prefix="/api/supervisor")
app.register_blueprint(empleado_bp, url_prefix="/api/empleado")
app.register_blueprint(gerente_bp, url_prefix="/api")

if __name__ == "__main__":
    app.run(debug=True)
