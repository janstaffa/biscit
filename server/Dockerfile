FROM node:14.18-alpine

WORKDIR /server
COPY package.json ./
RUN npm install -g typescript
RUN yarn install

COPY . .
RUN yarn build
# RUN yarn start