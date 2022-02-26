FROM node:16 AS builder
WORKDIR /app
RUN yarn global add typescript rimraf
COPY ./package.json ./
RUN yarn install
COPY . .
COPY tsconfig.docker.json tsconfig.json
RUN yarn codegen && yarn build


FROM onfinality/subql-node:v0.29.1
WORKDIR /app
COPY --from=builder /app ./

