import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './HomepagePopup.css';

const HomepagePopup = () => {
  const [popup, setPopup] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    const fetchActivePopup = async () => {
      try {
        const response = await axios.get('/api/popup-announcements/active');
        if (response.data.success && response.data.data) {
          const popupData = response.data.data;
          
          const dismissedKey = `popup_dismissed_${popupData._id}`;
          const dismissedTime = localStorage.getItem(dismissedKey);
          
          if (dismissedTime) {
            const dismissedDate = new Date(parseInt(dismissedTime));
            const hoursSinceDismissed = (new Date() - dismissedDate) / (1000 * 60 * 60);
            
            if (hoursSinceDismissed < 24) {
              return;
            }
          }
          
          setPopup(popupData);
          setTimeout(() => setIsVisible(true), 500);
        }
      } catch (error) {
        console.error('Error fetching popup:', error);
      }
    };

    fetchActivePopup();
  }, []);

  const handleClose = () => {
    setIsClosing(true);
    
    if (popup) {
      localStorage.setItem(`popup_dismissed_${popup._id}`, Date.now().toString());
    }
    
    setTimeout(() => {
      setIsVisible(false);
      setPopup(null);
    }, 300);
  };

  const handleOverlayClick = (e) => {
    if (e.target.classList.contains('homepage-popup-overlay')) {
      handleClose();
    }
  };

  if (!popup || !isVisible) return null;

  return (
    <div 
      className={`homepage-popup-overlay ${isClosing ? 'closing' : ''}`}
      onClick={handleOverlayClick}
    >
      <div className={`homepage-popup-content ${isClosing ? 'closing' : ''}`}>
        <button className="homepage-popup-close" onClick={handleClose}>
          ×
        </button>
        
        {popup.image && (
          <div className="homepage-popup-image">
            <img src={`/uploads/popups/${popup.image}`} alt={popup.title} />
          </div>
        )}
        
        <div className="homepage-popup-body">
          <h2 className="homepage-popup-title">{popup.title}</h2>
          
          {popup.text && (
            <p className="homepage-popup-text">{popup.text}</p>
          )}
          
          {popup.link && (
            <a 
              href={popup.link} 
              target="_blank" 
              rel="noopener noreferrer"
              className="homepage-popup-link"
            >
              {popup.linkText || 'Learn More'}
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomepagePopup;
