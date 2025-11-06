import PDFDocument from 'pdfkit';
import QRCode from 'qr-image';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class PDFGenerator {
  constructor() {
    this.doc = new PDFDocument({
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 50, right: 50 }
    });
    this.buffers = [];
    
    this.doc.on('data', (chunk) => this.buffers.push(chunk));
  }

  // Generar encabezado municipal
  generarEncabezado() {
    // Logo (placeholder - en producción usar imagen real)
    this.doc
      .fillColor('#1e40af')
      .fontSize(20)
      .font('Helvetica-Bold')
      .text('GOBIERNO REGIONAL DE HUÁNUCO', 50, 50, { align: 'center' })
      .fontSize(16)
      .text('MUNICIPALIDAD PROVINCIAL DE HUÁNUCO', 50, 75, { align: 'center' })
      .fontSize(12)
      .font('Helvetica')
      .text('Av. Universitaria S/N, Huánuco - Teléfono: (062) 512255', 50, 95, { align: 'center' })
      .text('RUC: 20131312949', 50, 110, { align: 'center' });
    
    // Línea separadora
    this.doc
      .moveTo(50, 130)
      .lineTo(545, 130)
      .strokeColor('#dc2626')
      .lineWidth(2)
      .stroke();
    
    return this;
  }

  // Generar sello municipal
  generarSelloMunicipal(x, y) {
    this.doc
      .save()
      .translate(x, y)
      .scale(0.4)
      .fillColor('#1e40af')
      .circle(0, 0, 50)
      .fill()
      .fillColor('white')
      .fontSize(8)
      .font('Helvetica-Bold')
      .text('MUNICIPALIDAD', -45, -5, { width: 90, align: 'center' })
      .text('HUÁNUCO', -45, 5, { width: 90, align: 'center' })
      .restore();
    
    return this;
  }

  // Generar sello personal
  generarSelloPersonal(usuario, x, y) {
    const sello = usuario.generateSelloPersonal();
    
    this.doc
      .save()
      .translate(x, y)
      .fillColor('#059669')
      .roundedRect(-40, -15, 80, 30, 5)
      .fill()
      .fillColor('white')
      .fontSize(8)
      .font('Helvetica-Bold')
      .text(sello, -35, -5, { width: 70, align: 'center' })
      .restore();
    
    return this;
  }

  // Generar QR code
  generarQR(texto, x, y, tamaño = 80) {
    try {
      const qr = QRCode.imageSync(texto, { type: 'png', size: 6 });
      this.doc.image(qr, x, y, { width: tamaño, height: tamaño });
    } catch (error) {
      console.error('Error generando QR:', error);
    }
    return this;
  }

  // Generar documento de trámite
  async generarDocumentoTramite(tramite, usuario, funcionario = null) {
    return new Promise((resolve, reject) => {
      try {
        const fecha = new Date().toLocaleDateString('es-PE', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });

        // Encabezado
        this.generarEncabezado();

        // Título del documento
        this.doc
          .fillColor('#1e293b')
          .fontSize(18)
          .font('Helvetica-Bold')
          .text(`COMPROBANTE DE TRÁMITE - ${tramite.codigo}`, 50, 150, { align: 'center' });

        // Información del trámite
        let yPosition = 200;

        this.doc
          .fillColor('#374151')
          .fontSize(12)
          .font('Helvetica-Bold')
          .text('INFORMACIÓN DEL TRÁMITE:', 50, yPosition)
          .font('Helvetica')
          .fillColor('#6b7280');

        yPosition += 20;
        this.generarLinea('Código de Trámite:', tramite.codigo, yPosition);
        yPosition += 15;
        this.generarLinea('Tipo de Trámite:', this.formatearTipoTramite(tramite.tipo), yPosition);
        yPosition += 15;
        this.generarLinea('Estado:', tramite.estado, yPosition);
        yPosition += 15;
        this.generarLinea('Prioridad:', tramite.prioridad, yPosition);
        yPosition += 15;
        this.generarLinea('Fecha de Solicitud:', 
          new Date(tramite.fechaSolicitud).toLocaleDateString('es-PE'), yPosition);
        yPosition += 15;

        if (tramite.fechaFinalizacion) {
          this.generarLinea('Fecha de Finalización:', 
            new Date(tramite.fechaFinalizacion).toLocaleDateString('es-PE'), yPosition);
          yPosition += 15;
        }

        // Información del ciudadano
        yPosition += 10;
        this.doc
          .fillColor('#374151')
          .font('Helvetica-Bold')
          .text('INFORMACIÓN DEL CIUDADANO:', 50, yPosition)
          .font('Helvetica')
          .fillColor('#6b7280');

        yPosition += 20;
        this.generarLinea('DNI:', usuario.dni, yPosition);
        yPosition += 15;
        this.generarLinea('Nombres Completos:', `${usuario.nombres} ${usuario.apellidos}`, yPosition);
        yPosition += 15;
        this.generarLinea('Dirección:', usuario.direccion, yPosition);
        yPosition += 15;
        this.generarLinea('Distrito:', usuario.distrito, yPosition);
        yPosition += 15;
        this.generarLinea('Celular:', usuario.celular, yPosition);

        // Descripción
        if (tramite.descripcion) {
          yPosition += 20;
          this.doc
            .fillColor('#374151')
            .font('Helvetica-Bold')
            .text('DESCRIPCIÓN:', 50, yPosition)
            .font('Helvetica')
            .fillColor('#6b7280')
            .text(tramite.descripcion, 50, yPosition + 15, { 
              width: 495, 
              align: 'justify' 
            });
          yPosition += this.doc.heightOfString(tramite.descripcion, { width: 495 }) + 25;
        }

        // Sellos y firmas
        const footerY = 650;
        
        // Sello municipal
        this.generarSelloMunicipal(100, footerY);
        
        // Sello personal si hay funcionario
        if (funcionario) {
          this.generarSelloPersonal(funcionario, 300, footerY);
        }
        
        // QR code
        const qrData = JSON.stringify({
          codigo: tramite.codigo,
          tipo: tramite.tipo,
          estado: tramite.estado,
          fecha: tramite.fechaSolicitud,
          ciudadano: usuario.dni
        });
        this.generarQR(qrData, 400, footerY);

        // Pie de página
        this.doc
          .fontSize(8)
          .fillColor('#9ca3af')
          .text(`Documento generado el ${fecha} - Sistema de Gestión Documental Municipal`, 
                50, 750, { align: 'center' });

        this.doc.end();

        // Convertir a buffer
        this.doc.on('end', () => {
          const pdfBuffer = Buffer.concat(this.buffers);
          resolve(pdfBuffer);
        });

      } catch (error) {
        reject(error);
      }
    });
  }

  // Helper para generar líneas de información
  generarLinea(etiqueta, valor, y) {
    this.doc
      .text(etiqueta, 50, y)
      .text(valor, 200, y);
  }

  // Formatear tipo de trámite
  formatearTipoTramite(tipo) {
    const formatos = {
      'LICENCIA_FUNCIONAMIENTO': 'Licencia de Funcionamiento',
      'PERMISO_CONSTRUCCION': 'Permiso de Construcción',
      'PARTIDA_NACIMIENTO': 'Partida de Nacimiento',
      'MATRIMONIO_CIVIL': 'Matrimonio Civil',
      'DEFUNCION': 'Partida de Defunción',
      'CONSTANCIA_VECINDAD': 'Constancia de Vecindad',
      'RECLAMO': 'Reclamo o Queja',
      'SOLICITUD_SERVICIO': 'Solicitud de Servicio',
      'PAGO_ARBITRIOS': 'Pago de Arbitrios',
      'AUTORIZACION_EVENTO': 'Autorización de Evento',
      'LICENCIA_CONDUCIR': 'Licencia de Conducir',
      'VERIFICACION_VEHICULAR': 'Verificación Vehicular'
    };
    return formatos[tipo] || tipo;
  }
}

export default PDFGenerator;