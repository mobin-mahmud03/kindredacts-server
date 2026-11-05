
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME || 'kindredacts_db';

const isProduction = process.env.NODE_ENV === 'production';

// Prevent multiple MongoDB connections in serverless environments
let client = null;
let clientPromise = null;
let db = null;

// In-memory fallback for local development
const inMemoryStore = {
  users: [],
  events: [],
  joined_events: []
};

async function connectDB() {
  if (db) {
    return db;
  }

  if (!uri) {
    const error = new Error('MONGODB_URI is not configured');

    if (isProduction) {
      throw error;
    }

    console.warn('[MongoDB] URI missing. Using local memory storage.');
    return null;
  }

  try {
    if (!clientPromise) {
      client = new MongoClient(uri, {
        serverApi: {
          version: ServerApiVersion.v1,
          strict: true,
          deprecationErrors: true
        },
        connectTimeoutMS: 10000,
        serverSelectionTimeoutMS: 10000,
        maxPoolSize: 10
      });

      clientPromise = client.connect().catch((error) => {
        client = null;
        clientPromise = null;
        throw error;
      });
    }

    await clientPromise;

    db = client.db(dbName);

    console.log(
      `[MongoDB] Connected successfully: ${dbName}`
    );

    return db;

  } catch (error) {
    console.error(
      '[MongoDB Connection Error]',
      error.message
    );

    if (isProduction) {
      throw error;
    }

    console.warn(
      '[MongoDB] Using in-memory fallback for development.'
    );

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
  getFallbackStore
};
