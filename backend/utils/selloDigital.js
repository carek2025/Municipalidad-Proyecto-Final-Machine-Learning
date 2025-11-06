import crypto from 'crypto';

class SelloDigital {
  // Generar hash único para documentos
  static generarHash(documento) {
    const contenido = JSON.stringify(documento);
    return crypto.createHash('sha256').update(contenido).digest('hex');
  }

  // Generar sello de tiempo
  static generarSelloTiempo() {
    return {
      timestamp: new Date().toISOString(),
      timezone: 'America/Lima',
      formato: 'ISO 8601'
    };
  }

  // Validar integridad de documento
  static validarIntegridad(documento, hashOriginal) {
    const hashActual = this.generarHash(documento);
    return hashActual === hashOriginal;
  }

  // Generar firma digital básica (en producción usar certificados digitales)
  static generarFirma(usuario, documento) {
    const selloTiempo = this.generarSelloTiempo();
    const hashDocumento = this.generarHash(documento);
    
    const firma = {
      usuario: {
        id: usuario._id,
        dni: usuario.dni,
        nombre: `${usuario.nombres} ${usuario.apellidos}`,
        cargo: usuario.cargo
      },
      selloTiempo: selloTiempo,
      hashDocumento: hashDocumento,
      selloPersonal: usuario.generateSelloPersonal(),
      metadata: {
        version: '1.0',
        algoritmo: 'SHA-256'
      }
    };

    // Firmar con clave privada (simulada)
    const firmaDigital = crypto
      .createHmac('sha256', process.env.JWT_SECRET)
      .update(JSON.stringify(firma))
      .digest('hex');

    return {
      ...firma,
      firmaDigital: firmaDigital
    };
  }
}

export default SelloDigital;