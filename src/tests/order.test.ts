import request from "supertest";
import { describe, it, expect, beforeEach } from "vitest";
import app from "../app.js";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe("Order API (Async Processing)", () => {
  let token: string;
  let productId: string;

  beforeEach(async () => {
    // Setup User
    await request(app).post("/api/v1/auth/register").send({
      email: "orderuser@example.com",
      password: "Password123!",
      firstName: "Order",
      lastName: "User",
    });

    const loginRes = await request(app).post("/api/v1/auth/login").send({
      email: "orderuser@example.com",
      password: "Password123!",
    });
    token = loginRes.body.accessToken;

    // Setup Product
    const productRes = await request(app)
      .post("/api/v1/products")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Queue Test Item",
        description: "Test description",
        price: 50.0,
        stockQuantity: 5,
        category: "test",
      });
    productId = productRes.body.data._id;
  });

  it("should validate and enqueue order returning 202", async () => {
    const res = await request(app)
      .post("/api/v1/orders")
      .set("Authorization", `Bearer ${token}`)
      .send({
        items: [{ productId, quantity: 2 }],
      });

    expect(res.status).toBe(202);
    expect(res.body.message).toBe("Order accepted and is processing");
    expect(res.body.data.status).toBe("pending");
    expect(res.body.data.totalAmount).toBe(100.0);
    
    // Give BullMQ worker time to process the job
    await sleep(500);

    // Verify stock was reduced
    const productCheck = await request(app)
      .get(`/api/v1/products/${productId}`)
      .set("Authorization", `Bearer ${token}`);
      
    expect(productCheck.body.data.stockQuantity).toBe(3);

    // Verify order was confirmed
    const orderCheck = await request(app)
      .get(`/api/v1/orders/${res.body.data._id}`)
      .set("Authorization", `Bearer ${token}`);
      
    expect(orderCheck.body.data.status).toBe("confirmed");
  });

  it("should fail gracefully for insufficient stock", async () => {
    const res = await request(app)
      .post("/api/v1/orders")
      .set("Authorization", `Bearer ${token}`)
      .send({
        items: [{ productId, quantity: 10 }], // only 3 left
      });

    expect(res.status).toBe(400); // Should fail synchronously during initial validation
    expect(res.body.error.code).toBe("INSUFFICIENT_STOCK");
  });
});
