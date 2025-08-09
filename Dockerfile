FROM python:3.12-slim

# Instala dependencias del SO necesarias y git para la instalación desde git
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

# Copia el requirements.txt unificado
COPY requirements.txt ./requirements.txt

# Crea y activa virtualenv y usa PATH para no escribir rutas largas
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Actualiza pip e instala las dependencias
RUN pip install --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt

# Copia todo el proyecto después para aprovechar caché en instalación de libs
COPY . .

EXPOSE 5000

# Corre la app con python del virtualenv
CMD ["python", "-m", "backend.app"]
