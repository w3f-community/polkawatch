FROM node:14 AS builder
WORKDIR /app
COPY ./package.json ./
COPY ./yarn.lock ./
RUN yarn install
COPY . .
RUN yarn global add @nestjs/cli rimraf && yarn build


FROM node:14-alpine
WORKDIR /app
COPY --from=builder /app ./
CMD ["yarn", "start:prod"]

