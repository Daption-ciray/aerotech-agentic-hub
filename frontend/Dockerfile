FROM node:20-slim

WORKDIR /app

# Railway root'tan build yapıyor, bu yüzden frontend/ prefix'i ile kopyalıyoruz
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm install

# Frontend kaynak kodunu kopyala
COPY frontend/ .

# Build al
RUN npm run build

# Railway PORT değişkenini verir, yoksa 4173 kullan
EXPOSE 4173

CMD ["sh", "-c", "npm run preview -- --host 0.0.0.0 --port ${PORT:-4173}"]

