# NOTE: docker build . -t ta-frontend -f ./packages/frontend/Dockerfile
# build context should be the workspaces root directory

# build environment
FROM node:20-bullseye AS build
WORKDIR /app
ENV PATH /app/node_modules/.bin:$PATH
# Install TypeScript globally for debugging purposes
RUN yarn global add typescript
# # Check installed TypeScript version
ARG NODE_ENV=production
# RUN npm i typescript -g
# Copy the whole monorepo to allow Yarn workspaces to function
COPY . .

# Install dependencies with Yarn, including workspace dependencies
RUN yarn install --frozen-lockfile

# Run the build command for the frontend
WORKDIR /app/packages/frontend
RUN yarn build

# production environment
FROM nginx:stable-alpine
WORKDIR /app
# Overrite the config file. Fixes for react router by directing all requests to index.html
COPY --from=build /app/packages/frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/packages/frontend/dist /usr/share/nginx/html
RUN mkdir -p /usr/share/nginx/html/config
COPY --from=build /app/packages/frontend/public /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]