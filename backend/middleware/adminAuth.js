const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
        return res.status(401).json({ 
            success: false, 
            message: 'No token, authorization denied' 
        });
    }
    
    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Check if user role is admin
        if (decoded.role !== 'admin') {
            return res.status(403).json({ 
                success: false, 
                message: 'Access denied: Admins only' 
            });
        }
        
        req.admin = decoded;
        next();
    } catch (err) {
        res.status(401).json({ 
            success: false, 
            message: 'Token is not valid' 
        });
    }
};
