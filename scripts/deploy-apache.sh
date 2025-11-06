#!/bin/bash

# Script de despliegue automático para Apache2
set -e

echo "🚀 Iniciando despliegue del Sistema Municipal (Apache2)..."

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    error "Ejecute desde el directorio raíz del proyecto"
fi

# Parar servicios
log "Deteniendo servicios..."
sudo systemctl stop municipalidad-backend || true
sudo systemctl stop municipalidad-ml || true

# Backup de la base de datos
log "Realizando backup de la base de datos..."
sudo -u municipalidad /opt/municipalidad/scripts/backup.sh

# Actualizar código
log "Actualizando código..."

# Backend
cd backend
log "Instalando dependencias del backend..."
sudo -u municipalidad npm install --production

# Actualizar variables de entorno si es necesario
if [ -f "../.env.production" ]; then
    log "Actualizando variables de entorno..."
    cp ../.env.production .env
fi

# Frontend  
cd ../frontend
log "Instalando dependencias del frontend..."
npm install
log "Construyendo frontend..."
npm run build
log "Desplegando frontend..."
sudo cp -r dist/* /var/www/municipalidad/html/
sudo chown -R www-data:www-data /var/www/municipalidad/html

# ML Service
cd ../ml-service
log "Actualizando modelo ML..."
sudo -u municipalidad ./venv/bin/pip install -r requirements.txt
sudo -u municipalidad ./venv/bin/python model_training.py

# Aplicar migraciones de base de datos
if [ -f "../scripts/migrate-mongodb.js" ]; then
    log "Aplicando migraciones de base de datos..."
    cd /opt/municipalidad/backend
    sudo -u municipalidad node ../scripts/migrate-mongodb.js
fi

# Reiniciar servicios
log "Reiniciando servicios..."
sudo systemctl start municipalidad-backend
sudo systemctl start municipalidad-ml

# Recargar Apache
log "Recargando Apache..."
sudo systemctl reload apache2

# Verificar servicios
sleep 5
if sudo systemctl is-active --quiet municipalidad-backend; then
    log "✅ Backend reiniciado correctamente"
else
    error "❌ Error reiniciando backend"
fi

if sudo systemctl is-active --quiet municipalidad-ml; then
    log "✅ ML Service reiniciado correctamente"
else
    error "❌ Error reiniciando ML Service"
fi

if sudo systemctl is-active --quiet apache2; then
    log "✅ Apache2 funcionando correctamente"
else
    error "❌ Error con Apache2"
fi

# Limpiar cache
log "Limpiando cachés..."
sudo systemctl restart apache2

log "🎉 Despliegue completado exitosamente!"
echo ""
echo "🌐 La aplicación está disponible en:"
echo "   https://munihuanuco.gob.pe"