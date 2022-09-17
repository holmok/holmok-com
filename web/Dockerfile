FROM node:16-alpine

WORKDIR /usr/server/app

COPY ./package.json ./
COPY ./yarn.lock ./

RUN yarn install --prod --frozen-lockfile

COPY dist ./dist/

ENV NODE_ENV=production
ENTRYPOINT ["yarn" ,"start"]