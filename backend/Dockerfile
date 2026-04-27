FROM node:20-alpine

WORKDIR /app

COPY backend/package*.json ./
COPY backend/prisma ./prisma/

RUN npm install

COPY backend ./
COPY tracker ../tracker

RUN npx prisma generate
RUN npm run build

EXPOSE 5000

CMD ["npm", "start"]
