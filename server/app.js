import  express from 'express';
import cors from 'cors';
import morgan from 'morgan'
import cookieParser from 'cookie-parser';
import { config } from 'dotenv'
import userRoutes from './routes/user.routes.js'
import courseRoutes from './routes/course.routes.js'
import paymentRoutes from './routes/payment.routes.js'
import errorMiddleware from './middlerwares/error.Middleware.js';
import miscRoutes from './routes/miscellaneous.routes.js';


config();

const app = express();

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Add this line for handling large files
app.use(express.raw({ limit: '50mb' }));

// ✅ Fix CORS Issue


app.use(cors({
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));



app.use(cookieParser());

app.use(morgan('dev'))

app.use('/ping', function(req, res){
    res.send('/pong') 
})

// routes of 3 modules
app.use('/api/v1/user', userRoutes);
app.use('/api/v1/courses', courseRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1', miscRoutes);


app.all('*',(req, res)=>{
    res.status(404).send('');
});

app.use(errorMiddleware);

app.use((err, req, res, next) => {
  console.error("Global error handler:", err);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

export default app;