FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
ARG VITE_API_URL
ARG VITE_WHATSAPP_NUMBER
ARG VITE_CLOUDINARY_CLOUD_NAME_FRONTEND
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_WHATSAPP_NUMBER=$VITE_WHATSAPP_NUMBER
ENV VITE_CLOUDINARY_CLOUD_NAME_FRONTEND=$VITE_CLOUDINARY_CLOUD_NAME_FRONTEND
RUN npm run build
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
