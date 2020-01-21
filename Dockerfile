# Use an official Node.js runtime as a parent image
FROM node:10.15.3-alpine

# Set the working directory to /app
WORKDIR /usr/app

# Copy the important files and directory contents into the container at /usr/app
COPY ./package.json ./package-lock.json ./

# Install any needed packages specified in requirements.txt
RUN npm install --quiet

# Copy source code into container at the Working Dir
COPY . .

# Run this project specific script that uses TypeScript to transpile the source .ts code and other assets which is stored in a /dist folder
RUN npm run compile-copy-assets

RUN apk add --update mpg123

# Make port 80 available to the world outside this container
EXPOSE 1337 9229

# Run node app when the container launches
CMD ["node", "./dist/server/index.js"]
