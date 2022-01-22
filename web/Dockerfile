### STAGE 1: Build ###
FROM node:14-alpine AS build
WORKDIR /web
COPY package.json ./
RUN yarn
COPY . .
RUN yarn build

### STAGE 2: Run ###
FROM nginx:1.15.5-alpine
COPY ./nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /web/build /usr/share/nginx/html
EXPOSE 80