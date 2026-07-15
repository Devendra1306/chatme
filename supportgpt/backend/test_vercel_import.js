export default async function handler(req, res) {
  try {
    console.log('Importing server.js...');
    const serverModule = await import('./server.js');
    res.status(200).json({
      success: true,
      message: 'Imported server.js successfully!',
      keys: Object.keys(serverModule)
    });
  } catch (err) {
    res.status(200).json({
      success: false,
      error: {
        message: err.message,
        stack: err.stack,
        code: err.code
      }
    });
  }
}
