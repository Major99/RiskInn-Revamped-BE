const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const uploadRoutes = require('./routes/uploadRoutes');

dotenv.config(); 

connectDB();

const app = express();

app.use(express.urlencoded({ extended: false })); 

app.get('/', (req, res) => {
  res.send('Riskinn API Running...');
});


app.use('/api/v1/upload', uploadRoutes); 

const PORT = process.env.PORT || 5000; 

app.listen(PORT, () => {
  console.log(
    `Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`
  );
});