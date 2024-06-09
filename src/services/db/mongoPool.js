import { MongoClient } from "mongodb";
import "dotenv/config";
import { config } from "dotenv";

config({
  path: [`.env.${process.env.NODE_ENV}`],
});


const uris = Object.entries(process.env)
.filter(([key, config]) => key.includes("MONGODB_URI"))

const options = {};

let client;
let clientPool = {}

if (!uris) {
  throw new Error("Please add your Mongo URI to .env.<environment>");
}

if (process.env.NODE_ENV === "development") {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  if (!global._mongoClientPool) {
    global._mongoClientPool = {}
    uris.map(([key, uri]) => { 
      client = new MongoClient(uri, options);
      global._mongoClientPool[key.split('_')[0].toLowerCase()] = client.connect();
    });
  }
  clientPool = global._mongoClientPool;
} else {
  // In production mode, it's best to not use a global variable.
  uris.map(([key, uri]) => {
    client = new MongoClient(uri, options);
    clientPool[key.split('_')[0].toLowerCase()] = client.connect();
  });
}


export default clientPool;