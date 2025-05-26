import React, { useState, useEffect } from 'react';
import { Container, Table, Badge, Card, Row, Col } from 'react-bootstrap';
import { useAuth } from '../../contexts/AuthContext';
import { io } from 'socket.io-client';
import { FaTrophy, FaMedal, FaStar, FaUser, FaArrowUp, FaArrowDown } from 'react-icons/fa';
import { GiBanana } from 'react-icons/gi';

const PlayerRankings = () => {
  const { user, token } = useAuth();
  const [socket, setSocket] = useState(null);
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Initialize socket connection
  useEffect(() => {
    if (!token) return;

    const newSocket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000', {
      auth: { token }
    });

    newSocket.on('connect', () => {
      console.log('Socket connected for rankings');
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setLoading(false);
    });

    // Listen for rankings updates
    newSocket.on('rankings-updated', (data) => {
      setRankings(data);
      setLoading(false);
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, [token]);

  // Get rank badge based on position
  const getRankBadge = (index) => {
    switch (index) {
      case 0:
        return <FaTrophy className="text-warning" style={{ fontSize: '1.5rem' }} title="1st Place" />;
      case 1:
        return <FaMedal className="text-silver" style={{ fontSize: '1.4rem', color: '#C0C0C0' }} title="2nd Place" />;
      case 2:
        return <FaMedal className="text-bronze" style={{ fontSize: '1.3rem', color: '#CD7F32' }} title="3rd Place" />;
      default:
        return <span className="rank-number">{index + 1}</span>;
    }
  };

  // Check if a user is the current logged-in user
  const isCurrentUser = (rankUser) => {
    return user && rankUser._id === user.id;
  };

  return (
    <Container className="py-5">
      <Card className="shadow rankings-card">
        <Card.Body className="p-4">
          <div className="text-center mb-4">
            <GiBanana className="rankings-logo" style={{ fontSize: '60px', color: '#FFD700' }} />
            <h2 className="rankings-title">
              <FaTrophy className="text-warning me-2" />
              Banana Click Rankings
            </h2>
            <p className="text-muted">Who will be the ultimate banana clicker?</p>
          </div>
          
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-warning" style={{ width: '3rem', height: '3rem' }} role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-3 text-muted">Gathering the latest rankings...</p>
            </div>
          ) : (
            <div className="rankings-table-container">
              {rankings.length > 0 ? (
                <>
                  {/* Top 3 Players Highlight */}
                  {rankings.length >= 3 && (
                    <Row className="top-players-row mb-4">
                      {/* First Place */}
                      <Col xs={12} md={4} className="mb-3 mb-md-0">
                        <Card className="text-center h-100 top-player-card first-place">
                          <Card.Body>
                            <div className="position-relative">
                              <FaTrophy className="position-absolute top-0 start-50 translate-middle" 
                                style={{ fontSize: '2.5rem', color: '#FFD700', marginTop: '-15px' }} />
                              <div className="player-avatar first-place-avatar">
                                <FaUser />
                              </div>
                            </div>
                            <h5 className="mt-3">{rankings[0].username}</h5>
                            <div className="d-flex justify-content-center align-items-center">
                              <GiBanana className="me-1 text-warning" />
                              <span className="fw-bold">{rankings[0].bananaCount}</span>
                            </div>
                            {isCurrentUser(rankings[0]) && (
                              <Badge bg="primary" pill className="position-absolute top-0 end-0 m-2">You</Badge>
                            )}
                          </Card.Body>
                        </Card>
                      </Col>
                      {/* Second Place */}
                      <Col xs={12} md={4} className="mb-3 mb-md-0">
                        <Card className="text-center h-100 top-player-card second-place">
                          <Card.Body>
                            <div className="position-relative">
                              <FaMedal className="position-absolute top-0 start-50 translate-middle" 
                                style={{ fontSize: '2rem', color: '#C0C0C0', marginTop: '-10px' }} />
                              <div className="player-avatar second-place-avatar">
                                <FaUser />
                              </div>
                            </div>
                            <h5 className="mt-3">{rankings[1].username}</h5>
                            <div className="d-flex justify-content-center align-items-center">
                              <GiBanana className="me-1 text-warning" />
                              <span className="fw-bold">{rankings[1].bananaCount}</span>
                            </div>
                            {isCurrentUser(rankings[1]) && (
                              <Badge bg="primary" pill className="position-absolute top-0 end-0 m-2">You</Badge>
                            )}
                          </Card.Body>
                        </Card>
                      </Col>
                      
                      {/* First Place */}
                      <Col xs={12} md={4} className="mb-3 mb-md-0">
                        <Card className="text-center h-100 top-player-card first-place" style={{ transform: 'scale(1.05)', zIndex: 1 }}>
                          <Card.Body>
                            <div className="position-relative">
                              <FaTrophy className="position-absolute top-0 start-50 translate-middle" 
                                style={{ fontSize: '2.5rem', color: '#FFD700', marginTop: '-15px' }} />
                              <div className="player-avatar first-place-avatar">
                                <FaUser />
                              </div>
                            </div>
                            <h4 className="mt-3">{rankings[0].username}</h4>
                            <div className="d-flex justify-content-center align-items-center">
                              <GiBanana className="me-1 text-warning" style={{ fontSize: '1.2rem' }} />
                              <span className="fw-bold fs-5">{rankings[0].bananaCount}</span>
                            </div>
                            {isCurrentUser(rankings[0]) && (
                              <Badge bg="primary" pill className="position-absolute top-0 end-0 m-2">You</Badge>
                            )}
                          </Card.Body>
                        </Card>
                      </Col>
                      
                      {/* Third Place */}
                      <Col xs={12} md={4} className="mb-3 mb-md-0">
                        <Card className="text-center h-100 top-player-card third-place">
                          <Card.Body>
                            <div className="position-relative">
                              <FaMedal className="position-absolute top-0 start-50 translate-middle" 
                                style={{ fontSize: '1.8rem', color: '#CD7F32', marginTop: '-10px' }} />
                              <div className="player-avatar third-place-avatar">
                                <FaUser />
                              </div>
                            </div>
                            <h5 className="mt-3">{rankings[2].username}</h5>
                            <div className="d-flex justify-content-center align-items-center">
                              <GiBanana className="me-1 text-warning" />
                              <span className="fw-bold">{rankings[2].bananaCount}</span>
                            </div>
                            {isCurrentUser(rankings[2]) && (
                              <Badge bg="primary" pill className="position-absolute top-0 end-0 m-2">You</Badge>
                            )}
                          </Card.Body>
                        </Card>
                      </Col>
                    </Row>
                  )}
                  
                  {/* Rest of the Players */}
                  <Table hover responsive className="rankings-table">
                    <thead>
                      <tr className="table-header">
                        <th width="10%" className="text-center">Rank</th>
                        <th width="50%">Player</th>
                        <th width="40%" className="text-end">Banana Clicks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rankings.slice(3).map((rankUser, index) => {
                        const actualIndex = index + 3; // Adjust for slicing
                        return (
                          <tr 
                            key={rankUser._id}
                            className={`ranking-row ${isCurrentUser(rankUser) ? 'current-user-row' : ''}`}
                          >
                            <td className="align-middle text-center">
                              <div className="rank-badge">
                                {getRankBadge(actualIndex)}
                              </div>
                            </td>
                            <td className="align-middle">
                              <div className="d-flex align-items-center">
                                <div className="player-icon me-2">
                                  <FaUser className="text-secondary" />
                                </div>
                                <div>
                                  {rankUser.username}
                                  {isCurrentUser(rankUser) && (
                                    <Badge bg="primary" pill className="ms-2">You</Badge>
                                  )}
                                  {rankUser.isActive && (
                                    <Badge bg="success" pill className="ms-2">Online</Badge>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="align-middle text-end fw-bold">
                              <div className="d-flex align-items-center justify-content-end">
                                <GiBanana className="me-1 text-warning" />
                                {rankUser.bananaCount}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </Table>
                </>
              ) : (
                <div className="text-center py-5 empty-rankings">
                  <GiBanana style={{ fontSize: '3rem', color: '#FFD700', opacity: '0.5' }} />
                  <p className="mt-3 mb-0">No rankings available yet.</p>
                  <p className="text-muted">Start clicking bananas to climb the leaderboard!</p>
                </div>
              )}
            </div>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default PlayerRankings;
