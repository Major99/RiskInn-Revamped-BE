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

async function connectToMongoDB() { 
  console.log("Attempting to connect to MongoDB...");
  try {
    const conn = await connect(process.env.MONGODB_URI, {});
    console.log("MongoDB connected successfully.");
  } catch (error) {
    // This console.error is for your Vercel logs
    console.error("MongoDB Connection Failure:", error.message); // More concise for logs
    // console.error(error); // You can log the full error object for more details during debugging
    process.exit(1); // Crucial: Exit if DB connection fails, Vercel will restart
  }
}
connectToMongoDB();

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