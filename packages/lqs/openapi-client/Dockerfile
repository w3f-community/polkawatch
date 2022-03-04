FROM timbru31/java-node:jdk-14

ARG USER_ID
ARG GROUP_ID
RUN addgroup --gid $GROUP_ID user
RUN adduser --disabled-password --gecos '' --uid $USER_ID --gid $GROUP_ID user
#USER user
RUN npm install @openapitools/openapi-generator-cli -g -y
RUN mkdir /local
WORKDIR /local
COPY . .
CMD ["sh", "generate.sh"]