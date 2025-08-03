import React, { useEffect, useRef } from 'react';

const MobileBackGesture = ({ onBack, children }) => {
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const isBackGesture = useRef(false);

  useEffect(() => {
    const handleTouchStart = (e) => {
      // Only handle touch on the left edge of the screen (first 50px)
      if (e.touches[0].clientX <= 50) {
        touchStartX.current = e.touches[0].clientX;
        touchStartY.current = e.touches[0].clientY;
        isBackGesture.current = true;
      } else {
        isBackGesture.current = false;
      }
    };

    const handleTouchMove = (e) => {
      if (!isBackGesture.current) return;

      const touchX = e.touches[0].clientX;
      const touchY = e.touches[0].clientY;
      const deltaX = touchX - touchStartX.current;
      const deltaY = Math.abs(touchY - touchStartY.current);

      // Check if it's a horizontal swipe (not vertical)
      if (deltaY > 100) {
        isBackGesture.current = false;
        return;
      }

      // Prevent default scrolling during back gesture
      if (deltaX > 20) {
        e.preventDefault();
      }
    };

    const handleTouchEnd = (e) => {
      if (!isBackGesture.current) return;

      const touchX = e.changedTouches[0].clientX;
      const deltaX = touchX - touchStartX.current;

      // Trigger back if swipe distance is sufficient (at least 100px)
      if (deltaX > 100) {
        onBack();
      }

      isBackGesture.current = false;
    };

    // Add event listeners
    document.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [onBack]);

  return <>{children}</>;
};

export default MobileBackGesture; 