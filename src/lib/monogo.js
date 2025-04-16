import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const uri = process.env.DATABASE_URL;
const options = {};
const DEFAULT_DB = "Recordings";
const DEFAULT_COLLECTION = "Recordings";

let client;
let clientPromise;

if (!global._mongoClientPromise) {
  client = new MongoClient(uri, options);
  global._mongoClientPromise = client.connect();
}

clientPromise = global._mongoClientPromise;

export async function getCollection(
  collectionName = DEFAULT_COLLECTION,
  dbName = DEFAULT_DB
) {
  const client = await clientPromise;
  const db = client.db(dbName);
  return db.collection(collectionName);
}

export async function findOne(query, collectionName = DEFAULT_COLLECTION) {
  const collection = await getCollection(collectionName);
  return await collection.findOne(query);
}

export async function insertOne(data, collectionName = DEFAULT_COLLECTION) {
  const collection = await getCollection(collectionName);
  return await collection.insertOne(data);
}

export async function updateOne(
  filter,
  update,
  options = {},
  collectionName = DEFAULT_COLLECTION
) {
  const collection = await getCollection(collectionName);
  return await collection.updateOne(filter, update, options);
}
