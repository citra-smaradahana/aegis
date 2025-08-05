import React, { useState, useEffect } from 'react';
import ProfileMobile from './ProfileMobile';
import ProfileDesktop from './ProfileDesktop';

function Profile({ user, onClose, onBack, onLogout }) {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (isMobile) {
    return (
      <ProfileMobile
        user={user}
        onClose={onClose}
        onBack={onBack}
        onLogout={onLogout}
      />
    );
  }

  return <ProfileDesktop user={user} onClose={onClose} onLogout={onLogout} />;
}

export default Profile;
