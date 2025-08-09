import os
import mysql.connector
from pathlib import Path
from urllib.parse import urlparse

def crear_base_si_no_existe():
    conn = None
    cursor = None
    try:
        # Leer la URL desde variable de entorno
        db_url = os.getenv("DATABASE_URL")
        if not db_url:
            raise ValueError("❌ No se encontró DATABASE_URL en las variables de entorno.")

        # Parsear URL mysql://user:pass@host:port/db
        url = urlparse(db_url)
        user = url.username
        password = url.password
        host = url.hostname
        port = url.port or 3306
        database = url.path.lstrip("/")

        # Conectar sin especificar base para poder crearla
        conn = mysql.connector.connect(
            host=host,
            user=user,
            password=password,
            port=port
        )
        cursor = conn.cursor()

        print("🛠️ Verificando base de datos...")
        cursor.execute(f"CREATE DATABASE IF NOT EXISTS {database} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
        cursor.execute(f"USE {database}")

        print("📦 Cargando estructura y datos...")
        sql_path = Path("backend/database/init_sistema_asistencias.sql")
        sql = sql_path.read_text(encoding="utf-8")

        statements = [stmt.strip() for stmt in sql.split(";") if stmt.strip()]
        for stmt in statements:
            cursor.execute(stmt)

        conn.commit()
        print("✅ Base de datos y tablas listas.")
    except mysql.connector.Error as err:
        print("❌ Error:", err)
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
