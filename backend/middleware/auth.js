import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        error: 'Acceso denegado. Token requerido.' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ 
        error: 'Token inválido. Usuario no encontrado.' 
      });
    }

    if (!user.activo) {
      return res.status(401).json({ 
        error: 'Cuenta desactivada. Contacte al administrador.' 
      });
    }

    // Actualizar último acceso
    user.ultimoAcceso = new Date();
    await user.save();

    req.user = user;
    next();
  } catch (error) {
    console.error('Error en autenticación:', error);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expirado. Por favor, inicie sesión nuevamente.' 
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Token inválido.' 
      });
    }
    
    res.status(500).json({ 
      error: 'Error en la autenticación.' 
    });
  }
};

export const requireRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.rol)) {
      return res.status(403).json({ 
        error: 'Acceso denegado. Permisos insuficientes.' 
      });
    }
    next();
  };
};

export const requireArea = (areas) => {
  return (req, res, next) => {
    if (!areas.includes(req.user.area)) {
      return res.status(403).json({ 
        error: 'Acceso denegado. Área no autorizada.' 
      });
    }
    next();
  };
};