import express from 'express';
import path from 'path'; // Tambahkan ini

const __dirname = path.dirname(new URL(import.meta.url).pathname);

const app = express();
const PORT = 3000;

// Menyajikan file statis dari direktori 'public'
app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
});