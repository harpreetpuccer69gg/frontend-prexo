const jwt = require("jsonwebtoken");

const SECRET = process.env.JWT_SECRET || "attendance_secret";

function auth(req, res, next) {

    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({
            message: "Token required"
        });
    }

    const token = authHeader.replace("Bearer ", "");

    try {

        const decoded = jwt.verify(token, SECRET);

        req.user = decoded; // contains email + role

        next();

    } catch (err) {

        return res.status(401).json({
            message: "Invalid token"
        });

    }
}

module.exports = auth;
