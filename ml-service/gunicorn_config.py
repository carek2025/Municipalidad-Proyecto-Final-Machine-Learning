import multiprocessing
import os

# Configuración de Gunicorn para Python 3.12
bind = "0.0.0.0:5001"
workers = multiprocessing.cpu_count() * 2 + 1
worker_class = "sync"
worker_connections = 1000
timeout = 30
max_requests = 1000
max_requests_jitter = 100

# Logging
accesslog = "/var/log/municipalidad/gunicorn_access.log"
errorlog = "/var/log/municipalidad/gunicorn_error.log"
loglevel = "info"

# Process naming
proc_name = "ml_service_municipalidad"

# Security
limit_request_line = 4096
limit_request_fields = 100
limit_request_field_size = 8190

# Python 3.12 specific optimizations
preload_app = True
keepalive = 2
