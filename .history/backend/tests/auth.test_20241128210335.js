const request = require("supertest");
const app = require("../server"); // Import your Express app here
const User = require("../models/User"); // Import the User model to clean up test data
const jwt = require("jsonwebtoken");

describe("Auth Routes", () => {
  let token = ""; // This will hold the token for login tests

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
  it("should log in and return a token", async () => {
    const response = await request(app).post("/auth/login").send({
      email: "john.doe@example.com",
      password: "password123",
    });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("token"); // Check if token is returned
    token = response.body.token; // Store token for subsequent tests
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
  it("should return an error for expired token", async () => {
    // Simulating an expired token by creating one with a short expiry time (1 minute)
    const expiredToken = jwt.sign(
      { id: "dummyUserId" },
      process.env.JWT_SECRET,
      { expiresIn: "1s" } // Set expiry to 1 second
    );

    // Wait for 2 seconds to ensure the token has expired
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const response = await request(app)
      .get("/posts")
      .set("Authorization", `Bearer ${expiredToken}`);

    expect(response.status).toBe(403); // Expect forbidden error
    expect(response.body).toHaveProperty("error", "Invalid token");
  });
});
