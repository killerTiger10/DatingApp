const jwt = require("jsonwebtoken");

const authenticate = (req, res, next) => {
  const authHeader = req.header("Authorization");
  console.log("Authorization Header Received in Middleware:", authHeader); // Debug log

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.error("Authorization header missing or malformed:", authHeader);
    return res
      .status(401)
      .json({ error: "Access denied, malformed or missing token" });
  }

  const token = authHeader.replace("Bearer ", "");
  console.log("Extracted Token:", token); // Debug log

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Attach the user to the request
    next(); // Proceed to the protected route
  } catch (err) {
    console.error("Invalid token:", err);
    return res.status(403).json({ error: "Invalid token" });
  }
};

module.exports = authenticate;
