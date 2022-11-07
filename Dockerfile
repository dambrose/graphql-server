FROM node:18-alpine as install
RUN mkdir /app
WORKDIR /app
COPY package.json yarn.lock tsconfig.json /app/
RUN yarn install && yarn cache clean
COPY . .

FROM install as build
RUN yarn build

FROM node:18-alpine
RUN mkdir /app
WORKDIR /app
COPY package.json yarn.lock /app/
RUN yarn install --only=production && yarn cache clean
COPY --from=build /app/dist .
ENV PORT 80
CMD ["node", "index.js"]