import React, { useEffect, useState } from 'react';
import styles from '../styles/SuccessAnimation.module.css';

const SuccessAnimation = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.circleContainer}>
        <svg className={styles.progressRing} viewBox="0 0 100 100">
          <circle
            className={styles.ringBackground}
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="#e0e0e0"
            strokeWidth="6"
          />
          <circle
            className={`${styles.ringProgress} ${isVisible ? styles.animate : ''}`}
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="#4CAF50"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 45}`}
            strokeDashoffset={`${2 * Math.PI * 45}`}
          />
        </svg>

        {/* Checkmark icon that appears after ring completes */}
        <div className={`${styles.checkmarkContainer} ${isVisible ? styles.show : ''}`}>
          <svg className={styles.checkmark} viewBox="0 0 52 52">
            <circle
              className={styles.checkmarkCircle}
              cx="26"
              cy="26"
              r="25"
              fill="none"
              stroke="#4CAF50"
              strokeWidth="4"
            />
            <path
              className={styles.checkmarkCheck}
              fill="none"
              stroke="#4CAF50"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M14.1 27.2l7.1 7.2 16.7-16.8"
            />
          </svg>
        </div>
      </div>
      
      <div className={`${styles.successText} ${isVisible ? styles.show : ''}`}>
        <h3>Login Successful!</h3>
        <p>Redirecting...</p>
      </div>
    </div>
  );
};

export default SuccessAnimation;