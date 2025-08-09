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

COPY requirements.txt ./requirements.txt

RUN python -m venv /opt/venv

ENV PATH="/opt/venv/bin:$PATH"

RUN pip install --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt

# Prueba que la librería se pueda importar (falla el build si no)
RUN python -c "import face_recognition_models; print('face_recognition_models OK')"

COPY . .

EXPOSE 5000

CMD ["python", "-m", "backend.app"]
