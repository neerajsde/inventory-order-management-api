import { beforeAll, afterAll, afterEach } from "vitest";
import mongoose from "mongoose";
import { connectRedis, disconnectRedis, redisClient } from "../config/redis.config.js";
import { orderWorker } from "../modules/order/order.worker.js";

// Override Mongo URI for tests so we don't wipe the development database
process.env.MONGO_URI = "mongodb://localhost:27017/inventory-management-test";
process.env.JWT_SECRET = "testsecret";
process.env.JWT_REFRESH_SECRET = "testrefreshsecret";

beforeAll(async () => {
  // Connect to the test database
  await mongoose.connect(process.env.MONGO_URI!);
  await connectRedis();
});

afterEach(async () => {
  // Clear all collections after each test
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
  
  // Clear redis data for testing
  if (redisClient.isOpen) {
    await redisClient.flushDb();
  }
});

afterAll(async () => {
  await orderWorker.close();
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await disconnectRedis();
});
