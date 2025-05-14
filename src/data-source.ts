
import "reflect-metadata";
import { DataSource } from "typeorm";
import * as dotenv from "dotenv";
import { User } from "./entity/User";
import { Product } from "./entity/Product";
import { Escrow } from "./entity/Escrow";
import { EscrowProduct } from "./entity/EscrowProduct";
import { Dispute } from "./entity/Dispute";
import { DisputeComment } from "./entity/DisputeComment";

// Load environment variables
dotenv.config();

export const AppDataSource = new DataSource({
  type: "sqlite",
  database: process.env.DATABASE_PATH || "./escrow-platform.sqlite",
  synchronize: process.env.NODE_ENV === "development", // Only in development
  logging: process.env.NODE_ENV === "development",
  entities: [User, Product, Escrow, EscrowProduct, Dispute, DisputeComment],
  migrations: [__dirname + "/migration/**/*.ts"],
  subscribers: [],
});
