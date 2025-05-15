import express from 'express';
import dotenv from 'dotenv';
if (process.env.NODE_ENV !== 'production') {
  const result = dotenv.config(); 
  if (result.error) {
    // In development, it's useful to know if the .env file is missing or malformed
    console.error("Warning: Error loading .env file in development:", result.error.message);
    // You might choose to throw result.error here only in a non-production setup if a .env file is critical for local dev
  }
}
import cors from 'cors'; 
import uploadRoutes from './routes/uploadRoutes.js';
import authRoutes from './routes/authRoutes.js'; 
import contactRoutes from './routes/contactRoutes.js'; 
import courseContactDataRoutes from './routes/coursesContactRoutes.js'; 
import { errorHandler, notFound } from './middleware/errorMiddleware.js';
import { connect } from 'mongoose';

// connectDB();

  try {
    const conn = await connect(process.env.MONGODB_URI, {});

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1); // Exit process with failure
  }

const app = express();

const allowedOrigins = ['http://localhost:3000','https://risk-inn-revamped-23.vercel.app', 'https://www.riskinn.com']; 

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: false })); 

app.get('/', (req, res) => {
  res.send('Riskinn API Running...');
});


app.use('/api/v1/auth', authRoutes); 
app.use('/api/v1/upload', uploadRoutes);
app.use('/api/v1/submitContactForm', contactRoutes);
app.use('/api/v1/course-contact', courseContactDataRoutes);

const PORT = process.env.PORT || 5000; 

app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(
    `Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`
  );
});