import { db } from '../lib/firebaseAdmin.js';
import { Resend } from 'resend';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { Buffer } from 'buffer';

// Función para crear el PDF del reporte DSME
async function crearPDF_DSME(datos) {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    let y = height - 50;

    // Título
    page.drawText('Reporte Preliminar - Escala DSME', { x: 50, y, font: boldFont, size: 22, color: rgb(0, 0.2, 0.4) });
    y -= 40;

    // Datos demográficos
    page.drawText(`Nombre: ${datos.demograficos.nombre}`, { x: 50, y, font, size: 12 });
    y -= 20;
    page.drawText(`Email: ${datos.demograficos.email}`, { x: 50, y, font, size: 12 });
    y -= 20;
    page.drawText(`Empresa: ${datos.empresa.nombre}`, { x: 50, y, font, size: 12 });
    y -= 30;

    // Resultados de Pilares - Asegurarse que los datos llegan
    page.drawText('Resultados de los Pilares:', { x: 50, y, font: boldFont, size: 16 });
    y -= 25;

    // Los puntajes se calculan en el frontend y se pasan en el body
    const pilarScores = datos.pilarScores; 
    const ismeScore = datos.ismeScore;

    const pilarNames = ["", "1. Resiliencia", "2. Vínculo Identitario", "3. Sostenibilidad", "4. Capital Social", "5. Psicología Financiera"];
    
    if (pilarScores) {
        for (const pilar in pilarScores) {
            page.drawText(`${pilarNames[pilar]}: ${pilarScores[pilar]} / 35`, { x: 70, y, font, size: 12 });
            y -= 20;
        }
    }

    y -= 10;
    
    // Resultado Global
    page.drawText('Resultado Global (ISME):', { x: 50, y, font: boldFont, size: 16 });
    y -= 25;
    if (ismeScore !== undefined) {
        page.drawText(`${ismeScore.toFixed(2)} / 100`, { x: 70, y, font: boldFont, size: 14, color: rgb(0, 0.2, 0.4) });
    }

    const pdfBytes = await pdfDoc.save();
    return pdfBytes;
}

// Handler principal de la API
export default async function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(405).json({ message: 'Método no permitido' });
    }

    try {
        const datosCompletos = request.body;
        console.log("Recibiendo datos para guardar y enviar correo de DSME...");

        // 1. Guardar en Firestore
        const dataToSave = { ...datosCompletos, fecha: new Date().toISOString() };
        const docRef = await db.collection('artifacts/dsm/public/data/dsme-reports').add(dataToSave);
        console.log("Datos de DSME guardados con éxito. ID:", docRef.id);

        // 2. Crear el PDF
        console.log("Creando PDF...");
        const pdfBuffer = await crearPDF_DSME(datosCompletos);
        console.log("PDF de DSME creado.");

        // 3. Enviar correo con Resend
        // CORRECCIÓN: Usar RESEND2_API_KEY para coincidir con la configuración del proyecto anterior.
        const resendApiKey = process.env.RESEND2_API_KEY;
        if (!resendApiKey) {
            console.error("La variable de entorno RESEND2_API_KEY no está definida en Vercel.");
            throw new Error("La configuración para enviar correos no está completa.");
        }
        const resend = new Resend(resendApiKey);
        
        console.log(`Enviando correo a dpvp.cds@emotic.com...`);
        const { data, error } = await resend.emails.send({
          from: 'Reporte DSME <noreply@caminosdelser.co>',
          to: 'dpvp.cds@emotic.com',
          subject: `Nuevo Reporte DSME - ${datosCompletos.demograficos.nombre}`,
          html: `<h1>Nuevo Reporte de la Escala DSME</h1><p>Se ha completado un nuevo diagnóstico.</p><p><strong>Nombre:</strong> ${datosCompletos.demograficos.nombre}</p><p><strong>Email:</strong> ${datosCompletos.demograficos.email}</p><p>El reporte completo se encuentra adjunto en formato PDF.</p>`,
          attachments: [
            {
              filename: `Reporte-DSME-${docRef.id}.pdf`,
              content: Buffer.from(pdfBuffer),
            },
          ],
        });

        if (error) {
            console.error("Resend devolvió un error:", error);
            throw new Error(error.message);
        }

        console.log("Correo de DSME enviado. ID:", data.id);
        response.status(200).json({ message: 'Reporte guardado y correo enviado', id: docRef.id });

    } catch (error) {
        console.error("Error en el servidor al procesar el reporte DSME:", error);
        response.status(500).json({ message: 'Error interno del servidor', error: error.message });
    }
}

