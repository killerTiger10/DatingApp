const request = require("supertest");
const app = require("../server"); // Assuming this is where your Express app is exported
const User = require("../models/User");
const mongoose = require("mongoose");

describe("Auth Routes", () => {
    let token;

// beforeAll(async () => {
//   // Connect to the test database
//   await mongoose.connect(process.env.TEST_DB_URI, {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
//   });

// Create a test user
const user = new User({
  username: "testUser",
  email: "test@example.com",
  password: "password123",
});
 user.save();

// Log in to get a valid token
const response = await request(app).post("/auth/login").send({
  email: "test@example.com",
  password: "password123",
});
token = response.body.accessToken;
// });

afterAll(async () => {
  // Cleanup: Delete the test user and close the database connection
  await User.deleteMany({ email: "test@example.com" });
  await mongoose.connection.close();
});

describe("Profile Routes", () => {
  it("should fetch the user's profile", async () => {
    const response = await request(app)
      .get("/profile")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("username", "testUser");
    expect(response.body).toHaveProperty("email", "test@example.com");
    expect(response.body).not.toHaveProperty("password");
  });

  it("should update the user's profile", async () => {
    const updatedData = {
      username: "updatedUser",
      email: "updated@example.com",
    };

    const response = await request(app)
      .put("/profile")
      .set("Authorization", `Bearer ${token}`)
      .send(updatedData);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("username", "updatedUser");
    expect(response.body).toHaveProperty("email", "updated@example.com");
  });

  it("should deny access to profile without token", async () => {
    const response = await request(app).get("/profile");

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty(
      "error",
      "Access denied, no token provided"
    );
  });

  it("should return an error for an invalid token", async () => {
    const response = await request(app)
      .get("/profile")
      .set("Authorization", "Bearer invalidToken");

    expect(response.status).toBe(403);
    expect(response.body).toHaveProperty("error", "Invalid token");
  });
});
});
