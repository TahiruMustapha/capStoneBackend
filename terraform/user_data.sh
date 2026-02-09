#!/bin/bash

#Ensure the script exits on any error and treats unset variables as errors
set -euo pipefail

# Update and Install Docker
sudo apt-get update -y
sudo apt-get install -y ca-certificates curl gnupg lsb-release

sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update -y
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Setup App Directory
mkdir -p /home/ubuntu/app
cd /home/ubuntu/app

#Init SQL with Seed Data
cat <<EOF > init.sql
CREATE TABLE IF NOT EXISTS clients_tb (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    job VARCHAR(255) NOT NULL,
    rate DECIMAL(10,2) NOT NULL,
    isactive BOOLEAN NOT NULL
);

INSERT INTO clients_tb (name, email, job, rate, isactive) VALUES
('John Doe', 'john@example.com', 'Software Engineer', 100.00, true),
('Jane Smith', 'jane@example.com', 'Fullstack Developer', 110.00, true),
('Alice Johnson', 'alice@example.com', 'Project Manager', 90.00, false),
('Bob Brown', 'bob@example.com', 'DevOps Specialist', 120.00, true),
('Charlie Davis', 'charlie@example.com', 'Data Scientist', 130.00, true);
EOF

# Create Docker Compose File
cat <<EOF > docker-compose.yml
version: '3.9'
services:
  postgres:
    image: postgres:16-alpine
    container_name: capstone-postgres-db
    restart: unless-stopped
    environment:
      POSTGRES_USER: \${postgres_user}
      POSTGRES_PASSWORD: \${postgres_password}
      POSTGRES_DB: \${postgres_db}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql

  backend:
    image: \${backend_image}
    container_name: capstone-backend
    restart: unless-stopped
    depends_on:
      - postgres
    environment:
      PORT: 3000
      PG_USER: \${postgres_user}
      PG_PASSWORD: \${postgres_password}
      PG_DATABASE: \${postgres_db}
      PG_HOST: postgres
      PG_PORT: 5432
    ports:
      - "3000:3000" 

  frontend:
    image: \${frontend_image}
    container_name: capstone-frontend
    restart: unless-stopped
    depends_on:
      - backend
    ports:
      - "8080:80" 

  # Nginx Proxy to route requests to Frontend and Backend
  proxy:
    image: nginx:alpine
    container_name: nginx-proxy
    restart: always
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf
    depends_on:
      - backend
      - frontend

volumes:
  postgres_data:
EOF

# Create Nginx Config for the Proxy Container
cat <<EOF > nginx.conf
server {
    listen 80;

    location / {
        # Proxy to Frontend Container
        proxy_pass http://frontend:80;
    }

    location /api {
        # Proxy to Backend Container
        proxy_pass http://backend:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }

     location /health {
        proxy_pass http://backend:3000/health;
        proxy_set_header Host \$host;
    }
}
EOF

# Start Services
sudo docker compose up -d
