FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm i
# If you are building your code for production
# RUN npm ci --omit=dev

# Bundle app source
COPY . .

# ENV NODE_ENV test

RUN npm run build

EXPOSE 1337
CMD [ "npm", "start" ]