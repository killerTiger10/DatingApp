const jwt = require("jsonwebtoken");

const authenticate = (req, res, next) => {
  console.log("Middleware hit");
  const token = req.header("Authorization")?.replace("Bearer ", "");
  if (!token) {
    return res.status(401).json({ error: "Access denied, no token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Attach the user to the request
    next(); // Proceed to the protected route
  } catch (err) {
    return res.status(403).json({ error: "Invalid token" });
  }
};

module.exports = authenticate;
