import { Worker, Job } from "bullmq";
import { ENV } from "../../config/env.js";
import { processOrderTransaction } from "./order.service.js";
import logger from "../../utils/logger.js";

const connection = {
  host: ENV.REDIS_HOST || "127.0.0.1",
  port: ENV.REDIS_PORT || 6379,
};

export const orderWorker = new Worker(
  "order-processing",
  async (job: Job) => {
    const { orderId, userId, items } = job.data;
    
    logger.info(`⏳ Job ${job.id} - Processing order ${orderId}`);
    
    try {
      await processOrderTransaction(orderId, items);
      logger.info(`✅ Job ${job.id} - Order ${orderId} confirmed successfully`);
    } catch (error: any) {
      logger.error(`❌ Job ${job.id} - Order ${orderId} failed: ${error.message}`);
      throw error;
    }
  },
  { connection }
);

orderWorker.on("failed", (job, err) => {
  logger.error(`BullMQ Job ${job?.id} failed with error: ${err.message}`);
});
