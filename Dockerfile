# Use official Node.js Alpine image
FROM node:20-alpine

# Install system dependencies: bash, python3, py3-pip, ffmpeg
RUN apk add --no-cache \
  bash \
  python3 \
  py3-pip \
  ffmpeg \
  && pip install --upgrade pip \
  && pip install yt-dlp

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
