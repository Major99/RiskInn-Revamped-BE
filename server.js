const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors'); 
const connectDB = require('./config/db');
const uploadRoutes = require('./routes/uploadRoutes');
const authRoutes = require('./routes/authRoutes'); 
const { errorHandler, notFound } = require('./middleware/errorMiddleware');

dotenv.config(); 

connectDB();

const app = express();

const allowedOrigins = ['http://localhost:3000','https://risk-inn-revamped-23.vercel.app']; 

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

const PORT = process.env.PORT || 5000; 

app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(
    `Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`
  );
});