
import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

export const pool = new Pool({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: Number(process.env.PG_PORT),
});

// Handle unexpected errors without crashing the app
pool.on("error", (err) => {
  console.error("Unexpected error on idle client", err);
  // do NOT exit process; just log
});


export const query = (text, params) => pool.query(text, params);
