import { NextResponse } from "next/server"
import { testConnection } from "@/lib/db"
import mysql from "mysql2/promise"

interface ConnectionResult {
  success: boolean;
  error?: string;
  tables?: any[];
}

export async function GET() {
  try {
    // Test the database connection
    const connectionResult = await testConnection()
    
    // Try a direct connection to verify credentials
    let directConnectionResult: ConnectionResult;
    try {
      const connection = await mysql.createConnection({
        host: process.env.DB_HOST || "localhost",
        user: process.env.DB_USER || "root",
        password: process.env.DB_PASSWORD || "",
        database: process.env.DB_NAME || "tournament_db",
      });
      
      await connection.query("SELECT 1");
      await connection.end();
      directConnectionResult = { success: true };
    } catch (error) {
      directConnectionResult = { 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      };
    }
    
    return NextResponse.json({
      success: true,
      poolConnection: connectionResult,
      directConnection: directConnectionResult,
      environment: process.env.NODE_ENV,
      config: {
        host: process.env.DB_HOST || "localhost",
        user: process.env.DB_USER || "root",
        database: process.env.DB_NAME || "tournament_db",
        hasPassword: !!process.env.DB_PASSWORD,
      }
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: "Database test failed",
      error: error instanceof Error ? error.message : "Unknown error",
    }, { status: 500 })
  }
}