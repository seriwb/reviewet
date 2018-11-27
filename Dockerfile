FROM node:11

RUN npm install
RUN npm run build

CMD ["npm", "run", "fstart"]
