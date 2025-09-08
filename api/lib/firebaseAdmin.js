import admin from 'firebase-admin';

// Esta función asegura que la inicialización de Firebase ocurra solo una vez.
function initializeFirebaseAdmin() {
    // Si ya hay una app de Firebase inicializada, la retornamos para no crear duplicados.
    if (admin.apps.length) {
        return admin.app();
    }

    // Si no hay una app, procedemos a crearla usando las credenciales seguras de Vercel.
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!serviceAccountJson) {
        throw new Error('La variable de entorno FIREBASE_SERVICE_ACCOUNT_KEY no está definida.');
    }
    
    const serviceAccount = JSON.parse(serviceAccountJson);

    // Inicializamos la app con las credenciales.
    return admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

// Inicializamos la app al cargar este módulo.
initializeFirebaseAdmin();

// Exportamos la instancia de Firestore para que otros archivos del servidor puedan usarla.
const db = admin.firestore();

export { db };
