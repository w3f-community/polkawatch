FROM node:14 AS builder
WORKDIR /app
COPY ./package.json ./
RUN yarn install
COPY . .
COPY tsconfig.docker.json tsconfig.json
RUN yarn global add typescript rimraf && yarn codegen && yarn build


FROM onfinality/subql-node:latest
WORKDIR /app
COPY --from=builder /app ./

