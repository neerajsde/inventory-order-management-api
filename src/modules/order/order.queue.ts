import { Queue } from "bullmq";
import { ENV } from "../../config/env.js";

const connection = {
  host: ENV.REDIS_HOST || "127.0.0.1",
  port: ENV.REDIS_PORT || 6379,
};

export const orderQueue = new Queue("order-processing", { connection });

export async function addOrderToQueue(
  orderId: string,
  userId: string,
  items: { productId: string; quantity: number }[]
) {
  return await orderQueue.add("process-order", { orderId, userId, items });
}
