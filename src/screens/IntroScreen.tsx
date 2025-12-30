import React, { useState, useEffect, useRef } from 'react';
// Importujemy ikony głośnika
import { Volume2, VolumeX } from 'lucide-react'; 

interface IntroScreenProps {
  onFinish: () => void;
}

export default function IntroScreen({ onFinish }: IntroScreenProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Stan wyciszenia (domyślnie true, żeby autoplay zadziałał)
  const [isMuted, setIsMuted] = useState<boolean>(true);
  
  const [canSkip, setCanSkip] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(10);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setCanSkip(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleFinish = () => {
    try {
      localStorage.setItem('hasSeenIntro', 'true');
      if (videoRef.current) {
        videoRef.current.pause();
      }
      onFinish();
    } catch (e) {
      console.log('Błąd zapisu:', e);
      onFinish();
    }
  };

  // Funkcja przełączająca dźwięk
  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  return (
    <div style={styles.container}>
      <div style={styles.videoContainer}>
        <video
          ref={videoRef}
          src="/intro_video.mp4"
          style={styles.video}
          autoPlay
          muted={isMuted} // Sterowane stanem
          playsInline
          loop={false}
        />

        {/* PRZYCISK OD DŹWIĘKU (Nakładka na wideo) */}
        <button 
          onClick={toggleMute}
          style={styles.muteButton}
        >
          {isMuted ? (
            <>
              <VolumeX color="white" size={24} />
              <span style={{ marginLeft: 8, color: 'white', fontWeight: 600 }}>Włącz dźwięk</span>
            </>
          ) : (
             <Volume2 color="white" size={24} />
          )}
        </button>
      </div>

      <div style={styles.contentContainer}>
        <h2 style={styles.title}>Witaj w aplikacji!</h2>
        <p style={styles.subtitle}>
          Zanim zaczniemy, posłuchaj krótkiego wstępu.
        </p>

        {canSkip ? (
          <button style={styles.button} onClick={handleFinish}>
            Przejdź do aplikacji
          </button>
        ) : (
          <div style={styles.disabledButton}>
            <span style={styles.disabledText}>
              Pominiesz za {timeLeft}s
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    height: '100vh',
    backgroundColor: '#000',
    overflow: 'hidden',
  },
  videoContainer: {
    height: '60%',
    width: '100%',
    position: 'relative' as const,
  },
  video: {
    width: '100%',
    height: '100%',
    objectFit: 'cover' as const,
    display: 'block',
  },
  // Nowy styl dla przycisku wyciszania
  muteButton: {
    position: 'absolute' as const,
    bottom: '20px',
    right: '20px',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    border: '1px solid rgba(255,255,255,0.3)',
    borderRadius: '30px',
    padding: '10px 20px',
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
    zIndex: 20,
    transition: 'background 0.3s',
  },
  contentContainer: {
    height: '40%',
    backgroundColor: '#fff',
    borderTopLeftRadius: '24px',
    borderTopRightRadius: '24px',
    marginTop: '-20px',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    zIndex: 10,
    position: 'relative' as const,
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '8px',
    color: '#333',
    marginTop: 0,
    textAlign: 'center' as const,
  },
  subtitle: {
    fontSize: '16px',
    color: '#666',
    textAlign: 'center' as const,
    marginBottom: '30px',
    marginTop: 0,
  },
  button: {
    backgroundColor: '#4CAF50',
    padding: '15px 40px',
    borderRadius: '30px',
    border: 'none',
    color: '#fff',
    fontSize: '18px',
    fontWeight: '600',
    cursor: 'pointer',
    width: '80%',
    maxWidth: '300px',
  },
  disabledButton: {
    padding: '15px 0',
    width: '80%',
    textAlign: 'center' as const,
    cursor: 'not-allowed',
  },
  disabledText: {
    color: '#999',
    fontSize: '14px',
  },
};