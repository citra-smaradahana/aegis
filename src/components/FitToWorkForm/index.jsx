import React, { useState, useEffect } from 'react';
import FitToWorkFormDesktop from './FitToWorkFormDesktop';
import FitToWorkFormMobile from './FitToWorkFormMobile';

function FitToWorkForm({ user, onBack }) {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isMobile ? (
    <FitToWorkFormMobile user={user} onBack={onBack} />
  ) : (
    <FitToWorkFormDesktop user={user} />
  );
}

export default FitToWorkForm;
