FROM node:20-alpine

WORKDIR /app

ARG VITE_API_URL=http://localhost:3000
ENV VITE_API_URL=$VITE_API_URL

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

EXPOSE 80

CMD ["npx", "vite", "preview", "--host", "--port", "80"]
