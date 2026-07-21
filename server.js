const express = require('express');
const fetch = require('node-fetch');
const app = express();
const PORT = process.env.PORT || 3000;

// Permitir CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', '*');
  next();
});

// Ruta principal para obtener el hash
app.get('/get-hash', async (req, res) => {
  const streamName = req.query.streamname || 'tvg_mbr';
  const timestamp = Math.floor(Date.now() / 1000);
  
  const url = `https://service.tvg.com/rcn/v1/generateHash?timestamp=${timestamp}&streamname=${streamName}`;
  
  console.log(`Solicitando hash para: ${streamName}`);
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9,es;q=0.8',
        'Cookie': 'tvg-session-id=99d93e6635ce621bdb4d01f12556e4c73ea5dd015565375096b1894b05ee27e2;',
        'Origin': 'https://www.tvg.com',
        'Referer': 'https://www.tvg.com/',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Hash obtenido exitosamente:', data);
    
    res.json({
      success: true,
      hash: data.hash,
      streamName: streamName,
      timestamp: timestamp
    });
    
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    message: 'TVG Proxy Server funcionando',
    endpoints: {
      getHash: '/get-hash?streamname=NOMBRE_DEL_CANAL'
    }
  });
});

app.listen(PORT, () => {
  console.log(`Servidor proxy TVG corriendo en puerto ${PORT}`);
});
