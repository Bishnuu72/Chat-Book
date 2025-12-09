const jwt = require("jsonwebtoken");
const secret = process.env.JWT_SECRET;

const fetchUser = (req, res, next) => {
    const token = req.header("auth-token");
    if (!token) {
        return res.status(401).send("Unauthorized Access");
    }

    try {
        const data = jwt.verify(token, secret);
        req.user = data.user;
        next();
    } catch (error) {
        console.log(error)
        res.status(400).send("Invalid Token");
    }
};

module.exports = fetchUser;
