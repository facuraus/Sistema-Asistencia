# Usamos una imagen base ligera con Python 3.12
FROM python:3.12-slim

# Actualizamos el sistema e instalamos dependencias necesarias para compilación
# y librerías que usan OpenCV, dlib, face_recognition, etc.
RUN apt-get update && apt-get install -y \
    cmake \
    build-essential \
    libboost-all-dev \
    libgtk-3-dev \
    libsm6 \
    libxrender1 \
    git \
    && rm -rf /var/lib/apt/lists/*

# Definimos el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copiamos el archivo con las dependencias
COPY requirements.txt ./requirements.txt

# Creamos un entorno virtual para aislar las dependencias
RUN python -m venv /opt/venv

# Ajustamos la variable PATH para usar el entorno virtual por defecto
ENV PATH="/opt/venv/bin:$PATH"

# Actualizamos pip, setuptools y wheel a versiones recientes
RUN pip install --upgrade pip setuptools wheel

# Instalamos todas las dependencias listadas en requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Verificamos que la librería face_recognition_models se haya instalado correctamente
RUN python -c "import face_recognition_models; print('face_recognition_models OK')"

# Copiamos el resto del código fuente de la aplicación al contenedor
COPY . .

# Exponemos el puerto 5000 para que Flask pueda recibir conexiones externas
EXPOSE 5000

# Comando que se ejecuta al iniciar el contenedor para levantar la app Flask
CMD ["python", "-m", "backend.app"]
