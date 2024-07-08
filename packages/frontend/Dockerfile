# build environment
FROM node:19-bullseye AS build
WORKDIR /app
ENV PATH /app/node_modules/.bin:$PATH
COPY ./package.json ./
# COPY ./yarn.lock ./
RUN yarn install
# Install TypeScript globally for debugging purposes
RUN yarn global add typescript
# # Check installed TypeScript version
# RUN tsc --version
COPY ./packages/frontend ./
COPY ./packages/lib /lib
ARG NODE_ENV=production
# RUN npm i typescript -g
RUN yarn build

# production environment
FROM nginx:stable-alpine
# Overrite the config file. Fixes for react router by directing all requests to index.html
COPY ./packages/frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
RUN mkdir -p /usr/share/nginx/html/config
COPY --from=build /app/public /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]