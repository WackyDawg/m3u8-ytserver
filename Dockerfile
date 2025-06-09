# Use official Ubuntu as base image
FROM ubuntu:22.04

# Install dependencies
RUN apt-get update && apt-get install -y \
  curl \
  wget \
  gnupg \
  ca-certificates \
  ffmpeg \
  python3 \
  python3-pip \
  git \
  && rm -rf /var/lib/apt/lists/*

# Upgrade pip and install yt-dlp
RUN python3 -m pip install --upgrade pip yt-dlp

# Install Node.js 20
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
  && apt-get update && apt-get install -y nodejs \
  && node -v && npm -v

# Set working directory
WORKDIR /usr/src/app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the app
COPY . .

# Expose the port your app runs on
EXPOSE 3000

# Run the application
CMD ["npm", "run", "start"]
