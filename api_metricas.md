# Guía de Configuración de Servidor y Métricas de Infraestructura

Este documento detalla el proceso completo para configurar un Droplet de DigitalOcean (Ubuntu) desde cero, desplegar la aplicación de React y configurar un sistema de monitoreo de infraestructura integrado en el panel de la aplicación.

## Fase 1: Seguridad y Configuración Inicial del Servidor

El objetivo es asegurar el servidor y preparar el entorno.

1.  **Actualizar el Sistema:**
    Asegura que todos los paquetes del sistema operativo estén actualizados.
    ```bash
    apt update && apt upgrade -y
    ```

2.  **Configurar el Firewall (UFW):**
    Habilita el firewall para permitir únicamente el tráfico necesario.
    ```bash
    # Permitir conexiones SSH (esencial)
    ufw allow OpenSSH

    # Permitir tráfico web
    ufw allow 80/tcp
    ufw allow 443/tcp

    # Activar el firewall
    ufw enable

    # Verificar el estado
    ufw status
    ```

## Fase 2: Instalación de Dependencias

Instalamos el software necesario para servir la aplicación.

1.  **Instalar Nginx:**
    ```bash
    apt install nginx -y
    ```

2.  **Instalar Node.js y npm (v20.x LTS):**
    ```bash
    # Añadir el repositorio de NodeSource
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

    # Instalar Node.js y npm
    apt-get install -y nodejs
    ```

3.  **Instalar Git:**
    ```bash
    apt install git -y
    ```

## Fase 3: Despliegue de la Aplicación React

Ponemos el código en el servidor y lo preparamos para producción.

1.  **Generar y Configurar Clave de Despliegue (Deploy Key):**
    *   Genera una clave SSH en el servidor (presiona Enter en todas las preguntas para no usar contraseña):
        ```bash
        ssh-keygen -t rsa -b 4096 -C "deploy_key_glamtica_droplet"
        ```
    *   Muestra la clave pública y cópiala al portapapeles:
        ```bash
        cat ~/.ssh/id_rsa.pub
        ```
    *   En GitHub, ve a `Settings > Deploy Keys > Add deploy key`, pega la clave y **no** marques la opción de "Allow write access".

2.  **Clonar el Repositorio:**
    ```bash
    cd /var/www/
    git clone git@github.com:SoFactorySAS/glamtica-app.git glamtica.app
    ```

3.  **Crear Archivo de Variables de Entorno:**
    *   Navega al directorio del proyecto:
        ```bash
        cd /var/www/glamtica.app
        ```
    *   Crea el archivo de entorno para producción:
        ```bash
        nano .env.production
        ```
    *   Pega tus variables de entorno (reemplaza los valores):
        ```env
        VITE_SUPABASE_URL="TU_SUPABASE_URL"
        VITE_SUPABASE_ANON_KEY="TU_SUPABASE_ANON_KEY"
        ```

4.  **Instalar Dependencias y Construir el Proyecto:**
    *   Este proceso puede requerir memoria adicional. Primero, crea un archivo de intercambio (swap) si el servidor tiene poca RAM:
        ```bash
        fallocate -l 2G /swapfile
        chmod 600 /swapfile
        mkswap /swapfile
        swapon /swapfile
        echo '/swapfile none swap sw 0 0' | tee -a /etc/fstab
        ```
    *   Luego, ejecuta la instalación y construcción con un límite de memoria aumentado:
        ```bash
        npm cache clean --force
        NODE_OPTIONS="--max-old-space-size=4096" npm install
        NODE_OPTIONS="--max-old-space-size=4096" npm run build
        ```

## Fase 4: Configuración de Nginx

Configuramos Nginx para que sirva la aplicación al público.

1.  **Crear el Archivo de Configuración del Sitio:**
    ```bash
    nano /etc/nginx/sites-available/glamtica.app
    ```

