
import "reflect-metadata";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { AppDataSource } from "./data-source";
import routes from "./routes";
import { errorHandler } from "./middleware/errorHandler";
import { setupSwagger } from "./swagger";

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from uploads directory
app.use("/uploads", express.static("uploads"));

// Setup Swagger documentation
setupSwagger(app);

// Routes
app.use("/api", routes);

// Error handling middleware
app.use(errorHandler);

// Initialize database connection and start server
AppDataSource.initialize()
  .then(() => {
    console.log("Data Source has been initialized!");
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`API Documentation available at http://localhost:${PORT}/api-docs`);
    });
  })
  .catch((error) => console.error("Error during Data Source initialization", error));
