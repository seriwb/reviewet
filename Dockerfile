FROM node:14-slim

RUN apt-get update \
  && apt-get install -y git build-essential \
  && apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /reviewet

COPY . .

# RUN yarn && yarn run build

CMD ["yarn", "start"]