2.  **Pegar la Configuración:**
    Este bloque sirve los archivos de la aplicación y redirige todas las rutas a `index.html`, lo cual es necesario para una Single Page Application (SPA) como React.
    ```nginx
    server {
        listen 80;
        server_name _; # Reemplaza '_' con tu dominio cuando lo tengas

        root /var/www/glamtica.app/dist;
        index index.html;

        location / {
            try_files $uri /index.html;
        }
    }
    ```

3.  **Activar el Sitio y Desactivar el de por Defecto:**
    ```bash
    ln -s /etc/nginx/sites-available/glamtica.app /etc/nginx/sites-enabled/
    rm /etc/nginx/sites-enabled/default
    ```

4.  **Probar y Reiniciar Nginx:**
    ```bash
    nginx -t
    systemctl restart nginx
    ```
    En este punto, tu aplicación ya es visible en `http://<TU_IP_DEL_DROPLET>`.

## Fase 5: Configuración del Monitoreo de Infraestructura

Instalamos las herramientas para recolectar y servir las métricas del servidor.

1.  **Instalar `node_exporter`:**
    *   Descarga y prepara el binario:
        ```bash
        cd ~
        wget https://github.com/prometheus/node_exporter/releases/download/v1.8.1/node_exporter-1.8.1.linux-amd64.tar.gz
        tar xvfz node_exporter-1.8.1.linux-amd64.tar.gz
        mv ~/node_exporter-1.8.1.linux-amd64/node_exporter /usr/local/bin/
        rm node_exporter-1.8.1.linux-amd64.tar.gz
        ```
    *   Crea el servicio de `systemd`:
        ```bash
        nano /etc/systemd/system/node_exporter.service
        ```
    *   Pega el siguiente contenido:
        ```ini
        [Unit]
        Description=Node Exporter
        Wants=network-online.target
        After=network-online.target

        [Service]
        User=root
        ExecStart=/usr/local/bin/node_exporter

        [Install]
        WantedBy=default.target
        ```
    *   Inicia y habilita el servicio:
        ```bash
        systemctl daemon-reload
        systemctl start node_exporter
        systemctl enable node_exporter
        ```

2.  **Crear la API Intermediaria en Python:**
    *   Instala las dependencias del sistema y crea el entorno virtual:
        ```bash
        apt install python3-venv -y
        mkdir -p /opt/metrics_api
        cd /opt/metrics_api
        python3 -m venv venv
        ```
    *   Activa el entorno e instala los paquetes de Python:
        ```bash
        source venv/bin/activate
        pip install flask prometheus-client requests
        deactivate
        ```
    *   Crea el script de la API:
        ```bash
        nano /opt/metrics_api/app.py
        ```
    *   Pega el código Python del archivo `metrics_api_script.txt` que generamos.
    *   Crea el servicio de `systemd` para la API:
        ```bash
        nano /etc/systemd/system/metrics_api.service
        ```
    *   Pega la configuración del servicio, asegurándote de que `ExecStart` apunte al Python del entorno virtual:
        ```ini
        [Unit]
        Description=Metrics API Service
        After=network.target

        [Service]
        User=root
        WorkingDirectory=/opt/metrics_api
        ExecStart=/opt/metrics_api/venv/bin/python3 app.py
        Restart=always

        [Install]
        WantedBy=multi-user.target
        ```
    *   Inicia y habilita el servicio:
        ```bash
        systemctl daemon-reload
        systemctl start metrics_api
        systemctl enable metrics_api
        ```

3.  **Configurar Nginx como Proxy Inverso para la API:**
    *   Edita de nuevo la configuración de tu sitio:
        ```bash
        nano /etc/nginx/sites-available/glamtica.app
        ```
    *   Añade el bloque `location` para la API, justo antes del bloque `location /`:
        ```nginx
        location /api/server-metrics {
            proxy_pass http://127.0.0.1:5000;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
        ```
    *   Prueba y reinicia Nginx:
        ```bash
        nginx -t
        systemctl restart nginx
        ```
    Ahora, las métricas del servidor son accesibles públicamente en `http://<TU_IP_DEL_DROPLET>/api/server-metrics`.
