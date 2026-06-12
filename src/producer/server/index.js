import express from 'express';
import routes from '../routes/index.js';
import errorHandler from '../middlewares/errorHandler.js';
import cors from 'cors';

const app = express();

const corsOptions = {
  origin: 'http://localhost:5173',
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/file', express.static('uploads'));
app.use(routes);

app.use(errorHandler);

export default app;
