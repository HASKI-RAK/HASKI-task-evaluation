FROM node:20-bullseye AS build
WORKDIR /app
COPY . .
# install yarn corepack
RUN corepack enable
RUN yarn install --frozen-lockfile
# run yarn setup script
RUN yarn setup
CMD ["yarn", "dev"]