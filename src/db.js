const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');

let db;
async function getDB() {
  if (!db) {
    db = await open({
      filename: './database.sqlite',
      driver: sqlite3.Database
    });
  }
  return db;
}

module.exports = {
  get: async (...args) => (await getDB()).get(...args),
  all: async (...args) => (await getDB()).all(...args),
  run: async (...args) => (await getDB()).run(...args)
};