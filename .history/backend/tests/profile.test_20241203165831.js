const request = require("supertest");
const app = require("../server"); // Assuming your Express app is in the 'server.js' file
const User = require("../models/User");
const jwt = require("jsonwebtoken");

// Centralized mock user data for reuse
const mockUser = {
  username: "johnDoe",
  email: "john.doe@example.com",
  firstName: "John",
  lastName: "Doe",
  password: "password123", // The password will be hashed before saving
  age: 25,
  gender: "Male",
  location: "New York, USA",
  interests: ["hiking", "reading"],
};

let token = ""; // Store the access token for authorized requests

// Setup a user for testing
beforeAll(async () => {
  const user = await User.create(mockUser);

  // Generate a JWT token for the created user
  token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });
});

afterAll(async () => {
  // Clean up the test user after tests run
  await User.deleteMany({ email: mockUser.email });
});

describe("Profile Routes", () => {
  // Test for fetching profile
  it("should fetch user profile", async () => {
    const response = await request(app)
      .get("/profile/view")
      .set("Authorization", `Bearer ${token}`);

    console.log(response.status, response.body); // Debug response

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("username", mockUser.username);
    expect(response.body).toHaveProperty("email", mockUser.email);
    expect(response.body).not.toHaveProperty("password"); // Ensure password is not returned
  });

  // Test for updating profile
  it("should update user profile", async () => {
    const updateData = {
      firstName: "UpdatedFirstName",
      lastName: "UpdatedLastName",
      bio: "This is a new bio",
      location: "Los Angeles, USA",
    };

    const response = await request(app)
      .put("/profile/update")
      .set("Authorization", `Bearer ${token}`)
      .send(updateData);

    expect(response.status).toBe(200);
    expect(response.body.firstName).toBe(updateData.firstName);
    expect(response.body.lastName).toBe(updateData.lastName);
    expect(response.body.bio).toBe(updateData.bio);
    expect(response.body.location).toBe(updateData.location);
    expect(response.body).not.toHaveProperty("password"); // Ensure password is not updated
  });

  // Test for unauthorized access to profile
  it("should return 401 if no token is provided", async () => {
    const response = await request(app).get("/profile/view");
    console.log("should return 401", response.body);
    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty(
      "error",
      "Access denied, malformed or missing token"
    );
  });

  // Test for unauthorized update attempt
  it("should return 401 if no token is provided during update", async () => {
    const updateData = {
      firstName: "UnauthorizedUpdate",
    };

    const response = await request(app).put("/profile/update").send(updateData);

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty(
      "error",
      "Access denied, malformed or missing token"
    );
  });

  // Test for invalid token
  it("should return 401 for invalid token during profile fetch", async () => {
    const response = await request(app)
      .get("/profile/view")
      .set("Authorization", "Bearer invalidToken");

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("error", "Invalid or expired token");
  });

  // Test for updating non-existing user
  it("should return 404 if user not found during update", async () => {
    const fakeToken = jwt.sign({ id: "fakeUserId" }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    const response = await request(app)
      .put("/profile/update")
      .set("Authorization", `Bearer ${fakeToken}`)
      .send({ firstName: "NonExistingUser" });

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty("error", "User not found");
  });

  // Test for updating profile with invalid data
  it("should return 400 for invalid profile update data", async () => {
    const invalidData = {
      email: "invalidEmail", // Invalid email format
    };

    const response = await request(app)
      .put("/profile/update")
      .set("Authorization", `Bearer ${token}`)
      .send(invalidData);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("error");
  });

  // Test for updating profile with empty payload
  it("should return 400 for empty payload", async () => {
    const response = await request(app)
      .put("/profile/update")
      .set("Authorization", `Bearer ${token}`)
      .send({}); // Empty payload

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("error", "No update fields provided");
  });
});
