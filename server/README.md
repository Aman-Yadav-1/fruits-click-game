# Fruits Click Game Server Deployment Guide

This guide will help you deploy your Fruits Click Game server and connect it with your Vercel-deployed client.

## Deployment Options

You have several options for deploying your Node.js server:

### 1. Render.com (Recommended)

1. Create an account on [Render](https://render.com/)
2. Click "New" and select "Web Service"
3. Connect your GitHub repository or upload your code directly
4. Configure your service:
   - Name: `fruits-click-game-server`
   - Runtime: `Node`
   - Build Command: `npm install`
   - Start Command: `node server.js`
   - Select the free plan
5. Under "Environment Variables", add all the variables from your `.env.production` file
6. Click "Create Web Service"

### 2. Railway.app

1. Create an account on [Railway](https://railway.app/)
2. Create a new project and select "Deploy from GitHub"
3. Configure your service with the same environment variables as above
4. Deploy your application

### 3. Heroku

1. Create an account on [Heroku](https://heroku.com/)
2. Install the Heroku CLI and login
3. Navigate to your server directory and run:
   ```
   heroku create fruits-click-game-server
   git add .
   git commit -m "Prepare for Heroku deployment"
   git push heroku master
   ```
4. Set your environment variables:
   ```
   heroku config:set MONGODB_URI=your_mongodb_uri
   heroku config:set JWT_SECRET=your_jwt_secret
   heroku config:set CLIENT_URL=https://fruit-click-game.vercel.app
   ```

## After Deployment

1. Once deployed, note your server URL (e.g., `https://fruits-click-game-server.onrender.com`)
2. Update your Vercel client deployment with the following environment variables:
   - `REACT_APP_API_URL=https://fruits-click-game-server.onrender.com/api`
   - `REACT_APP_SOCKET_URL=https://fruits-click-game-server.onrender.com`

3. To add environment variables to your Vercel deployment:
   - Go to your project on Vercel dashboard
   - Click on "Settings" > "Environment Variables"
   - Add the variables and click "Save"
   - Redeploy your application

## Testing the Connection

After deployment, test your application by:
1. Visiting your Vercel-deployed client
2. Attempting to log in with both admin and regular user credentials
3. Testing the banana clicking functionality
4. Verifying that real-time updates work through Socket.io

## Troubleshooting

If you encounter issues:
1. Check the server logs on your hosting platform
2. Verify that CORS is properly configured
3. Ensure all environment variables are set correctly
4. Check that MongoDB connection is working
5. Verify that the client is using the correct API URL

## Local Development

For local development:
1. Use the `.env` file (not `.env.production`)
2. Start the server with `npm run dev`
3. Start the client with `npm start`
4. The client should connect to `http://localhost:5000`
