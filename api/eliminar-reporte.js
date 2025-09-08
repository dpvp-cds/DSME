import { db } from './lib/firebaseAdmin.js';

export default async function handler(req, res) {
    // 1. Verificamos que la solicitud sea para BORRAR datos (DELETE).
    if (req.method !== 'DELETE') {
        return res.status(405).json({ message: 'Método no permitido' });
    }
    
    // NOTA DE SEGURIDAD: En un futuro, aquí se debería verificar que solo un terapeuta autenticado pueda hacer esta petición.

    // 2. Extraemos el ID del reporte que el portal.html nos dice que borremos.
    const { id } = req.query;
    if (!id) {
        return res.status(400).json({ message: 'El ID del reporte es requerido.' });
    }

    try {
        // 3. Usamos nuestra conexión 'db' y le damos la orden de borrar el documento con ese ID.
        const docRef = db.collection('reportes_dpvper').doc(id);
        await docRef.delete();
        
        // 4. Enviamos una respuesta de éxito de vuelta al portal.html para que sepa que la operación funcionó.
        res.status(200).json({ message: 'Reporte eliminado con éxito.' });

    } catch (error) {
        console.error(`Error al eliminar reporte ${id}:`, error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
}

