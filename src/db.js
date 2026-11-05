const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017";
const dbName = process.env.DB_NAME || "kindredacts_db";

let client = null;
let db = null;

// In-memory fallback collection storage for local dev when external MongoDB is not reachable
const inMemoryStore = {
  users: [],
  events: [],
  joined_events: []
};

async function connectDB() {
  if (db) return db;

  try {
    client = new MongoClient(uri, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      },
      connectTimeoutMS: 5000,
      serverSelectionTimeoutMS: 5000,
    });

    await client.connect();
    db = client.db(dbName);
    console.log(`[MongoDB] Connected successfully to database: ${dbName}`);
    return db;
  } catch (error) {
    console.warn(`[MongoDB Warning] Could not connect to remote MongoDB: ${error.message}`);
    console.info("[MongoDB Fallback] Operating with resilient local memory store for smooth development and testing.");
    return null;
  }
}

function getDB() {
  return db;
}

function getFallbackStore() {
  return inMemoryStore;
}

module.exports = {
  connectDB,
  getDB,
  getFallbackStore,
};
