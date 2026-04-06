// import express from 'express';
// import mongoose from 'mongoose';
// import cors from 'cors';
// import dotenv from 'dotenv'; // Add this back for a moment to be safe

// dotenv.config(); // Manually trigger the load

// const app = express();
// app.use(cors());
// app.use(express.json());

// // Log every env variable to see what's actually there
// console.log("--- Environment Check ---");
// console.log("PORT:", process.env.PORT);
// console.log("URI EXISTS?:", !!process.env.MONGODB_URI); 
// console.log("-------------------------");

// const dbURI = process.env.MONGODB_URI;

// if (!dbURI) {
//     console.error("❌ CRITICAL ERROR: MONGODB_URI is undefined.");
//     console.log("Check if your .env file is in: " + process.cwd());
// } else {
//     mongoose.connect(dbURI)
//         .then(() => console.log("✅ FinanTra Database Connected"))
//         .catch(err => console.error("❌ Connection Error:", err.message));
// }

// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import mongoose from 'mongoose';
import authRoutes from './routes/auth.routes.js';

dotenv.config();

const app = express();

app.use(cors({ origin: 'http://localhost:5500' }));
app.use(express.json());

console.log("--- Environment Check ---");
console.log("PORT:", process.env.PORT);
console.log("URI EXISTS?:", !!process.env.MONGODB_URI);
console.log("-------------------------");

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ FinanTra Database Connected'))
  .catch(err => console.error('❌ Connection Error:', err.message));

app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'FinanTra backend is running!' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));