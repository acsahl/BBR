import { MongoClient } from "mongodb";

// Cache the MongoClient across function invocations.
// Netlify Functions reuse the Node process between warm invocations,
// so this avoids reconnecting on every request.
let cachedClient = null;
let cachedDb = null;

export async function getDb() {
  if (cachedDb) return cachedDb;

  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB || "bbr";

  if (!uri) {
    throw new Error("MONGODB_URI is not set. Check your .env file.");
  }

  if (!cachedClient) {
    cachedClient = new MongoClient(uri, {
      maxPoolSize: 5,
      serverSelectionTimeoutMS: 8000,
    });
    await cachedClient.connect();
  }

  cachedDb = cachedClient.db(dbName);
  return cachedDb;
}

export async function getCollections() {
  const db = await getDb();
  return {
    users: db.collection("users"),
    completions: db.collection("completions"),
  };
}
