import mysql.connector
from pathlib import Path

def crear_base_si_no_existe():
    conn = None
    cursor = None
    try:
        conn = mysql.connector.connect(
            host='localhost',
            user='root',
            password='Facuraus123-'
        )
        cursor = conn.cursor()

        print("🛠️ Verificando base de datos...")
        cursor.execute("CREATE DATABASE IF NOT EXISTS sistema_asistencias CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
        cursor.execute("USE sistema_asistencias")

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
