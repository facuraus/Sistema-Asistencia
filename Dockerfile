FROM python:3.12-slim

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

# Copiamos primero el requirements.txt desde backend para aprovechar cache
COPY backend/requirements.txt ./backend/requirements.txt

RUN python -m venv /opt/venv

# Instalamos dependencias con pip, apuntando al requirements dentro de backend
RUN /opt/venv/bin/pip install --upgrade pip && /opt/venv/bin/pip install --no-cache-dir -r ./backend/requirements.txt

# Copiamos todo el proyecto después
COPY . .

EXPOSE 5000

CMD ["/opt/venv/bin/python", "-m", "backend.app"]
