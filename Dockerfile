# BUM BASE — üretim imajı (Railway, Render, Fly.io veya herhangi bir Docker sunucusu)
# Kalıcı disk platformun kendi "Volume" özelliğiyle /data yoluna bağlanır.
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production PORT=3000 DATA_DIR=/data TZ=Europe/Istanbul
COPY . .
RUN mkdir -p /data
EXPOSE 3000
CMD ["node", "server/server.js"]
