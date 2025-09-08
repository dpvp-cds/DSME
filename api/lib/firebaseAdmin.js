// Importa el SDK de Firebase Admin
import admin from 'firebase-admin';

// Verifica si la aplicación de Firebase ya ha sido inicializada.
// Esto es crucial en entornos serverless como Vercel para evitar errores
// de inicialización múltiple en cada ejecución de la función.
if (!admin.apps.length) {
  try {
    // Intenta inicializar la aplicación.
    // El SDK buscará automáticamente las credenciales en la variable de entorno
    // FIREBASE_SERVICE_ACCOUNT_KEY que configuramos en Vercel.
    admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY))
    });
  } catch (error) {
    console.error('Firebase admin initialization error', error.stack);
  }
}

// Exporta la instancia de Firestore para que pueda ser utilizada
// por nuestras funciones de API (get-reportes.js, etc.).
export default admin.firestore();
