import admin from 'firebase-admin';

// Esta función asegura que la inicialización de Firebase ocurra solo una vez.
function initializeFirebaseAdmin() {
    // Si ya hay una app de Firebase inicializada, la retornamos para no crear duplicados.
    if (admin.apps.length) {
        return admin.app();
    }

    // Si no hay una app, procedemos a crearla usando las credenciales seguras.
    const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
    if (!serviceAccountBase64) {
        throw new Error('La variable de entorno FIREBASE_SERVICE_ACCOUNT_BASE64 no está definida.');
    }
    
    // Decodificamos la clave desde Base64 para que Firebase pueda leerla.
    const serviceAccountJson = Buffer.from(serviceAccountBase64, 'base64').toString('utf-8');
    const serviceAccount = JSON.parse(serviceAccountJson);

    // Inicializamos la app con las credenciales.
    return admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

// Inicializamos la app al cargar este módulo.
initializeFirebaseAdmin();

// Exportamos la instancia de Firestore para que otros archivos puedan usarla directamente.
// Esto nos evita tener que llamar a admin.firestore() en cada archivo.
const db = admin.firestore();

export { db };
