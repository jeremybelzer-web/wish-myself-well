/* Node loader: the same files, in the same order, that index.html loads. Keep FILES and data/README.md in step. */
const DB = require("./curiosity-db.js");
const FILES = require("./files.json");
FILES.slice(1).forEach((f) => require("./" + f));
module.exports = DB;
