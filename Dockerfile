FROM node:11

RUN mkdir -p /reviewet
COPY . /reviewet/

WORKDIR /reviewet

RUN npm install
RUN npm run build

CMD ["npm", "run", "fstart"]
