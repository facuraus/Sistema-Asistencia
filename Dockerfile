FROM python:3.12-slim

# Instalamos cmake y herramientas para compilar
RUN apt-get update && apt-get install -y cmake build-essential && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copiamos todo el contenido del proyecto al contenedor
COPY . .

# Creamos el entorno virtual
RUN python -m venv /opt/venv

# Actualizamos pip e instalamos dependencias usando pip del venv
RUN /opt/venv/bin/pip install --upgrade pip && /opt/venv/bin/pip install -r requirements.txt

# Exponemos el puerto (ajustalo si tu app usa otro)
EXPOSE 5000

# Ejecutamos el backend con el python del entorno virtual
CMD ["/opt/venv/bin/python", "-m", "backend.app"]
 