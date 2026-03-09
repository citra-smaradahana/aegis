import React, { useState, useEffect } from 'react';
import HazardFormDesktop from './HazardFormDesktop';
import HazardFormMobile from './HazardFormMobile';

function HazardForm({ user, onBack, onNavigate, tasklistTodoCount = 0 }) {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isMobile ? (
    <HazardFormMobile user={user} onBack={onBack} onNavigate={onNavigate} tasklistTodoCount={tasklistTodoCount} />
  ) : (
    <HazardFormDesktop user={user} />
  );
}

export default HazardForm;
