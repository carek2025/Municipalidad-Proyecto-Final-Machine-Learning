import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Registro de ciudadano
router.post('/register', async (req, res) => {
  try {
    const { dni, nombres, apellidos, email, celular, direccion, distrito, password } = req.body;

    // Validaciones básicas
    if (!dni || !nombres || !apellidos || !celular || !direccion || !distrito || !password) {
      return res.status(400).json({ 
        error: 'Todos los campos obligatorios deben ser completados' 
      });
    }

    if (dni.length !== 8) {
      return res.status(400).json({ 
        error: 'El DNI debe tener 8 dígitos' 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        error: 'La contraseña debe tener al menos 6 caracteres' 
      });
    }

    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({ 
      $or: [{ dni }, { email }] 
    });

    if (existingUser) {
      return res.status(400).json({ 
        error: 'El DNI o email ya está registrado' 
      });
    }

    // Crear usuario
    const user = new User({
      dni,
      nombres: nombres.trim(),
      apellidos: apellidos.trim(),
      email: email?.trim() || undefined,
      celular,
      direccion: direccion.trim(),
      distrito,
      password,
      rol: 'ciudadano'
    });

    await user.save();

    // Generar token
    const token = jwt.sign(
      { 
        userId: user._id, 
        rol: user.rol,
        area: user.area 
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      token,
      user: user.publicData
    });

  } catch (error) {
    console.error('Error en registro:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        error: 'Error de validación', 
        details: errors 
      });
    }
    
    if (error.code === 11000) {
      return res.status(400).json({ 
        error: 'El DNI ya está registrado' 
      });
    }
    
    res.status(500).json({ 
      error: 'Error interno del servidor' 
    });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { dni, password } = req.body;

    if (!dni || !password) {
      return res.status(400).json({ 
        error: 'DNI y contraseña son requeridos' 
      });
    }

    // Buscar usuario
    const user = await User.findOne({ dni, activo: true });
    if (!user) {
      return res.status(401).json({ 
        error: 'Credenciales inválidas' 
      });
    }

    // Verificar contraseña
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({ 
        error: 'Credenciales inválidas' 
      });
    }

    // Generar token
    const token = jwt.sign(
      { 
        userId: user._id, 
        rol: user.rol,
        area: user.area 
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Actualizar último acceso
    user.ultimoAcceso = new Date();
    await user.save();

    res.json({
      success: true,
      message: 'Login exitoso',
      token,
      user: user.publicData
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor' 
    });
  }
});

// Obtener perfil de usuario
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    res.json({
      success: true,
      user: req.user.publicData
    });
  } catch (error) {
    console.error('Error obteniendo perfil:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor' 
    });
  }
});

// Actualizar perfil
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { email, celular, direccion, distrito, configuracion } = req.body;
    const usuario = req.user;

    // Campos permitidos para actualización
    const camposPermitidos = ['email', 'celular', 'direccion', 'distrito', 'configuracion'];
    const updates = {};

    camposPermitidos.forEach(campo => {
      if (req.body[campo] !== undefined) {
        updates[campo] = req.body[campo];
      }
    });

    const usuarioActualizado = await User.findByIdAndUpdate(
      usuario._id,
      updates,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Perfil actualizado exitosamente',
      user: usuarioActualizado.publicData
    });

  } catch (error) {
    console.error('Error actualizando perfil:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        error: 'Error de validación', 
        details: errors 
      });
    }
    
    res.status(500).json({ 
      error: 'Error interno del servidor' 
    });
  }
});

// Cambiar contraseña
router.put('/change-password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        error: 'Contraseña actual y nueva contraseña son requeridas' 
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        error: 'La nueva contraseña debe tener al menos 6 caracteres' 
      });
    }

    const usuario = req.user;

    // Verificar contraseña actual
    const isCurrentPasswordValid = await usuario.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ 
        error: 'La contraseña actual es incorrecta' 
      });
    }

    // Actualizar contraseña
    usuario.password = newPassword;
    await usuario.save();

    res.json({
      success: true,
      message: 'Contraseña actualizada exitosamente'
    });

  } catch (error) {
    console.error('Error cambiando contraseña:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor' 
    });
  }
});

export default router;