import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuración de almacenamiento
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// Filtro de archivos
const fileFilter = (req, file, cb) => {
  const allowedTypes = {
    'image/jpeg': true,
    'image/jpg': true,
    'image/png': true,
    'application/pdf': true,
    'application/msword': true,
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': true
  };

  if (allowedTypes[file.mimetype]) {
    cb(null, true);
  } else {
    cb(new Error(`Tipo de archivo no permitido: ${file.mimetype}`), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB límite
    files: 5 // máximo 5 archivos
  },
  fileFilter: fileFilter
});

// Middleware para manejar errores de upload
export const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        error: 'El archivo es demasiado grande. Máximo 10MB.' 
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ 
        error: 'Demasiados archivos. Máximo 5 archivos.' 
      });
    }
  }
  
  if (error.message.includes('Tipo de archivo no permitido')) {
    return res.status(400).json({ 
      error: 'Tipo de archivo no permitido. Formatos aceptados: JPEG, PNG, PDF, DOC, DOCX.' 
    });
  }

  next(error);
};

export default upload;