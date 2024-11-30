const request = require("supertest");
const app = require("../server"); // Import your Express app here

describe("Auth Routes", () => {
  let token = ""; // This will hold the token for login tests

  // Test the Register route
  it("should register a new user", async () => {
    const response = await request(app).post("/auth/register").send({
      username: "johnDoe",
      email: "john.doe@example.com",
      password: "password123",
    });
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("username", "johnDoe");
    expect(response.body).toHaveProperty("email", "john.doe@example.com");
  });

  // Test the Login route
  it("should log in and return a token", async () => {
    const response = await request(app).post("/auth/login").send({
      email: "john.doe@example.com",
      password: "password123",
    });
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("token");
    token = response.body.token; // Store token for subsequent tests
  });

  // Optionally: You can also test protected routes using the token.
});
