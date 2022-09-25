FROM node:16
RUN set -eux; \
  apt-get update; \
  apt-get install -y --no-install-recommends build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev; \
  rm -rf /var/lib/apt/lists/*
ENV NODE_ENV production
WORKDIR /home/node
COPY package.json package-lock.json /home/node/
RUN npm ci
COPY dist /home/node/dist
EXPOSE 3000
USER node
CMD [ "npm", "start" ]
