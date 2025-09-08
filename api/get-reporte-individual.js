import { db } from './lib/firebaseAdmin.js';

export default async function handler(req, res) {
    // 1. Verificamos que la solicitud sea para OBTENER datos (GET).
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Método no permitido' });
    }
    
    // 2. Extraemos el ID del reporte que nos pide el navegador desde la URL.
    const { id } = req.query;
    if (!id) {
        return res.status(400).json({ message: 'El ID del reporte es requerido.' });
    }

    try {
        // 3. Usamos nuestra conexión 'db' y le pedimos que busque el documento exacto con ese ID.
        const docRef = db.collection('reportes_dpvper').doc(id);
        const doc = await docRef.get();

        // 4. Si el documento no existe en la base de datos, devolvemos un error.
        if (!doc.exists) {
            return res.status(404).json({ message: 'Reporte no encontrado.' });
        }
        
        // 5. Si lo encontramos, preparamos los datos para enviarlos.
        const data = doc.data();
        const responseData = {
            id: doc.id,
            ...data,
            // Convertimos la fecha de Firebase a un formato estándar para el navegador.
            fecha: data.fecha.toDate().toISOString()
        };

        // 6. Enviamos el reporte completo de vuelta a la página reporte-personal.html.
        res.status(200).json(responseData);

    } catch (error) {
        console.error(`Error al obtener reporte ${id}:`, error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
}

