import React, { useState, useEffect } from "react";
import Take5FormDesktop from "./Take5FormDesktop";
import Take5FormMobile from "./Take5FormMobile";

function Take5Form({ user, onRedirectHazard, onBack }) {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return isMobile ? (
    <Take5FormMobile
      user={user}
      onRedirectHazard={onRedirectHazard}
      onBack={onBack}
    />
  ) : (
    <Take5FormDesktop user={user} onRedirectHazard={onRedirectHazard} />
  );
}

export default Take5Form;
