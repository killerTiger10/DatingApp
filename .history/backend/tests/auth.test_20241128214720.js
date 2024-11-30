const request = require("supertest");
const app = require("../server"); // Import your Express app here
const User = require("../models/User"); // Import the User model to clean up test data
const jwt = require("jsonwebtoken");

describe("Auth Routes", () => {
  let token = ""; // This will hold the access token for login tests
  let refreshToken = ""; // This will hold the refresh token for login tests

  // Clean up users after tests (optional but recommended for isolated tests)
  afterAll(async () => {
    await User.deleteMany({ email: "john.doe@example.com" }); // Cleanup test user
  });

  // Test the Register route
  it("should register a new user", async () => {
    const response = await request(app).post("/auth/register").send({
      username: "johnDoe",
      email: "john.doe@example.com",
      password: "password123",
    });

    // Check if registration was successful and valid user data is returned
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("username", "johnDoe");
    expect(response.body).toHaveProperty("email", "john.doe@example.com");
    expect(response.body).toHaveProperty("token"); // Token should be part of response
  });

  // Test duplicate registration (should fail)
  it("should return an error if user tries to register with an existing email", async () => {
    const response = await request(app).post("/auth/register").send({
      username: "johnDoe",
      email: "john.doe@example.com",
      password: "password123",
    });

    // Expect error as the email is already registered
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty(
      "error",
      "Email already in use" // Updated to match the route logic
    );
  });

  // Test the Login route
  it("should log in and return an access token and refresh token", async () => {
    const response = await request(app).post("/auth/login").send({
      email: "john.doe@example.com",
      password: "password123",
    });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("accessToken"); // Check if access token is returned
    expect(response.body).toHaveProperty("refreshToken"); // Check if refresh token is returned
    token = response.body.accessToken; // Store access token for subsequent tests
    refreshToken = response.body.refreshToken; // Store refresh token for subsequent tests
  });

  // Test token validity in a protected route (e.g., /posts)
  it("should allow access to protected route with valid token", async () => {
    const response = await request(app)
      .get("/posts")
      .set("Authorization", `Bearer ${token}`); // Send token in the Authorization header

    expect(response.status).toBe(200); // Expect a successful response
  });

  // Test access to protected route without token
  it("should deny access to protected route without token", async () => {
    const response = await request(app).get("/posts");

    expect(response.status).toBe(401); // Expect unauthorized error
    expect(response.body).toHaveProperty(
      "error",
      "Access denied, no token provided" // Ensure this matches the error in the route
    );
  });

  // Test access to protected route with invalid token
  it("should deny access to protected route with an invalid token", async () => {
    const response = await request(app)
      .get("/posts")
      .set("Authorization", "Bearer invalidToken");

    expect(response.status).toBe(403); // Expect forbidden error for invalid token
    expect(response.body).toHaveProperty("error", "Invalid token");
  });

  // Optionally, Test token expiration
  it("should return an error for expired access token, but allow refresh with refresh token", async () => {
    // Simulate an expired access token by creating one with a short expiry time (1 second)
    const expiredToken = jwt.sign(
      { id: "dummyUserId" },
      process.env.JWT_SECRET,
      { expiresIn: "1s" }
    );

    // Wait for 2 seconds to ensure the token has expired
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Test the expired access token
    const response = await request(app)
      .get("/posts")
      .set("Authorization", `Bearer ${expiredToken}`);

    expect(response.status).toBe(403); // Expect forbidden error for expired token
    expect(response.body).toHaveProperty("error", "Invalid token");

    // Now, try to refresh the token
    const refreshResponse = await request(app)
      .post("/auth/refresh")
      .set("Cookie", `refreshToken=${refreshToken}`); // Pass refresh token in cookies

    expect(refreshResponse.status).toBe(200); // Expect a new access token
    expect(refreshResponse.body).toHaveProperty("accessToken"); // Ensure a new access token is returned
  });

  // Test Refresh Token Endpoint
  it("should return a new access token when provided with a valid refresh token", async () => {
    // Simulate login to get the refresh token
    const loginResponse = await request(app).post("/auth/login").send({
      email: "john.doe@example.com",
      password: "password123",
    });

    refreshToken = loginResponse.body.refreshToken; // Get the refresh token

    const response = await request(app)
      .post("/auth/refresh") // Endpoint for refreshing the token
      .set("Cookie", `refreshToken=${refreshToken}`); // Pass refresh token in cookies

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("accessToken"); // Check if a new access token is returned
  });

  // Test access to protected route with refresh token handling
  it("should allow access to protected route with valid refresh token", async () => {
    // First, simulate a login to get the access and refresh tokens
    const loginResponse = await request(app).post("/auth/login").send({
      email: "john.doe@example.com",
      password: "password123",
    });

    refreshToken = loginResponse.body.refreshToken; // Get the refresh token

    // Simulate an expired access token by setting a very short expiry time
    const expiredToken = jwt.sign(
      { id: "dummyUserId" },
      process.env.JWT_SECRET,
      { expiresIn: "1s" }
    );

    // Wait for 2 seconds to ensure the token has expired
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Try accessing the protected route with the expired access token
    const protectedResponse = await request(app)
      .get("/posts")
      .set("Authorization", `Bearer ${expiredToken}`);

    expect(protectedResponse.status).toBe(403); // Expect forbidden error for expired token

    // Now, try to refresh the token and access the route with the new access token
    const refreshResponse = await request(app)
      .post("/auth/refresh")
      .set("Cookie", `refreshToken=${refreshToken}`);

    expect(refreshResponse.status).toBe(200);
    const newAccessToken = refreshResponse.body.accessToken;

    // Access the protected route with the new access token
    const finalResponse = await request(app)
      .get("/posts")
      .set("Authorization", `Bearer ${newAccessToken}`);

    expect(finalResponse.status).toBe(200); // Access should be granted with the new token
  });

  // Test Refresh Token Expiration
  it("should return an error when the refresh token is expired", async () => {
    // Create an expired refresh token manually (e.g., using a shorter expiration time)
    const expiredRefreshToken = jwt.sign(
      { id: "dummyUserId" },
      process.env.JWT_SECRET,
      { expiresIn: "1s" } // Expire quickly
    );

    // Wait for 2 seconds to ensure the refresh token has expired
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Try refreshing with the expired refresh token
    const response = await request(app)
      .post("/auth/refresh")
      .set("Cookie", `refreshToken=${expiredRefreshToken}`);

    expect(response.status).toBe(403); // Expect forbidden error for expired refresh token
    expect(response.body).toHaveProperty("error", "Invalid refresh token");
  });
});
