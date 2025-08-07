# routers/__init__.py
from flask import Blueprint
from backend.routers.login import login_bp

api_bp = Blueprint("api_bp", __name__)

api_bp.register_blueprint(login_bp, url_prefix="/")
