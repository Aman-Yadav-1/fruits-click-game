const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { verifyToken, isAdmin, isPlayer } = require('../middleware/auth.middleware');

// Routes that require authentication
router.use(verifyToken);

// Routes for all authenticated users
router.get('/rankings', userController.getUserRankings);

// Routes for players
router.post('/increment-banana', isPlayer, userController.incrementBananaCount);

// Routes that require admin privileges
router.get('/', isAdmin, userController.getAllUsers);
router.get('/active', isAdmin, userController.getActiveUsers);
router.get('/:id', isAdmin, userController.getUserById);
router.post('/', isAdmin, userController.createUser);
router.put('/:id', isAdmin, userController.updateUser);
router.delete('/:id', isAdmin, userController.deleteUser);
router.patch('/:id/block', isAdmin, userController.toggleBlockUser);

module.exports = router;
