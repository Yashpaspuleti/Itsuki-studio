FROM node:22-alpine AS build
WORKDIR /workspace
COPY package.json ./
COPY apps/web/package.json ./apps/web/package.json
COPY apps/api/package.json ./apps/api/package.json
RUN npm install
COPY apps/web ./apps/web
ARG VITE_API_URL=/api
ENV VITE_API_URL=${VITE_API_URL}
RUN npm --workspace apps/web run build

FROM nginx:1.27-alpine AS runtime
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /workspace/apps/web/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s CMD wget -q -O /dev/null http://127.0.0.1/ || exit 1
