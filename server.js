const express = require('express');
const fetch = require('node-fetch');
const app = express();
const PORT = process.env.PORT || 3000;

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// Ruta raíz - verificación
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    message: 'TVG Proxy Server funcionando',
    timestamp: new Date().toISOString(),
    endpoints: {
      getHash: '/get-hash?streamname=NOMBRE_DEL_CANAL'
    }
  });
});

// Ruta para obtener hash
app.get('/get-hash', async (req, res) => {
  const streamName = req.query.streamname || 'tvg_mbr';
  const timestamp = Math.floor(Date.now() / 1000);
  
  const url = `https://service.tvg.com/rcn/v1/generateHash?timestamp=${timestamp}&streamname=${encodeURIComponent(streamName)}`;
  
  console.log(`Intentando obtener hash para: ${streamName}`);
  console.log(`URL: ${url}`);
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Origin': 'https://www.tvg.com',
        'Referer': 'https://www.tvg.com/',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
      timeout: 10000 // 10 segundos timeout
    });
    
    console.log(`Respuesta de TVG: Status ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error TVG: ${response.status} - ${errorText}`);
      throw new Error(`TVG respondió con error ${response.status}`);
    }
    
    // Verificar que la respuesta sea JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('Respuesta no es JSON:', text.substring(0, 200));
      throw new Error('La respuesta no es JSON válido');
    }
    
    const data = await response.json();
    console.log('Datos recibidos:', JSON.stringify(data));
    
    // Verificar diferentes formatos de respuesta
    const hash = data.hash || data.Hash || data.data?.hash;
    
    if (!hash) {
      console.error('No se encontró hash en:', data);
      throw new Error('No se encontró hash en la respuesta');
    }
    
    // Responder con éxito
    res.json({
      success: true,
      hash: hash,
      streamName: streamName,
      timestamp: timestamp
    });
    
  } catch (error) {
    console.error('Error detallado:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      streamName: streamName
    });
  }
});

// Manejar 404
app.use((req, res) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    path: req.url
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor proxy TVG corriendo en puerto ${PORT}`);
  console.log(`📍 URL local: http://localhost:${PORT}`);
  console.log(`📡 Endpoint hash: http://localhost:${PORT}/get-hash?streamname=tvg_mbr`);
});
