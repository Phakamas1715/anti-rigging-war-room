// Vercel serverless function entry point
import '../server/_core/index';

// Re-export the Express app for Vercel
export { default } from '../server/_core/index';
