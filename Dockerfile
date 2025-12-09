FROM node:22-alpine

WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install

COPY . .

RUN yarn run prisma:generate

CMD ["yarn", "run", "start:dev"]