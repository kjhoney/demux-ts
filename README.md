## .env setting

- ENDPOINT="nodeos address"
- MONGODB_URL="mongodb address"
- IRREVERSIBLE="true => only get irreversible block data"
- START_AT="start block num"
- STOP_AT="stop at block num, if 0 disable"
- CONTRACT="contract account name"
- MONGODB_USER="mongodb user name"
- MONGODB_PASS="mongodb password"

## Installation

```sh
$ git clone https://github.com/emperorhan/demux-ts
$ cd demux-ts
$ npm install
```

## build

Write dotenv file

```sh
$ npm run start
```

