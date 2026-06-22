# Stage 1: Build the frontend application
FROM node:18-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Stage 2: Serve the built static files using Nginx
FROM nginx:alpine

# Copy your custom Nginx configuration over the default one
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the build output to Nginx's default serving directory
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]