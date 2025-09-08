import { Resend } from 'resend';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { Buffer } from 'buffer';

// El import de 'db' desde firebaseAdmin no es necesario aquí,
// ya que esta función solo se encarga de la notificación.
// El guardado se hace en el frontend (index.html).

const resend = new Resend(process.env.RESEND_API_KEY);

// --- FUNCIÓN PARA CREAR EL PDF DEL REPORTE DSME ---
async function createDSME_PDF(reportData) {
    const { demographics, pilarScores, ismeScore } = reportData;

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const brandColor = rgb(0, 51/255, 102/255); // #003366

    let y = height - 50;

    // Título del Reporte
    page.drawText('Reporte Preliminar - Escala DSME', { x: 50, y, font: boldFont, size: 22, color: brandColor });
    y -= 40;

    // Datos Demográficos del Emprendedor
    page.drawText('Datos del Emprendedor', { x: 50, y, font: boldFont, size: 16 });
    y -= 25;
    page.drawText(`Nombre: ${demographics.nombreCompleto}`, { x: 60, y, font, size: 11 });
    y -= 20;
    page.drawText(`Email: ${demographics.email}`, { x: 60, y, font, size: 11 });
    y -= 20;
    page.drawText(`Empresa: ${demographics.nombreEmpresa}`, { x: 60, y, font, size: 11 });
    y -= 30;

    // Resultados del Diagnóstico
    page.drawText('Resumen de Resultados', { x: 50, y, font: boldFont, size: 16 });
    y -= 25;
    
    // Índice Global
    page.drawText(`Índice de Salud Mental del Emprendedor (ISME):`, { x: 60, y, font, size: 12 });
    page.drawText(`${ismeScore.toFixed(2)} / 100`, { x: 350, y, font: boldFont, size: 12, color: brandColor });
    y -= 30;

    // Puntajes por Pilar
    page.drawText('Puntuación por Pilar (sobre 35):', { x: 60, y, font: boldFont, size: 12 });
    y -= 20;

    const pilarNames = [
        "Pilar 1: Resiliencia y Gestión de la Incertidumbre",
        "Pilar 2: Vínculo Identitario (Fundador ↔ Empresa)",
        "Pilar 3: Sostenibilidad y Energía Personal",
        "Pilar 4: Capital Social y Red de Apoyo",
        "Pilar 5: Psicología Financiera"
    ];

    pilarNames.forEach((name, index) => {
        const score = pilarScores[`pilar${index + 1}`];
        page.drawText(name, { x: 70, y, font, size: 11 });
        page.drawText(`${score}`, { x: 400, y, font: boldFont, size: 11 });
        y -= 20;
    });

    // Pie de página del PDF
    page.drawText('Este es un reporte preliminar generado automáticamente por la Escala DSME de Caminos del Ser.', { x: 50, y: 50, font, size: 8, color: rgb(0.5, 0.5, 0.5) });

    const pdfBytes = await pdfDoc.save();
    return pdfBytes;
}


// --- HANDLER PRINCIPAL DE LA API ---
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const reportData = req.body;
    const { demographics } = reportData;

    // 1. Crear el PDF
    console.log("Creando PDF del reporte DSME...");
    const pdfBuffer = await createDSME_PDF(reportData);
    console.log("PDF creado exitosamente.");

    // 2. Enviar correo con Resend
    const subject = `Nuevo Reporte DSME Completado: ${demographics.nombreCompleto}`;
    const emailHtml = `
      <h1>Hola Jorge,</h1>
      <p>Se ha completado un nuevo diagnóstico de la <strong>Escala DSME</strong> por parte de <strong>${demographics.nombreCompleto}</strong>.</p>
      <p>Se adjunta el reporte preliminar en formato PDF con los datos y puntuaciones obtenidas.</p>
      <p>Puedes acceder al portal para ver el historial completo de reportes.</p>
      <br>
      <p>Un saludo,<br><strong>Sistema de Reportes DSME</strong></p>
    `;

    console.log(`Enviando correo a dpvp.cds@emotic.com...`);
    const { data, error } = await resend.emails.send({
      from: 'Sistema DSME <reportes@dsme.caminosdelser.co>', // Asegúrate de tener un dominio verificado en Resend.
      to: ['dpvp.cds@emcotic.com'],
      subject: subject,
      html: emailHtml,
      attachments: [
        {
          filename: `Reporte-DSME-${demographics.nombreCompleto.replace(/\s+/g, '_')}.pdf`,
          content: Buffer.from(pdfBuffer),
        },
      ],
    });

    if (error) {
      console.error("Resend devolvió un error:", error);
      throw new Error(error.message);
    }

    console.log("Correo enviado exitosamente. ID de envío:", data.id);
    res.status(200).json({ message: 'Correo con PDF enviado con éxito' });

  } catch (error) {
    console.error("Error en el proceso de la API:", error);
    res.status(500).json({ message: 'Error interno del servidor', error: error.message });
  }
}

