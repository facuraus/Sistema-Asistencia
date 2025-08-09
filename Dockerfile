FROM python:3.12-slim

# Actualizar apt y agregar dependencias necesarias para compilación y librerías
RUN apt-get update && apt-get install -y \
    cmake \
    build-essential \
    libboost-all-dev \
    libgtk-3-dev \
    libsm6 \
    libxrender1 \
    git \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copiar requirements.txt para instalar dependencias
COPY requirements.txt ./requirements.txt

# Crear entorno virtual
RUN python -m venv /opt/venv

ENV PATH="/opt/venv/bin:$PATH"

# Actualizar pip, setuptools y wheel
RUN pip install --upgrade pip setuptools wheel

# Instalar face_recognition_models desde GitHub antes que requirements.txt
RUN pip install --no-cache-dir git+https://github.com/ageitgey/face_recognition_models

# Instalar resto de dependencias
RUN pip install --no-cache-dir -r requirements.txt

# Probar que face_recognition_models se importe sin errores
RUN python -c "import face_recognition_models; print('face_recognition_models OK')"

# Copiar todo el código de la app
COPY . .

# Exponer puerto para Flask
EXPOSE 5000

# Comando para iniciar la app
CMD ["python", "-m", "backend.app"]
