# Stage 1: build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# Stage 2: serve
FROM nginx:1.27-alpine AS production
RUN rm /etc/nginx/conf.d/default.conf

# Place config as a template: nginx's entrypoint substitutes ${PORT} at
# container startup via envsubst, then writes the result to conf.d/.
COPY nginx.conf /etc/nginx/templates/default.conf.template
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
# Default nginx entrypoint handles template processing; no custom CMD needed.
