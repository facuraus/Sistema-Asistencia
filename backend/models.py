from extensions import db
from datetime import datetime

class Empleado(db.Model):
    __tablename__ = 'usuarios'  # coincide con la tabla MySQL
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100), nullable=False)
    apellido = db.Column(db.String(100), nullable=False)
    correo = db.Column(db.String(100), unique=True, nullable=False)
    password_hash = db.Column(db.String(64), nullable=False)  # coincide con la DB
    rol_id = db.Column(db.Integer, nullable=False)            # si querés incluir
    activo = db.Column(db.Boolean, default=True)
    foto_path = db.Column(db.String(255), nullable=True)      # puede ser NULL
    fecha_ingreso = db.Column(db.DateTime, default=datetime.utcnow)

    # Podés agregar métodos para hashear y verificar la contraseña si querés
