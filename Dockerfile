# Use official Node.js Alpine image
FROM node:20-alpine

# Install FFmpeg, Python3, pip, and yt-dlp (with certs)
RUN apk add --no-cache \
    python3 \
    py3-pip \
    ffmpeg \
    ca-certificates \
  && update-ca-certificates \
  && python3 -m pip install --no-cache-dir --upgrade pip yt-dlp

# Set working directory
WORKDIR /usr/src/app

# Copy package files and install npm dependencies
COPY package*.json ./
RUN npm install

# Copy application source
COPY . .

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "run", "start"]
