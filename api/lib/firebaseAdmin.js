import admin from 'firebase-admin';
import { Buffer } from 'buffer';

// Esta función asegura que la inicialización de Firebase ocurra solo una vez.
function initializeFirebaseAdmin() {
    if (admin.apps.length) {
        return admin.app();
    }

    const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;

    if (!serviceAccountBase64) {
        console.error("CRITICAL: La variable de entorno FIREBASE_SERVICE_ACCOUNT_BASE64 no está definida en Vercel.");
        throw new Error('La configuración del servidor de Firebase (admin) no está completa.');
    }

    try {
        const serviceAccountJson = Buffer.from(serviceAccountBase64, 'base64').toString('utf-8');
        const serviceAccount = JSON.parse(serviceAccountJson);

        return admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
    } catch (error) {
        console.error("Error al decodificar o parsear la FIREBASE_SERVICE_ACCOUNT_BASE64:", error);
        throw new Error('La llave de la cuenta de servicio de Firebase está malformada.');
    }
}

// Inicializamos la app y exportamos la instancia de Firestore.
const app = initializeFirebaseAdmin();
const db = app.firestore();
export { db };
