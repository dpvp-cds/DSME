import { db } from './lib/firebaseAdmin.js';
import { Resend } from 'resend';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { Buffer } from 'buffer';

// Función para crear el PDF del reporte personal
async function crearPDF(datos) {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    let y = height - 50;
    
    // Título
    page.drawText('Reporte Preliminar - Escala DPvPer', { x: 50, y, font: boldFont, size: 24, color: rgb(0, 0, 0) });
    y -= 40;

    // Datos demográficos
    page.drawText(`Nombre: ${datos.demograficos.nombre}`, { x: 50, y, font, size: 12 });
    y -= 20;
    page.drawText(`Email: ${datos.demograficos.email}`, { x: 50, y, font, size: 12 });
    y -= 30;

    // Resultados de Arquetipos
    page.drawText('Resultados de Arquetipos:', { x: 50, y, font: boldFont, size: 16 });
    y -= 25;

    // Procesar y mostrar los puntajes
    const arquetipos = {
        a: "El Guerrero", b: "El Creador", c: "El Amante", d: "El Sabio",
        e: "El Explorador", f: "El Inocente", g: "El Gobernante", h: "El Mago"
    };

    const scores = datos.resultados;
    for (const arquetipo in scores) {
        if (arquetipos[arquetipo]) {
             page.drawText(`${arquetipos[arquetipo]}: ${scores[arquetipo]} / 10`, { x: 70, y, font, size: 12 });
             y -= 20;
        }
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
        console.log("Recibiendo datos para guardar y enviar...");

        // 1. Guardar en Firestore
        console.log("Guardando en la colección 'reportes-personales'...");
        const docRef = await db.collection('reportes-personales').add({
            ...datosCompletos,
            fecha: new Date().toISOString()
        });
        console.log("Datos guardados con éxito. ID del documento:", docRef.id);


        // 2. Crear el PDF
        console.log("Creando PDF...");
        const pdfBuffer = await crearPDF(datosCompletos);
        console.log("PDF creado exitosamente.");


        // 3. Enviar correo con Resend
        // -----  CORRECCIÓN DE LA VARIABLE DE ENTORNO APLICADA  -----
        const resend = new Resend(process.env.RESEND2_API_KEY);
        
        console.log(`Enviando correo a ${datosCompletos.demograficos.email} y copia a dpvp.cds@emcotic.com...`);
        const { data, error } = await resend.emails.send({
          from: 'DPvPer Diagnóstico <dpvp.cds@emcotic.com>',
          to: datosCompletos.demograficos.email,
          bcc: 'dpvp.cds@emcotic.com',
          subject: `Resultados de tu Diagnóstico DPvPer - ${datosCompletos.demograficos.nombre}`,
          html: `<h1>Hola ${datosCompletos.demograficos.nombre.split(' ')[0]},</h1><p>Gracias por completar la Escala DPvPer. Adjunto encontrarás un resumen en PDF con tus puntuaciones.</p><p>Un saludo,<br>Jorge Arango Castaño</p>`,
          attachments: [
            {
              filename: `Reporte-DPvPer-${docRef.id}.pdf`,
              content: Buffer.from(pdfBuffer),
            },
          ],
        });

        if (error) {
            console.error("Resend devolvió un error:", error);
            throw new Error(error.message);
        }

        console.log("Correo enviado exitosamente. ID de envío:", data.id);
        response.status(200).json({ message: 'Reporte guardado y correo enviado con éxito', id: docRef.id });

    } catch (error) {
        console.error("Error en el proceso:", error);
        response.status(500).json({ message: 'Error interno del servidor', error: error.message });
    }
}

