import request from "supertest";
import { describe, it, expect } from "vitest";
import app from "../app.js";

describe("Auth API", () => {
  const userData = {
    email: "testuser@example.com",
    password: "Password123!",
    firstName: "Test",
    lastName: "User",
  };

  it("should register a new user successfully", async () => {
    const res = await request(app).post("/api/v1/auth/register").send(userData);
    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe(userData.email);
    expect(res.body.user).not.toHaveProperty("password");
  });

  it("should not allow duplicate email registration", async () => {
    await request(app).post("/api/v1/auth/register").send(userData);
    const res = await request(app).post("/api/v1/auth/register").send(userData);
    
    expect(res.status).toBe(409); // Conflict
  });

  it("should login successfully and return tokens", async () => {
    await request(app).post("/api/v1/auth/register").send(userData);
    
    const res = await request(app).post("/api/v1/auth/login").send({
      email: userData.email,
      password: userData.password,
    });

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
  });

  it("should reject invalid login credentials", async () => {
    await request(app).post("/api/v1/auth/register").send(userData);
    
    const res = await request(app).post("/api/v1/auth/login").send({
      email: userData.email,
      password: "WrongPassword!",
    });

    expect(res.status).toBe(401);
  });
});
