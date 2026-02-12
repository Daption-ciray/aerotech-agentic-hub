FROM node:20-slim AS frontend-build
WORKDIR /frontend

# Frontend bağımlılıkları
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm install

# Frontend build
COPY frontend ./
RUN npm run build

FROM python:3.11-slim AS backend

# Çevre değişkenleri
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

# Sistemde temel bağımlılıklar (gerektiğinde genişletilebilir)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
 && rm -rf /var/lib/apt/lists/*

# Python bağımlılıkları
COPY requirements.txt .
RUN pip install --upgrade pip && \
    pip install -r requirements.txt

# Proje dosyaları
COPY . .

# Frontend'in build edilmiş statik dosyalarını backend içine kopyala
COPY --from=frontend-build /frontend/dist /app/frontend_dist

# Railway kendi PORT değişkenini enjekte eder.
# Uvicorn bu PORT'u kullanacak, yoksa 8000'e düşer.
EXPOSE 8000

CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]

