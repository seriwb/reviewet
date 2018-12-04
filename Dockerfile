FROM node:11

RUN mkdir -p /reviewet
COPY package*.json .babelrc email* /reviewet/
COPY src /reviewet/src
COPY config /reviewet/config

WORKDIR /reviewet

RUN npm install -f
RUN npm run build

CMD ["npm", "run", "fstart"]
