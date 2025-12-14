import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Camera, EyeOff } from 'lucide-react';

interface CameraFeedProps {
  onFrameCapture: (base64: string) => void;
  isActive: boolean;
  intervalMs?: number;
}

export const CameraFeed: React.FC<CameraFeedProps> = ({ onFrameCapture, isActive, intervalMs = 4000 }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [streamActive, setStreamActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } // Prefer back camera for assistance
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setStreamActive(true);
        setError(null);
      }
    } catch (err) {
      console.error("Camera access denied:", err);
      setError("Camera access denied or unavailable.");
    }
  };

  const captureFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !streamActive) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (context) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const base64 = canvas.toDataURL('image/jpeg', 0.8);
      onFrameCapture(base64);
    }
  }, [streamActive, onFrameCapture]);

  useEffect(() => {
    startCamera();
    return () => {
      // Cleanup stream
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    let intervalId: number;
    if (isActive && streamActive) {
      // Initial capture
      captureFrame(); 
      // Loop
      intervalId = window.setInterval(captureFrame, intervalMs);
    }
    return () => clearInterval(intervalId);
  }, [isActive, streamActive, intervalMs, captureFrame]);

  return (
    <div className="relative w-full h-full min-h-[300px] bg-black rounded-lg overflow-hidden border border-jarvis-blue/30 shadow-[0_0_20px_rgba(0,243,255,0.1)]">
      {error ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-red-500">
          <EyeOff size={48} className="mb-2" />
          <p>{error}</p>
        </div>
      ) : (
        <>
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted 
            className="w-full h-full object-cover opacity-80"
          />
          <canvas ref={canvasRef} className="hidden" />
          
          {/* HUD Overlay */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Corners */}
            <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-jarvis-blue"></div>
            <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-jarvis-blue"></div>
            <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-jarvis-blue"></div>
            <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-jarvis-blue"></div>
            
            {/* Scanning Line (Only if active) */}
            {isActive && (
              <div className="absolute top-0 left-0 w-full h-1 bg-jarvis-blue shadow-[0_0_10px_#00f3ff] animate-scan opacity-50"></div>
            )}
            
            <div className="absolute bottom-2 right-4 text-xs font-mono text-jarvis-blue">
              VIDEO_FEED_ACTIVE // {streamActive ? 'ONLINE' : 'OFFLINE'}
            </div>
          </div>
        </>
      )}
    </div>
  );
};