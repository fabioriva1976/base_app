FROM node:20

# Install Java (required by Firebase Emulator) and Firebase CLI
RUN set -eux; \
    apt-get update; \
    apt-get install -y --no-install-recommends wget apt-transport-https gnupg ca-certificates; \
    wget -O - https://packages.adoptium.net/artifactory/api/gpg/key/public | apt-key add -; \
    echo "deb https://packages.adoptium.net/artifactory/deb bookworm main" > /etc/apt/sources.list.d/adoptium.list; \
    apt-get update; \
    apt-get install -y --no-install-recommends temurin-21-jre; \
    npm install -g firebase-tools; \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# --- Install Root Dependencies ---
# Copy only the dependency manifest to leverage Docker's layer caching.
COPY package.json package-lock.json* ./
# Install dependencies.
RUN npm install --production

# --- Install Functions Dependencies ---
# Copy only the functions' package.json to its directory.
COPY functions/package.json ./functions/
# Run npm install inside the functions directory. This will generate a fresh
# package-lock.json and install dependencies correctly within the image.
RUN cd functions && npm install

# --- Copy Application Code ---
COPY . .

# Expose port for Astro dev server
EXPOSE 3000

# Default command is overridden by docker-compose, but this is a good fallback.
CMD ["npm", "run", "dev"]
