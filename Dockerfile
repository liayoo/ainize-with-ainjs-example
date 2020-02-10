FROM node:10
WORKDIR /workspace
ENV PRIVATE_KEY=
COPY package*.json ./
RUN npm install
COPY . .

EXPOSE 80

CMD [ "node", "index.js" ]
