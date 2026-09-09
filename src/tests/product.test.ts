import request from "supertest";
import { describe, it, expect, beforeEach } from "vitest";
import app from "../app.js";

describe("Product API", () => {
  let token: string;

  const productData = {
    name: "Test Keyboard",
    description: "Mechanical keyboard",
    price: 150.0,
    stockQuantity: 10,
    category: "electronics",
  };

  beforeEach(async () => {
    // Create user and get token
    await request(app).post("/api/v1/auth/register").send({
      email: "productadmin@example.com",
      password: "Password123!",
      firstName: "Admin",
      lastName: "User",
    });

    const res = await request(app).post("/api/v1/auth/login").send({
      email: "productadmin@example.com",
      password: "Password123!",
    });
    token = res.body.accessToken;
  });

  it("should block unauthenticated access", async () => {
    const res = await request(app).post("/api/v1/products").send(productData);
    expect(res.status).toBe(401);
  });

  it("should create a product successfully", async () => {
    const res = await request(app)
      .post("/api/v1/products")
      .set("Authorization", `Bearer ${token}`)
      .send(productData);
      
    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe(productData.name);
    expect(res.body.data._id).toBeDefined();
  });

  it("should get paginated products", async () => {
    // Seed a product first
    await request(app)
      .post("/api/v1/products")
      .set("Authorization", `Bearer ${token}`)
      .send(productData);

    const res = await request(app)
      .get("/api/v1/products?page=1&limit=10")
      .set("Authorization", `Bearer ${token}`);
      
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.pagination).toBeDefined();
    expect(res.body.data.length).toBeGreaterThan(0);
  });
});
