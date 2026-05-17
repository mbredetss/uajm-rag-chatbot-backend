import 'dotenv/config';
import fs from 'fs';
import { uploadDir } from './middlewares/uploadMiddleware.js';
import app from './server/index.js';

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Server berjalan di http://localhost:${port}`);
});
