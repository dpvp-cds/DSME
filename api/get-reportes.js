import { db } from './lib/firebaseAdmin.js';

export default async function handler(req, res) {
    // 1. Verificamos que la solicitud sea para OBTENER datos (GET).
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Método no permitido' });
    }
    
    // NOTA DE SEGURIDAD: En un futuro, aquí se podría verificar que solo un terapeuta autenticado pueda hacer esta petición.

    try {
        // 2. Usamos nuestra conexión centralizada 'db' para hablar con Firestore.
        // Pedimos la colección 'reportes_dpvper' y la ordenamos por fecha, de más nuevo a más antiguo.
        const snapshot = await db.collection('reportes_dpvper').orderBy('fecha', 'desc').get();
        
        // 3. Si no hay ningún reporte, devolvemos una lista vacía.
        if (snapshot.empty) {
            return res.status(200).json([]);
        }
        
        // 4. Transformamos los datos de Firebase a un formato limpio que el portal.html pueda entender.
        const reportes = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                demograficos: data.demograficos,
                // Convertimos el objeto Timestamp de Firebase a un formato de texto estándar (ISO string)
                // para que el navegador pueda interpretarlo sin errores.
                fecha: data.fecha.toDate().toISOString()
            };
        });
        
        // 5. Enviamos la lista de reportes de vuelta al portal.html con una respuesta exitosa.
        res.status(200).json(reportes);

    } catch (error) {
        console.error("Error al obtener reportes:", error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
}

