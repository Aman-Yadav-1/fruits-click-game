# Fruits Click Game Dashboard

A real-time dashboard application where admins can manage players and monitor their activity, while players can engage by clicking a "Banana" button and track their ranking in real-time.

## Features

- **User Authentication**: JWT-based authentication system
- **Real-time Updates**: Using Socket.io for live updates
- **Admin Dashboard**: 
  - User management (create, edit, delete, block/unblock)
  - Monitor active users and their banana click counts
- **Player Dashboard**:
  - Click a banana button to increase count
  - View real-time rankings

## Tech Stack

- **Frontend**: React, React Bootstrap, Socket.io Client
- **Backend**: Node.js, Express, Socket.io
- **Database**: MongoDB Atlas

## Quick Start Guide

### Step 1: Install Dependencies

1. Install server dependencies:
   ```
   cd server
   npm install
   ```

2. Install client dependencies:
   ```
   cd client
   npm install
   ```

### Step 2: Initialize the Database

Run the initialization script to create admin and player test accounts:

```
cd server
npm run init-db
```

This will create:
- Admin user: email: `admin@example.com`, password: `admin123`
- Player user: email: `player@example.com`, password: `player123`

### Step 3: Start the Backend Server

```
cd server
npm run dev
```

The server will start on http://localhost:5000

### Step 4: Start the Frontend Application

In a new terminal:

```
cd client
npm start
```

The application will open in your browser at http://localhost:3000

## Troubleshooting

### Authentication Issues

If you encounter authentication issues:

1. Make sure the MongoDB connection string in `.env` is correct
2. Check that the JWT_SECRET in `.env` is properly set
3. Try clearing your browser's local storage and cookies

### MongoDB Connection

The application is configured to use MongoDB Atlas. If you want to use a local MongoDB instance, update the MONGODB_URI in the `.env` file:

```
MONGODB_URI=mongodb://localhost:27017/fruits-click-game
```

### Missing Images

If you see console errors about missing images, they are placeholder files that don't affect functionality.

## Application Structure

### Backend

- `server.js`: Main entry point
- `models/`: Database schemas
- `controllers/`: API logic
- `routes/`: API endpoints
- `middleware/`: Authentication middleware
- `socket/`: Socket.io real-time functionality

### Frontend

- `src/components/`: React components
  - `admin/`: Admin dashboard components
  - `player/`: Player dashboard components
  - `auth/`: Authentication components
  - `layout/`: Common layout components
- `src/contexts/`: React context providers
- `src/utils/`: Utility functions

## License

This project is licensed under the MIT License.
