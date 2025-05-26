import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { FaBan, FaCog, FaIndustry, FaArrowUp } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import { io } from 'socket.io-client';
import { toast } from 'react-toastify';
import { userAPI } from '../../utils/api';

const PlayerHome = () => {
  const { user, token, updateUser } = useAuth();
  const [socket, setSocket] = useState(null);
  const [bananaCount, setBananaCount] = useState(user?.bananaCount || 0);
  const [isClicking, setIsClicking] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [clickEffects, setClickEffects] = useState([]);
  const [nextEffectId, setNextEffectId] = useState(0);
  
  // Game upgrade states
  const [clickLevel, setClickLevel] = useState(1);
  const [factoryLevel, setFactoryLevel] = useState(0);
  const [multiplierLevel, setMultiplierLevel] = useState(1);
  const [multiplierActive, setMultiplierActive] = useState(false);
  const [multiplierTimeLeft, setMultiplierTimeLeft] = useState(0);
  
  // Prices for upgrades
  const [clickPrice, setClickPrice] = useState(10);
  const [factoryPrice, setFactoryPrice] = useState(20);
  const [multiplierPrice, setMultiplierPrice] = useState(80);
  
  // RGB effect state
  const [rgbColor, setRgbColor] = useState('#ff0000');
  
  // Auto-click timer
  const [autoClickTimer, setAutoClickTimer] = useState(null);
  const [multiplierTimer, setMultiplierTimer] = useState(null);
  
  const bananaRef = useRef(null);
  
  // RGB colors array
  const rgbColors = ['#ff0000', '#00ff00', '#0000ff', '#ff00ff', '#ffff00', '#00ffff'];

  // Initialize socket connection
  useEffect(() => {
    if (!token) return;

    const newSocket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000', {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    newSocket.on('connect', () => {
      console.log('Socket connected');
      setSocketConnected(true);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setSocketConnected(false);
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
      setSocketConnected(false);
    });

    newSocket.on('banana-count-updated', (data) => {
      console.log('Banana count updated:', data);
      setBananaCount(data.bananaCount);
      
      // Update user in auth context
      if (user) {
        updateUser({
          ...user,
          bananaCount: data.bananaCount
        });
      }
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
      
      // Clear timers
      if (autoClickTimer) {
        clearInterval(autoClickTimer);
      }
      if (multiplierTimer) {
        clearTimeout(multiplierTimer);
      }
    };
  }, [token, user, updateUser, autoClickTimer, multiplierTimer]);
  
  // Setup auto-click based on factory level
  useEffect(() => {
    // Clear existing timer
    if (autoClickTimer) {
      clearInterval(autoClickTimer);
    }
    
    // Only setup auto-click if factory level > 0
    if (factoryLevel > 0) {
      const timer = setInterval(() => {
        // Auto-click based on factory level
        const autoClickAmount = factoryLevel * (multiplierActive ? multiplierLevel : 1);
        
        // Update banana count locally
        setBananaCount(prev => prev + autoClickAmount);
        
        // Add auto-click effect
        setClickEffects(prev => [
          ...prev,
          { 
            id: nextEffectId, 
            x: 150, 
            y: 150, 
            value: `+${autoClickAmount}`,
            color: multiplierActive ? rgbColor : '#ff6b00',
            isAuto: true
          }
        ]);
        setNextEffectId(prev => prev + 1);
        
        // Send to server
        if (socket && socketConnected) {
          socket.emit('banana-click', { amount: autoClickAmount });
        }
      }, 1000); // Auto-click every second
      
      setAutoClickTimer(timer);
    }
    
    return () => {
      if (autoClickTimer) {
        clearInterval(autoClickTimer);
      }
    };
  }, [factoryLevel, multiplierLevel, multiplierActive, socket, socketConnected, nextEffectId, rgbColor]);

  // Clean up click effects after animation
  useEffect(() => {
    const timer = setTimeout(() => {
      if (clickEffects.length > 0) {
        setClickEffects(prev => prev.slice(1));
      }
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [clickEffects]);
  
  // RGB color cycling effect
  useEffect(() => {
    if (multiplierActive) {
      const colorInterval = setInterval(() => {
        // Cycle through RGB colors
        setRgbColor(prevColor => {
          const currentIndex = rgbColors.indexOf(prevColor);
          const nextIndex = (currentIndex + 1) % rgbColors.length;
          return rgbColors[nextIndex];
        });
      }, 200); // Change color every 200ms
      
      return () => clearInterval(colorInterval);
    }
  }, [multiplierActive, rgbColors]);
  
  // Update multiplier timer display
  useEffect(() => {
    if (multiplierActive && multiplierTimeLeft > 0) {
      const interval = setInterval(() => {
        setMultiplierTimeLeft(prev => {
          if (prev <= 0.1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 0.1;
        });
      }, 100);
      
      return () => clearInterval(interval);
    }
  }, [multiplierActive, multiplierTimeLeft]);

  // Handle banana click
  const handleBananaClick = (e) => {
    // Prevent default behavior (text selection)
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (user?.isBlocked) return;
    
    // Show clicking animation
    setIsClicking(true);
    
    // Get click position if we have an event and ref
    let clickPosition = { x: 0, y: 0 };
    if (e && bananaRef.current) {
      const rect = bananaRef.current.getBoundingClientRect();
      clickPosition = {
        x: e.clientX - rect.left - 20, // Offset to center the effect
        y: e.clientY - rect.top - 20
      };
    } else {
      // Default position if no event
      clickPosition = { x: 150, y: 150 };
    }
    
    // Calculate total bananas earned this click
    const bananasEarned = clickLevel * (multiplierActive ? multiplierLevel : 1);
    
    // Add click effect
    setClickEffects(prev => [
      ...prev,
      { 
        id: nextEffectId, 
        x: clickPosition.x, 
        y: clickPosition.y, 
        value: `+${bananasEarned}`,
        color: multiplierActive ? rgbColor : '#ff6b00'
      }
    ]);
    setNextEffectId(prev => prev + 1);
    
    // Manually increment banana count for immediate feedback
    setBananaCount(prevCount => prevCount + bananasEarned);
    
    // Send to server
    if (socket && socketConnected) {
      socket.emit('banana-click', { amount: bananasEarned });
    }
    
    // Visual feedback for click
    setTimeout(() => {
      setIsClicking(false);
    }, 100);
  };
  
  // Handle upgrade purchases
  const handleUpgradeClick = () => {
    if (bananaCount >= clickPrice) {
      // Deduct bananas
      setBananaCount(prev => prev - clickPrice);
      
      // Increase click level
      setClickLevel(prev => prev + 1);
      
      // Increase price for next upgrade
      setClickPrice(prev => Math.floor(prev * 1.5));
      
      toast.success(`Upgraded click to level ${clickLevel + 1}!`);
    } else {
      toast.error('Not enough bananas!');
    }
  };
  
  const handleFactoryUpgrade = () => {
    if (bananaCount >= factoryPrice) {
      // Deduct bananas
      setBananaCount(prev => prev - factoryPrice);
      
      // Increase factory level
      setFactoryLevel(prev => prev + 1);
      
      // Increase price for next upgrade
      setFactoryPrice(prev => Math.floor(prev * 2));
      
      toast.success(`Upgraded factory to level ${factoryLevel + 1}!`);
    } else {
      toast.error('Not enough bananas!');
    }
  };
  
  const handleMultiplierUpgrade = () => {
    if (bananaCount >= multiplierPrice) {
      // Deduct bananas
      setBananaCount(prev => prev - multiplierPrice);
      
      // Increase multiplier level
      const newMultiplierLevel = multiplierLevel + 1;
      setMultiplierLevel(newMultiplierLevel);
      
      // Increase price for next upgrade
      setMultiplierPrice(prev => Math.floor(prev * 2));
      
      // Calculate multiplier duration based on level (1.5s base + 0.5s per level)
      const multiplierDuration = 1.5 + (newMultiplierLevel * 0.5);
      setMultiplierTimeLeft(multiplierDuration);
      
      // Activate multiplier effect
      setMultiplierActive(true);
      
      // Clear any existing multiplier timer
      if (multiplierTimer) {
        clearTimeout(multiplierTimer);
      }
      
      // Set timer to deactivate multiplier after the calculated duration
      const timer = setTimeout(() => {
        setMultiplierActive(false);
        setMultiplierTimeLeft(0);
      }, multiplierDuration * 1000);
      
      setMultiplierTimer(timer);
      
      // Special visual effect for multiplier upgrade
      toast.success(`Multiplier activated for ${multiplierDuration.toFixed(1)}s!`, {
        icon: '🌈'
      });
    } else {
      toast.error('Not enough bananas!');
    }
  };
  
  if (user?.isBlocked) {
    return (
      <Container className="py-5">
        <Card className="text-center p-5 shadow-lg border-0">
          <Card.Body>
            <FaBan className="text-danger mb-3" style={{ fontSize: '4rem' }} />
            <h2>Your account has been blocked</h2>
            <p>Please contact an administrator for assistance.</p>
            <Button variant="outline-secondary" onClick={() => window.location.href = '/login'}>
              Return to Login
            </Button>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  return (
    <div className="banana-game-container">
      {/* Left side - Game area with banana */}
      <div className="game-area">
        <div className="banana-count">{bananaCount}</div>
        
        <div className="banana-container">
          {/* Click effects */}
          {clickEffects.map(effect => (
            <div 
              key={effect.id}
              className="click-effect"
              style={{
                left: `${effect.x}px`,
                top: `${effect.y}px`,
                color: effect.color || '#ff6b00'
              }}
            >
              {effect.value}
            </div>
          ))}
          
          <img 
            ref={bananaRef}
            src="/images/banana.jpg" 
            alt="Banana" 
            className={`banana-image ${isClicking ? 'banana-click' : ''}`}
            onClick={handleBananaClick}
            style={{ 
              cursor: 'pointer',
              userSelect: 'none',
              backgroundColor: '#ffeb3b'
            }}
          />
          
          <div className="click-info">
            <div className="click-value">Each click: +{clickLevel * (multiplierActive ? multiplierLevel : 1)}</div>
            {multiplierActive && (
              <div className="multiplier-timer" style={{ color: rgbColor }}>
                Multiplier active: {multiplierTimeLeft.toFixed(1)}s
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Right side - Upgrades panel */}
      <div className="upgrades-panel">
        {/* Settings button */}
        <div className="settings-button">
          <FaCog size={24} />
        </div>
        
        {/* Click upgrade */}
        <div className="upgrade-item" onClick={handleUpgradeClick}>
          <div className="upgrade-icon">
            <span role="img" aria-label="banana" style={{ fontSize: '40px' }}>🍌</span>
          </div>
          <div className="upgrade-details">
            <div className="upgrade-title">Click</div>
            <div className="upgrade-price">Price: {clickPrice}</div>
            <div className="upgrade-level">Level: {clickLevel}</div>
          </div>
        </div>
        
        {/* Factory upgrade */}
        <div className="upgrade-item" onClick={handleFactoryUpgrade}>
          <div className="upgrade-icon">
            <FaIndustry size={40} />
          </div>
          <div className="upgrade-details">
            <div className="upgrade-title">Factory</div>
            <div className="upgrade-price">Price: {factoryPrice}</div>
            <div className="upgrade-level">Level: {factoryLevel}</div>
          </div>
        </div>
        
        {/* Multiplier upgrade */}
        <div className="upgrade-item" onClick={handleMultiplierUpgrade}>
          <div className="upgrade-icon">
            <FaArrowUp size={40} />
          </div>
          <div className="upgrade-details">
            <div className="upgrade-title">Multiply Upgrades</div>
            <div className="upgrade-price">Price: {multiplierPrice}</div>
            <div className="upgrade-level">Time: {(1.5 + (multiplierLevel * 0.5)).toFixed(1)}s</div>
          </div>
        </div>
        
        {/* Rankings button */}
        <div className="rankings-button">
          <Button 
            variant="warning" 
            href="/player/rankings"
            className="w-100"
          >
            View Rankings
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PlayerHome;
