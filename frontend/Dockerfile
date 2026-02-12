FROM node:20-slim

WORKDIR /app

# Bağımlılıklar
COPY package.json package-lock.json* ./
RUN npm install

# Kaynak kod
COPY . .

# Build al
RUN npm run build

# Railway PORT değişkenini verir, yoksa 4173 kullan
EXPOSE 4173

CMD ["sh", "-c", "npm run preview -- --host 0.0.0.0 --port ${PORT:-4173}"]

