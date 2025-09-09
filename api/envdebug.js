export default function handler(req, res) {
  res.status(200).json({
    length: process.env.FIREBASE_SERVICE_ACCOUNT_BASE64
      ? process.env.FIREBASE_SERVICE_ACCOUNT_BASE64.length
      : 'undefined',
    preview: process.env.FIREBASE_SERVICE_ACCOUNT_BASE64
      ? process.env.FIREBASE_SERVICE_ACCOUNT_BASE64.substring(0, 100)
      : "No variable definida"
  });
}
