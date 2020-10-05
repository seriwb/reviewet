FROM node:14-slim

RUN apt-get update \
  && apt-get install -y git build-essential \
     # for puppeteer
     libgtk-3.0 libgbm-dev libnss3 libatk-bridge2.0-0 libasound2 \
  && apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /reviewet

COPY . .

RUN yarn && yarn run build

CMD ["yarn", "start"]
