const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    try {
        const authHeader = req.header('Authorization');
        
        console.log('🔍 Auth header:', authHeader);

        if (!authHeader) {
            console.log('❌ No hay header Authorization');
            return res.status(401).json({
                success: false,
                message: 'Acceso denegado. Token no proporcionado'
            });
        }

        const token = authHeader.replace('Bearer ', '');

        if (!token) {
            console.log('❌ Token vacío');
            return res.status(401).json({
                success: false,
                message: 'Acceso denegado. Formato de token inválido'
            });
        }

        console.log('🔑 Token recibido:', token.substring(0, 20) + '...');

        const verified = jwt.verify(token, process.env.JWT_SECRET);
        
        console.log('✅ Token verificado. Usuario:', verified);
        
        // Agregar usuario verificado a la request
        req.user = verified;
        
        // Continuar con la siguiente función
        next();

    } catch (error) {
        console.error('❌ Error en authMiddleware:', error.message);
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expirado'
            });
        }
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Token inválido'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error de autenticación',
            error: error.message
        });
    }
};

module.exports = { authMiddleware };