from flask import Flask
from flask_cors import CORS
from backend.extensions import db
from backend.routers.utils_gps import gps_bp
from backend.routers.login import login_bp
from backend.routers.supervisor import supervisor
from backend.routers.empleado import empleado_bp
from backend.routers.gerente import gerente_bp  # <-- sólo este blueprint para sucursales y gerente

from backend.init_db import crear_base_si_no_existe

app = Flask(__name__)

app.config["SQLALCHEMY_DATABASE_URI"] = "mysql+mysqlconnector://root:Facuraus123-@localhost/sistema_asistencias"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db.init_app(app)
CORS(app)

crear_base_si_no_existe()

app.register_blueprint(gps_bp, url_prefix="/api")
app.register_blueprint(login_bp, url_prefix="/api")
app.register_blueprint(supervisor, url_prefix="/api/supervisor")
app.register_blueprint(empleado_bp, url_prefix="/api/empleado")
app.register_blueprint(gerente_bp, url_prefix="/api")  # todas las rutas relacionadas acá

if __name__ == "__main__":
    app.run(debug=True)
