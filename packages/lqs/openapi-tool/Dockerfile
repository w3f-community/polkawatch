FROM node:14-alpine

RUN apk add --no-cache openjdk11-jre \
    && npm install @openapitools/openapi-generator-cli -g -y \
    && mkdir -p /local/out \
    && chmod 777 local/out

COPY openapitools.json /local

WORKDIR /local

RUN openapi-generator-cli version

VOLUME /local/out

ENTRYPOINT ["openapi-generator-cli"]

CMD ["generate", "-i", "/local/api-spec.json", "--generator-name", "typescript-axios", "-o", "/local/out", "--additional-properties=useSingleRequestParameter=true"]