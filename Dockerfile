FROM node:18-alpine
WORKDIR /app
COPY moldyr-backend/package*.json ./
RUN npm install --omit=dev
COPY moldyr-backend/ .
ENV NODE_ENV=production
EXPOSE 3001
CMD ["node", "server.js"]
