# Web Socket application using only Node.js built-in modules

Welcome, this repo is part of my youtube video about Building a complete application implementing the Web Socket protocol using only Node.js built-in modules. 

First of all, leave your star 🌟 on this repo.

Access our [**exclusive telegram channel**](https://bit.ly/ErickWendelContentHub) so I'll let you know about all the content I've been producing 

## Complete source code
- Access them in [nodejs-raw-websocket/](./nodejs-raw-websocket/)

## Features Checklist + Challenges

- Web Socket Server
    - Receiving data
      - [x] Establishes handshake connections according to the Web Socket protocol
      - [x] Receives masked data payloads
      - [x] Decodes 7-bits long data payloads 
      - [x] Decodes 16-bits long data payloads 
      - [ ] Decodes 64-bits long data payloads 
    - Replying
      - [x] Builds data frames according to the Web Socket protocol
      - [x] Sends 7-bits long unmasked data payloads
      - [x] Sends 16-bits long unmasked data payloads
      - [ ] Sends 64-bits long unmasked data payloads

- Web Socket Client
  - [x] Establishes handshake connections according to the Web Socket protocol
  - [x] Sends masked data payloads
  - [x] Receives masked and unmasked data payloads
  - [ ] Tries reconnecting to the server after a disconnection

### Notes
- Should you have some difficulties solving the problems, please comment on the [**Youtube video**]()

- As soon as you've been finishing the tasks, comment on the  [**Youtube video**]() so all other students can be pushed forward by your efforts

## Running

- Server - Use the Node.js v18 and execute the [server.mjs](./nodejs-raw-websocket/server.mjs) file as `node nodejs-raw-websocket/server.mjs`
- Client - You just need to open the [index.html](./nodejs-raw-websocket/index.html) file on a browser. (I use Firefox for the examples) 

## Have fun!
