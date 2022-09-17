FROM node:16-alpine

WORKDIR /usr/server/app

COPY ./package.json ./
COPY ./yarn.lock ./

RUN yarn install --prod --frozen-lockfile

COPY build ./build/
COPY public ./public/
COPY server.js ./

ENV NODE_ENV=production
ENTRYPOINT ["yarn" ,"start"]