FROM node:22

RUN apk update && apk add --no-cache git curl

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm install

COPY . .

RUN npm run build

EXPOSE 3000

CMD [ "dist/main.js" ]
