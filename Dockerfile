FROM node:22

# Install Java (required by Firebase Emulator) and Firebase CLI
RUN set -eux; \
    apt-get update; \
    apt-get install -y --no-install-recommends \
    wget apt-transport-https gnupg ca-certificates \
    xvfb xauth \
    libgtk-3-0 libgbm1 libnss3 libxss1 libasound2 libxtst6 \
    libatk-bridge2.0-0 libatk1.0-0 libcups2 libdrm2 \
    libx11-xcb1 libxcomposite1 libxdamage1 libxrandr2 \
    libxshmfence1 libxcb1 libxfixes3 libxkbcommon0 \
    libpango-1.0-0 libpangocairo-1.0-0; \
    wget -O - https://packages.adoptium.net/artifactory/api/gpg/key/public | apt-key add -; \
    echo "deb https://packages.adoptium.net/artifactory/deb bookworm main" > /etc/apt/sources.list.d/adoptium.list; \
    apt-get update; \
    apt-get install -y --no-install-recommends temurin-21-jre; \
    npm install -g firebase-tools; \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# --- Install All Workspace Dependencies ---
# Copia tutti i file package.json e il lockfile per sfruttare la cache di Docker.
# Questo permette a npm di riconoscere l'intera struttura del workspace.
COPY package.json package-lock.json* ./
COPY functions/package.json ./functions/
COPY shared/package.json ./shared/
# Esegui un singolo 'npm ci' dalla root. Questo installerà tutte le dipendenze
# per tutti i workspace (incluse le devDependencies necessarie per i test).
RUN npm ci

# --- Copy Application Code ---
COPY . .

# Expose port for Astro dev server
EXPOSE 3000

# Default command is overridden by docker-compose, but this is a good fallback.
CMD ["npm", "run", "dev"]
