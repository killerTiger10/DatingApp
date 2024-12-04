const request = require("supertest");
const app = require("../server");
const User = require("../models/User");
const jwt = require("jsonwebtoken");

describe("Auth Routes", () => {
  let token = ""; // Store the access token
  let refreshToken = ""; // Store the refresh token

  afterAll(async () => {
    console.log("Cleaning up test data...");
    await User.deleteMany({ email: "john.doe@example.com" });
  });

  it("should register a new user", async () => {
    const requestData = {
      username: "johnDoe",
      email: "john.doe@example.com",
      password: "password123",
      firstName: "John",
      lastName: "Doe",
      age: 25,
      gender: "male",
      interests: ["hiking", "reading"],
    };

    const response = await request(app)
      .post("/auth/register")
      .send(requestData);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("username", requestData.username);
    expect(response.body).toHaveProperty("email", requestData.email);
    expect(response.body).toHaveProperty("firstName", requestData.firstName);
    expect(response.body).toHaveProperty("lastName", requestData.lastName);
    expect(response.body).toHaveProperty("age", requestData.age);
    expect(response.body).toHaveProperty("gender", requestData.gender);
    expect(response.body).toHaveProperty("interests", requestData.interests);
    expect(response.body).toHaveProperty("accessToken");
    expect(response.body).toHaveProperty("refreshToken");
  });

  it("should return an error if user tries to register with an existing email", async () => {
    console.log("Test: Duplicate registration with existing email");
    const response = await request(app).post("/auth/register").send({
      username: "johnDoe",
      email: "john.doe@example.com",
      password: "password123",
    });
    console.log("Response:", response.body);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("error", "Email already in use");
  });

  it("should log in and return an access token and refresh token", async () => {
    console.log("Test: Login with valid credentials");
    const response = await request(app).post("/auth/login").send({
      email: "john.doe@example.com",
      password: "password123",
    });
    console.log("Response:", response.body);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("accessToken");
    expect(response.body).toHaveProperty("refreshToken");
    token = response.body.accessToken;
    refreshToken = response.body.refreshToken;
    console.log(token);
    console.log(refreshToken);
  });

  it("should allow access to protected route with valid token", async () => {
    console.log("Test: Access protected route with valid token");
    console.log("H E R E");
    console.log("access: ", token);
    console.log("refresh: ", refreshToken);
    const response = await request(app)
      .get("/posts")
      .set("Authorization", `Bearer ${token}`);
    console.log("Response:", response.body);

    expect(response.status).toBe(200);
  });

  it("should deny access to protected route without token", async () => {
    console.log("Test: Access protected route without token");
    const response = await request(app).get("/posts");
    console.log("Response:", response.body);

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("error");
  });

  it("should deny access to protected route with an invalid token", async () => {
    console.log("Test: Access protected route with invalid token");
    const response = await request(app)
      .get("/posts")
      .set("Authorization", "Bearer invalidToken");
    console.log("Response:", response.body);

    expect(response.status).toBe(403);
    expect(response.body).toHaveProperty("error", "Invalid token");
  });

  it("should return an error for expired access token, but allow refresh with refresh token", async () => {
    console.log("Test: Expired access token and refreshing it");

    // Create an expired token
    const expiredToken = jwt.sign(
      { id: "dummyUserId" },
      process.env.JWT_SECRET,
      { expiresIn: "1s" }
    );
    console.log("Expired Token:", expiredToken);

    // Wait to ensure the token expires
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Test accessing protected route with expired token
    const expiredTokenResponse = await request(app)
      .get("/posts")
      .set("Authorization", `Bearer ${expiredToken}`);
    console.log("Response for expired token:", expiredTokenResponse.body);

    expect(expiredTokenResponse.status).toBe(403);
    expect(expiredTokenResponse.body).toHaveProperty("error");

    // Use the refresh token to get a new access token
    const refreshResponse = await request(app)
      .post("/auth/refresh")
      .set("Cookie", `refreshToken=${refreshToken}`);
    console.log("Response for refreshed token:", refreshResponse.body);

    expect(refreshResponse.status).toBe(200);
    expect(refreshResponse.body).toHaveProperty("accessToken");

    // Test the new access token on the protected route
    const newAccessToken = refreshResponse.body.accessToken;
    const protectedResponse = await request(app)
      .get("/posts")
      .set("Authorization", `Bearer ${newAccessToken}`);
    console.log("Response with refreshed token:", protectedResponse.body);

    expect(protectedResponse.status).toBe(200);
  });

  it("should return an error when the refresh token is expired", async () => {
    console.log("Test: Expired refresh token");
    const expiredRefreshToken = jwt.sign(
      { id: "dummyUserId" },
      process.env.JWT_SECRET,
      { expiresIn: "1s" }
    );

    // Wait for the refresh token to expire
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Attempt to refresh the access token using the expired refresh token
    const response = await request(app)
      .post("/auth/refresh")
      .set("Cookie", `refreshToken=${expiredRefreshToken}`);
    console.log("Response:", response.body);

    expect(response.status).toBe(403);
    expect(response.body).toHaveProperty("error");
  });
});
