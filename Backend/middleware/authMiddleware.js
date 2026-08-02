const jwt = require("jsonwebtoken");
require("dotenv").config();

exports.verifyToken = (req, res, next) => {

    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({
            message: "Token missing"
        });
    }

    const token = authHeader.split(" ")[1];

    try {

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET_KEY
        );
        
        const currentTime = Math.floor(Date.now() / 1000);
        const expiryTime = decoded.exp;
        const remainingSeconds = expiryTime - currentTime;

        // ✅ FIX: Convert to human-readable date format
        const currentDate = new Date(currentTime * 1000);
        const expiryDate = new Date(expiryTime * 1000);

        console.log("Current Date & Time:", currentDate.toString());
        console.log("----------------------------------------");
        console.log("Expiry Date & Time:", expiryDate.toString());
        console.log("----------------------------------------");
        console.log("Remaining Time:", formatRemainingTime(remainingSeconds));
        console.log("----------------------------------------");

        if (remainingSeconds <= 0) {
            console.log("❌ Access Token Expired");
        } else {
            const minutes = Math.floor(remainingSeconds / 60);
            const seconds = remainingSeconds % 60;
            console.log(`✅ Access Token expires in ${minutes} minute(s) ${seconds} second(s)`);
        }
        
        req.user = decoded;
        next();
    }
    catch(err) {
        if (err.name === "TokenExpiredError") {
            return res.status(401).json({
                message: "Token expired",
                expired: true
            });
        }
        return res.status(401).json({ message: "Invalid token" });
    }
};

// ✅ Helper function to format remaining time nicely
function formatRemainingTime(totalSeconds) {
    if (totalSeconds <= 0) 
        return "Expired";
    
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    let result = "";
    if (days > 0) 
        result += `${days} day(s) `;
    if (hours > 0) 
        result += `${hours} hour(s) `;
    if (minutes > 0) 
        result += `${minutes} minute(s) `;
    if (seconds > 0) 
        result += `${seconds} second(s)`;
    
    return result.trim();
}
