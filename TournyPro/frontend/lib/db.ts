import mysql from "mysql2/promise"
import * as dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'

// Explicitly load the .env file from the backend directory
const backendEnvPath = path.resolve(process.cwd(), '../backend/.env')
if (fs.existsSync(backendEnvPath)) {
  console.log(`Loading environment from: ${backendEnvPath}`)
  dotenv.config({ path: backendEnvPath })
} else {
  console.warn(`Warning: Backend .env file not found at ${backendEnvPath}`)
}

// Database connection configuration
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "tournament_db",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
}


export interface ConnectionTestResult {
  success: boolean;
  tables?: any[];
  error?: string;
}

export interface InitializationResult {
  success: boolean;
  error?: string;
}

// Log database configuration (without password)
console.log("Database configuration:", {
  ...dbConfig,
  password: dbConfig.password ? "[REDACTED]" : "[EMPTY]",
})

// Create a connection pool
export const pool = mysql.createPool(dbConfig)

// Test the database connection
export async function testConnection(): Promise<ConnectionTestResult> {
  try {
    const connection = await pool.getConnection()
    console.log("Database connection successful")
    
    // Test query to verify database is properly set up
    const [result] = await connection.query("SHOW TABLES")
    console.log("Database tables:", result)
    
    connection.release()
    return { success: true, tables: result as any[] }
  } catch (error) {
    console.error("Database connection failed:", error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown database error" 
    }
  }
}

// Initialize database tables if they don't exist
export async function initializeDatabase(): Promise<InitializationResult> {
  try {
    const connection = await pool.getConnection()
    
    // Check if users table exists
    const [tables] = await connection.query(
      "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users'",
      [dbConfig.database]
    )
    
    if ((tables as any[]).length === 0) {
      console.log("Creating users table...")
      await connection.query(`
        CREATE TABLE users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          email VARCHAR(100) NOT NULL UNIQUE,
          password VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `)
      console.log("Users table created successfully")
    }
    
    // Check if tournaments table exists
    const [tournamentTables] = await connection.query(
      "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'tournaments'",
      [dbConfig.database]
    )
    
    if ((tournamentTables as any[]).length === 0) {
      console.log("Creating tournaments table...")
      await connection.query(`
        CREATE TABLE tournaments (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          date DATE NOT NULL,
          status ENUM('upcoming', 'in-progress', 'completed') DEFAULT 'upcoming',
          created_by INT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
        )
      `)
      console.log("Tournaments table created successfully")
      
      // Create participants table
      await connection.query(`
        CREATE TABLE participants (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          tournament_id INT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE
        )
      `)
      console.log("Participants table created successfully")
      
      // Create matches table
      await connection.query(`
        CREATE TABLE matches (
          id INT AUTO_INCREMENT PRIMARY KEY,
          tournament_id INT NOT NULL,
          round INT NOT NULL,
          position INT NOT NULL,
          participant1_id INT,
          participant2_id INT,
          winner_id INT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
          FOREIGN KEY (participant1_id) REFERENCES participants(id) ON DELETE SET NULL,
          FOREIGN KEY (participant2_id) REFERENCES participants(id) ON DELETE SET NULL,
          FOREIGN KEY (winner_id) REFERENCES participants(id) ON DELETE SET NULL
        )
      `)
      console.log("Matches table created successfully")
      
      // Create indexes for better performance
      await connection.query("CREATE INDEX idx_tournaments_created_by ON tournaments(created_by)")
      await connection.query("CREATE INDEX idx_participants_tournament ON participants(tournament_id)")
      await connection.query("CREATE INDEX idx_matches_tournament ON matches(tournament_id)")
      await connection.query("CREATE INDEX idx_matches_participants ON matches(participant1_id, participant2_id)")
      await connection.query("CREATE INDEX idx_matches_winner ON matches(winner_id)")
      console.log("Database indexes created successfully")
    }
    
    connection.release()
    return { success: true }
  } catch (error) {
    console.error("Database initialization failed:", error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown database error" 
    }
  }
}