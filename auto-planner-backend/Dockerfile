FROM node:20-alpine

WORKDIR /app

RUN mkdir -p /app/data

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

EXPOSE 3000

VOLUME ["/app/data"]

CMD ["node", "dist/index.js"]
