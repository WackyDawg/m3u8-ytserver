# Use official Node.js runtime as base image
FROM node:20-alpine

# Set working directory in container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy app source code
COPY . .

# Expose port 3000
EXPOSE 3000

# Command to run the app
CMD ["npm", "run", "start"]
