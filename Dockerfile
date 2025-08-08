# Usamos una imagen base oficial de Python 3.12 slim (liviana)
FROM python:3.12-slim

# Actualizamos y instalamos cmake + herramientas para compilar
RUN apt-get update && apt-get install -y cmake build-essential

# Definimos el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copiamos todo el contenido de tu proyecto al contenedor
COPY . .

# Creamos un entorno virtual
RUN python -m venv /opt/venv

# Actualizamos pip e instalamos las dependencias dentro del venv
RUN . /opt/venv/bin/activate && pip install --upgrade pip && pip install -r requirements.txt

# Puerto donde corre la app (ajustalo si usás otro)
EXPOSE 5000

# Comando para arrancar tu app con el entorno virtual activo
CMD ["/opt/venv/bin/python", "app.py"]
