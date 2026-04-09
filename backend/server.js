// import express from 'express';
// import dotenv from 'dotenv';
// import cors from 'cors';
// import mongoose from 'mongoose';

// // --- ROUTE IMPORTS ---
// import authRoutes from './routes/auth.routes.js'; 
// import transactionRoutes from './routes/transaction.routes.js';
// import budgetRoutes from './routes/budget.routes.js';           
// import goalRoutes from './routes/goal.routes.js';               // <-- Added Goals
// import profileRoutes from './routes/profile.routes.js';         // <-- Added Profile

// dotenv.config();

// const app = express();

// // Set CORS for your frontend
// app.use(cors({ origin: 'http://localhost:5500' }));
// app.use(express.json());

// console.log("--- Environment Check ---");
// console.log("PORT:", process.env.PORT);
// console.log("URI EXISTS?:", !!process.env.MONGODB_URI);
// console.log("-------------------------");

// const dbURI = process.env.MONGODB_URI;

// if (!dbURI) {
//     console.error("❌ CRITICAL ERROR: MONGODB_URI is undefined.");
// } else {
//     mongoose.connect(dbURI)
//         .then(() => console.log('✅ FinanTra Database Connected'))
//         .catch(err => console.error('❌ Connection Error:', err.message));
// }

// // --- API ROUTES ---
// app.use('/api/auth', authRoutes);
// app.use('/api/transactions', transactionRoutes); 
// app.use('/api/budget', budgetRoutes);            
// app.use('/api/goals', goalRoutes);               // <-- Connected Goals
// app.use('/api/profile', profileRoutes);          // <-- Connected Profile

// app.get('/', (req, res) => {
//   res.json({ message: 'FinanTra backend is running!' });
// });

// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import mongoose from 'mongoose';

// --- ROUTE IMPORTS ---
import authRoutes from './routes/auth.routes.js'; 
import transactionRoutes from './routes/transaction.routes.js';
import budgetRoutes from './routes/budget.routes.js';           
import goalRoutes from './routes/goal.routes.js';               
import profileRoutes from './routes/profile.routes.js';         

dotenv.config();

const app = express();

// --- MIDDLEWARE ---
// Allowing all origins for easy deployment to Vercel
app.use(cors());
app.use(express.json());

console.log("--- Environment Check ---");
console.log("PORT:", process.env.PORT);
console.log("URI EXISTS?:", !!process.env.MONGODB_URI);
console.log("-------------------------");

// --- DATABASE CONNECTION ---
const dbURI = process.env.MONGODB_URI;

if (!dbURI) {
    console.error("❌ CRITICAL ERROR: MONGODB_URI is undefined.");
} else {
    mongoose.connect(dbURI)
        .then(() => console.log('✅ FinanTra Database Connected'))
        .catch(err => console.error('❌ Connection Error:', err.message));
}

// --- API ROUTES ---
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes); 
app.use('/api/budget', budgetRoutes);            
app.use('/api/goals', goalRoutes);               
app.use('/api/profile', profileRoutes);          

// --- HEALTH CHECK ROUTE ---
app.get('/', (req, res) => {
  res.json({ message: 'FinanTra backend is successfully running in the cloud! ☁️' });
});

// --- START SERVER ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));