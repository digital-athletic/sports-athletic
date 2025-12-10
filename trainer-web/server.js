// Currently needed for deployments with scalingo to serve the static files
import express from 'express';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

var app = express();
app.use(express.static(join(__dirname, 'dist')));

app.get('*path', (req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

var port = process.env.PORT || 3000;
app.listen(port, function () {
  console.log('Listening on', port);
});
