FROM node:22-bookworm-slim
WORKDIR /app

RUN corepack enable

# Copy manifests first for layer caching
COPY package.json yarn.lock .yarnrc.yml ./
COPY packages/lib/package.json ./packages/lib/
COPY packages/lti/package.json ./packages/lti/
COPY packages/backend/package.json ./packages/backend/
COPY packages/frontend/package.json ./packages/frontend/

RUN yarn install

# Copy the rest of the monorepo
COPY . .

EXPOSE 5000 5173

CMD ["yarn", "dev"]