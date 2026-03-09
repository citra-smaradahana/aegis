import React, { useState, useEffect } from 'react';
import TasklistFormSubmit from './TasklistFormSubmit';
import TasklistFormSubmitMobile from './TasklistFormSubmitMobile';
import TasklistFormOpen from './TasklistFormOpen';
import TasklistFormOpenMobile from './TasklistFormOpenMobile';
import TasklistFormRejectAtOpen from './TasklistFormRejectAtOpen';
import TasklistFormRejectAtOpenMobile from './TasklistFormRejectAtOpenMobile';
import TasklistFormProgress from './TasklistFormProgress';
import TasklistFormProgressMobile from './TasklistFormProgressMobile';
import TasklistFormDone from './TasklistFormDone';
import TasklistFormDoneMobile from './TasklistFormDoneMobile';
import TasklistFormRejectAtDone from './TasklistFormRejectAtDone';
import TasklistFormRejectAtDoneMobile from './TasklistFormRejectAtDoneMobile';
import TasklistFormClosed from './TasklistFormClosed';
import TasklistFormClosedMobile from './TasklistFormClosedMobile';

function TasklistForm({ user, status, hazard, readOnly, onClose, onSuccess, embedded }) {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Render form sesuai status dan device
  if (status === 'Submit') {
    return isMobile ? (
      <TasklistFormSubmitMobile
        user={user}
        hazard={hazard}
        readOnly={readOnly}
        onClose={onClose}
        onSuccess={onSuccess}
        embedded={embedded}
      />
    ) : (
      <TasklistFormSubmit
        user={user}
        hazard={hazard}
        readOnly={readOnly}
        onClose={onClose}
        onSuccess={onSuccess}
      />
    );
  }

  if (status === 'Open') {
    return isMobile ? (
      <TasklistFormOpenMobile
        user={user}
        hazard={hazard}
        readOnly={readOnly}
        onClose={onClose}
        onSuccess={onSuccess}
        embedded={embedded}
      />
    ) : (
      <TasklistFormOpen
        user={user}
        hazard={hazard}
        readOnly={readOnly}
        onClose={onClose}
        onSuccess={onSuccess}
      />
    );
  }

  if (status === 'Reject at Open') {
    return isMobile ? (
      <TasklistFormRejectAtOpenMobile
        user={user}
        hazard={hazard}
        readOnly={readOnly}
        onClose={onClose}
        onSuccess={onSuccess}
        embedded={embedded}
      />
    ) : (
      <TasklistFormRejectAtOpen
        user={user}
        hazard={hazard}
        readOnly={readOnly}
        onClose={onClose}
        onSuccess={onSuccess}
      />
    );
  }

  if (status === 'Progress') {
    return isMobile ? (
      <TasklistFormProgressMobile
        user={user}
        hazard={hazard}
        readOnly={readOnly}
        onClose={onClose}
        onSuccess={onSuccess}
        embedded={embedded}
      />
    ) : (
      <TasklistFormProgress
        user={user}
        hazard={hazard}
        readOnly={readOnly}
        onClose={onClose}
        onSuccess={onSuccess}
      />
    );
  }

  if (status === 'Done') {
    return isMobile ? (
      <TasklistFormDoneMobile
        user={user}
        hazard={hazard}
        readOnly={readOnly}
        onClose={onClose}
        onSuccess={onSuccess}
        embedded={embedded}
      />
    ) : (
      <TasklistFormDone
        user={user}
        hazard={hazard}
        readOnly={readOnly}
        onClose={onClose}
        onSuccess={onSuccess}
      />
    );
  }

  if (status === 'Reject at Done') {
    return isMobile ? (
      <TasklistFormRejectAtDoneMobile
        user={user}
        hazard={hazard}
        readOnly={readOnly}
        onClose={onClose}
        onSuccess={onSuccess}
        embedded={embedded}
      />
    ) : (
      <TasklistFormRejectAtDone
        user={user}
        hazard={hazard}
        readOnly={readOnly}
        onClose={onClose}
        onSuccess={onSuccess}
      />
    );
  }

  if (status === 'Closed') {
    return isMobile ? (
      <TasklistFormClosedMobile
        user={user}
        hazard={hazard}
        readOnly={true}
        onClose={onClose}
        onSuccess={onSuccess}
      />
    ) : (
      <TasklistFormClosed hazard={hazard} readOnly={true} onClose={onClose} />
    );
  }

  // Default fallback
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <p>Status tidak valid: {status}</p>
    </div>
  );
}

export default TasklistForm;
