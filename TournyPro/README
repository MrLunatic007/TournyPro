# TourneyPro - Tournament Management System

TourneyPro is a full-stack web application for creating and managing competitive tournaments. It features dynamic bracket generation, real-time updates, and comprehensive leaderboards.

## Features

- User authentication and account management
- Tournament creation with customizable participant counts
- Dynamic tournament brackets with interactive match updates
- Leaderboard system to track player performance
- Archive of completed tournaments
- Responsive design for desktop and mobile

## Tech Stack

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes
- **Database**: MySQL
- **Authentication**: JWT (JSON Web Tokens)

## Prerequisites

- Node.js 18+ and npm
- MySQL 5.7+ or MySQL 8.0+

## Installation

1. Clone the repository:

2. Install dependencies:


3. Create a `.env.local` file in the root directory with the following variables:

# Database Configuration

DB_HOST=localhost

DB_USER=your_mysql_username

DB_PASSWORD=your_mysql_password

DB_NAME=tournament_db

# JWT Configuration

JWT_SECRET=your_jwt_secret_key

# Next.js Configuration

NEXT_PUBLIC_API_URL=[http://localhost:3000/api](http://localhost:3000/api)


4. Set up the database:
- Create a MySQL database named `tournament_db`
- The application will automatically create the required tables on first run
- Alternatively, visit `/setup` in your browser after starting the application

5. Start the development server:


6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Production Deployment

### Deploying to Vercel

1. Push your code to a GitHub repository
2. Import the project in Vercel
3. Configure the environment variables in the Vercel dashboard
4. Deploy

### Manual Deployment

1. Build the application:

npm run build

2. Start the production server:

npm start

## Database Setup

The application requires a MySQL database. You can set up the database in two ways:

1. **Automatic Setup**: Visit `/setup` in your browser after starting the application
2. **Manual Setup**: Run the SQL commands in `database.sql` to create the required tables

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_HOST` | MySQL database host | `localhost` |
| `DB_USER` | MySQL database user | `root` |
| `DB_PASSWORD` | MySQL database password | `` |
| `DB_NAME` | MySQL database name | `tournament_db` |
| `JWT_SECRET` | Secret key for JWT tokens | `your_jwt_secret` |
| `NEXT_PUBLIC_API_URL` | URL for API endpoints | `http://localhost:3000/api` |

## License

This project is licensed under the MIT License - see the LICENSE file for details.

