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
# SSR unit tests (no network), then the Vite build.
RUN npm test && npm run build

FROM nginx:alpine
# Node runs the SSR renderer (frontend/ssr) next to nginx. icu-data-full keeps
# en-IN number formatting (₹1,23,456) identical to the browser.
RUN apk add --no-cache nodejs icu-data-full
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
# The renderer imports the same template modules as the browser bundle;
# package.json is needed for "type": "module".
COPY --from=build /app/package.json /srv/package.json
COPY --from=build /app/ssr /srv/ssr
COPY --from=build /app/src/js /srv/src/js
ARG VITE_WHATSAPP_NUMBER
ENV SSR_DIST=/usr/share/nginx/html \
    SSR_API_BASE=http://api-gateway:8080/api/v1 \
    SSR_HOST=127.0.0.1 \
    SSR_PORT=3000 \
    SSR_WHATSAPP_NUMBER=$VITE_WHATSAPP_NUMBER
RUN chmod +x /srv/ssr/start.sh
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s CMD wget -q -O /dev/null http://127.0.0.1/robots.txt || exit 1
CMD ["/srv/ssr/start.sh"]
