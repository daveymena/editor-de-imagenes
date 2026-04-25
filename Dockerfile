# Usar Nginx Alpine para un despliegue ultra ligero y rápido
FROM nginx:alpine

# Copiar todos los archivos del proyecto al directorio de Nginx
COPY . /usr/share/nginx/html

# Exponer el puerto 80 (estándar web)
EXPOSE 80

# Comando para iniciar Nginx
CMD ["nginx", "-g", "daemon off;"]
