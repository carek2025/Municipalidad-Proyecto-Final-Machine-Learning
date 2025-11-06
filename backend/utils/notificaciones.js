import nodemailer from 'nodemailer';
import twilio from 'twilio';
import User from '../models/User.js';

class NotificacionesService {
  constructor() {
    // Configuración de email (usando Gmail como ejemplo)
    this.transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    // Configuración de SMS (Twilio)
    this.twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
  }

  // Enviar notificación por email
  async enviarEmail(destinatario, asunto, contenido, tipo = 'INFORMATIVO') {
    try {
      const mailOptions = {
        from: `"Municipalidad de Huánuco" <${process.env.EMAIL_USER}>`,
        to: destinatario,
        subject: asunto,
        html: this.generarTemplateEmail(contenido, tipo)
      };

      const resultado = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Email enviado a ${destinatario}: ${resultado.messageId}`);
      
      return {
        success: true,
        messageId: resultado.messageId,
        tipo: 'EMAIL'
      };
    } catch (error) {
      console.error('❌ Error enviando email:', error);
      return {
        success: false,
        error: error.message,
        tipo: 'EMAIL'
      };
    }
  }

  // Enviar notificación por SMS
  async enviarSMS(numero, mensaje) {
    try {
      // Validar formato de número (debe incluir código de país)
      const numeroFormateado = numero.startsWith('+') ? numero : `+51${numero}`;
      
      const mensajeSMS = await this.twilioClient.messages.create({
        body: `MuniHuánuco: ${mensaje}`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: numeroFormateado
      });

      console.log(`✅ SMS enviado a ${numeroFormateado}: ${mensajeSMS.sid}`);
      
      return {
        success: true,
        messageId: mensajeSMS.sid,
        tipo: 'SMS'
      };
    } catch (error) {
      console.error('❌ Error enviando SMS:', error);
      return {
        success: false,
        error: error.message,
        tipo: 'SMS'
      };
    }
  }

  // Notificar cambio de estado de trámite
  async notificarCambioEstado(tramite, estadoAnterior, estadoNuevo, observaciones = '') {
    const ciudadano = await User.findById(tramite.ciudadano);
    if (!ciudadano) return;

    const asunto = `Actualización de trámite ${tramite.codigo}`;
    const contenido = `
      <h2>Actualización de Trámite</h2>
      <p>Su trámite <strong>${tramite.codigo}</strong> ha cambiado de estado:</p>
      <p><strong>De:</strong> ${estadoAnterior}</p>
      <p><strong>A:</strong> ${estadoNuevo}</p>
      ${observaciones ? `<p><strong>Observaciones:</strong> ${observaciones}</p>` : ''}
      <p>Puede ver el detalle de su trámite en el sistema de gestión municipal.</p>
      <br>
      <p><em>Municipalidad Provincial de Huánuco</em></p>
    `;

    const resultados = [];

    // Enviar email si el usuario tiene email y acepta notificaciones
    if (ciudadano.email && ciudadano.configuracion?.notificacionesEmail) {
      const resultadoEmail = await this.enviarEmail(ciudadano.email, asunto, contenido);
      resultados.push(resultadoEmail);
    }

    // Enviar SMS si el usuario acepta notificaciones SMS
    if (ciudadano.celular && ciudadano.configuracion?.notificacionesSMS) {
      const mensajeSMS = `Su trámite ${tramite.codigo} cambió a: ${estadoNuevo}. ${observaciones ? `Obs: ${observaciones.substring(0, 50)}...` : ''}`;
      const resultadoSMS = await this.enviarSMS(ciudadano.celular, mensajeSMS);
      resultados.push(resultadoSMS);
    }

    return resultados;
  }

  // Notificar alerta urgente
  async notificarAlertaUrgente(alerta, destinatarios) {
    const asunto = `🚨 Alerta Urgente: ${alerta.titulo}`;
    const contenido = `
      <h2 style="color: #dc2626;">Alerta Urgente</h2>
      <p><strong>${alerta.titulo}</strong></p>
      <p>${alerta.mensaje}</p>
      <p><strong>Código de Trámite:</strong> ${alerta.tramite.codigo}</p>
      <p><strong>Tipo:</strong> ${alerta.tipo}</p>
      <p><strong>Nivel:</strong> ${alerta.nivel}</p>
      <br>
      <p style="color: #dc2626;"><em>Requiere atención inmediata</em></p>
      <p><em>Municipalidad Provincial de Huánuco</em></p>
    `;

    const resultados = [];

    for (const destinatario of destinatarios) {
      const usuario = await User.findById(destinatario.usuario);
      if (!usuario) continue;

      // Email
      if (usuario.email && usuario.configuracion?.notificacionesEmail) {
        resultados.push(await this.enviarEmail(usuario.email, asunto, contenido));
      }

      // SMS
      if (usuario.celular && usuario.configuracion?.notificacionesSMS) {
        const mensajeSMS = `ALERTA: ${alerta.titulo}. ${alerta.mensaje.substring(0, 100)}...`;
        resultados.push(await this.enviarSMS(usuario.celular, mensajeSMS));
      }
    }

    return resultados;
  }

  // Notificar vencimiento de trámite
  async notificarVencimiento(tramite) {
    const ciudadano = await User.findById(tramite.ciudadano);
    if (!ciudadano) return;

    const diasRestantes = Math.ceil((tramite.fechaVencimiento - new Date()) / (1000 * 60 * 60 * 24));
    
    const asunto = `⏰ Recordatorio: Trámite próximo a vencer`;
    const contenido = `
      <h2>Recordatorio de Vencimiento</h2>
      <p>Su trámite <strong>${tramite.codigo}</strong> está próximo a vencer.</p>
      <p><strong>Días restantes:</strong> ${diasRestantes} día(s)</p>
      <p><strong>Fecha de vencimiento:</strong> ${tramite.fechaVencimiento.toLocaleDateString('es-PE')}</p>
      <p>Por favor, complete los requisitos pendientes para evitar la caducidad del trámite.</p>
      <br>
      <p><em>Municipalidad Provincial de Huánuco</em></p>
    `;

    const resultados = [];

    if (ciudadano.email && ciudadano.configuracion?.notificacionesEmail) {
      resultados.push(await this.enviarEmail(ciudadano.email, asunto, contenido));
    }

    if (ciudadano.celular && ciudadano.configuracion?.notificacionesSMS) {
      const mensajeSMS = `Recordatorio: Trámite ${tramite.codigo} vence en ${diasRestantes} días. Complete requisitos.`;
      resultados.push(await this.enviarSMS(ciudadano.celular, mensajeSMS));
    }

    return resultados;
  }

  // Generar template de email profesional
  generarTemplateEmail(contenido, tipo) {
    const colorHeader = {
      'URGENTE': '#dc2626',
      'ALTA': '#ea580c',
      'MEDIA': '#2563eb',
      'INFORMATIVO': '#059669'
    }[tipo] || '#2563eb';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: ${colorHeader}; color: white; padding: 20px; text-align: center; }
          .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
          .footer { background: #374151; color: white; padding: 15px; text-align: center; font-size: 12px; }
          .logo { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">MUNICIPALIDAD DE HUÁNUCO</div>
            <div>Sistema de Gestión Documental</div>
          </div>
          <div class="content">
            ${contenido}
          </div>
          <div class="footer">
            <p>Av. Universitaria S/N, Huánuco | Teléfono: (062) 512255</p>
            <p>© ${new Date().getFullYear()} Municipalidad Provincial de Huánuco. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Notificación de bienvenida para nuevos usuarios
  async enviarNotificacionBienvenida(usuario) {
    const asunto = '👋 Bienvenido al Sistema de Gestión Municipal';
    const contenido = `
      <h2>¡Bienvenido/a, ${usuario.nombres}!</h2>
      <p>Su cuenta ha sido creada exitosamente en el Sistema de Gestión Documental de la Municipalidad Provincial de Huánuco.</p>
      <p><strong>Sus datos de acceso:</strong></p>
      <ul>
        <li><strong>DNI:</strong> ${usuario.dni}</li>
        <li><strong>Nombre:</strong> ${usuario.nombres} ${usuario.apellidos}</li>
        <li><strong>Rol:</strong> ${usuario.rol === 'ciudadano' ? 'Ciudadano' : 'Personal Municipal'}</li>
      </ul>
      <p>Puede comenzar a utilizar el sistema accediendo a: <a href="https://munihuanuco.gob.pe">munihuanuco.gob.pe</a></p>
      <br>
      <p><em>Municipalidad Provincial de Huánuco</em></p>
    `;

    const resultados = [];

    if (usuario.email) {
      resultados.push(await this.enviarEmail(usuario.email, asunto, contenido));
    }

    if (usuario.celular) {
      const mensajeSMS = `Bienvenido/a ${usuario.nombres} al Sistema de Gestión Municipal. Acceda en: munihuanuco.gob.pe`;
      resultados.push(await this.enviarSMS(usuario.celular, mensajeSMS));
    }

    return resultados;
  }
}

export default new NotificacionesService();