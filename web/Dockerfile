FROM node:16-alpine

WORKDIR /usr/server/app

COPY ./package.json ./
COPY ./yarn.lock ./

RUN yarn install --prod --frozen-lockfile

COPY dist/src ./src
COPY dist/static ./
COPY dist/templates ./
COPY dist/config ./

ENV PORT=3000
ENV NODE_ENV=production
ENV HOST=0.0.0.0

EXPOSE ${PORT}

ENTRYPOINT ["node" ,"src/index.js"]