import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeftIcon, CameraOffIcon, CameraIcon, InfoIcon } from './icons';

interface CameraInputProps {
  onAnalyze: (base64Image: string) => void;
  onBack: () => void;
}

export const CameraInput: React.FC<CameraInputProps> = ({ onAnalyze, onBack }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isCameraInitializing, setIsCameraInitializing] = useState(true);
  const [showMobileGuidelines, setShowMobileGuidelines] = useState(false);
  const [needsManualStart, setNeedsManualStart] = useState(false);

  // Function to stop all tracks
  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
          track.stop();
      });
      streamRef.current = null;
    }
  };

  const startCamera = async () => {
      stopStream();
      setError(null);
      setIsCameraInitializing(true);
      setNeedsManualStart(false);

      // 1. Check for Secure Context
      if (typeof window !== 'undefined' && window.isSecureContext === false) {
          setError("Camera requires a secure context (HTTPS/Localhost).");
          setIsCameraInitializing(false);
          return;
      }

      // 2. Check API support
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          setError("Camera API not supported in this browser.");
          setIsCameraInitializing(false);
          return;
      }

      try {
          // Helper to try constraints sequentially
          const getStream = async () => {
              const constraintsList = [
                  // 1. Ideal: Environment facing, high res
                  { video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false },
                  // 2. Fallback: Environment facing, any res
                  { video: { facingMode: { ideal: "environment" } }, audio: false },
                  // 3. Fallback: User facing (front camera)
                  { video: { facingMode: "user" }, audio: false },
                  // 4. Last resort: Any video device
                  { video: true, audio: false }
              ];

              for (const constraints of constraintsList) {
                  try {
                      const stream = await navigator.mediaDevices.getUserMedia(constraints);
                      return stream;
                  } catch (e) {
                      // Continue to next constraint
                      console.log(`Constraint failed: ${JSON.stringify(constraints)}`, e);
                  }
              }
              throw new Error("No camera device found.");
          };

          const stream = await getStream();
          
          streamRef.current = stream;
          if (videoRef.current) {
              videoRef.current.srcObject = stream;
              
              // Handle video loading
              videoRef.current.onloadedmetadata = async () => {
                   try {
                       await videoRef.current?.play();
                   } catch (e) {
                       console.error("Autoplay blocked:", e);
                       setNeedsManualStart(true);
                   }
                   setIsCameraInitializing(false);
              };
          }

      } catch (err: any) {
          console.error("Camera Init Error:", err);
          let msg = "Camera unavailable.";
          
          const errorName = err.name;
          const errorMessage = err.message || "";

          if (errorName === 'NotAllowedError' || errorName === 'PermissionDeniedError') {
              msg = "Permission denied. Please allow camera access.";
          } else if (
              errorName === 'NotFoundError' || 
              errorName === 'DevicesNotFoundError' || 
              errorMessage.includes("device not found")
          ) {
              msg = "No camera hardware detected.";
          } else if (errorName === 'NotReadableError' || errorName === 'TrackStartError') {
              msg = "Camera is in use by another app.";
          } else if (errorName === 'OverconstrainedError') {
              msg = "Camera constraints could not be met.";
          } else {
              msg = errorMessage || "Failed to start camera.";
          }
          
          setError(msg);
          setIsCameraInitializing(false);
      }
  };

  useEffect(() => {
    // A small delay helps ensure the previous cleanup is complete and the DOM is ready
    const timer = setTimeout(() => {
        if (!capturedImage) {
            startCamera();
        }
    }, 500);

    return () => {
        clearTimeout(timer);
        stopStream();
    };
  }, [capturedImage]);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current && streamRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      
      if (context) {
        // Draw the current frame to the canvas
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        const base64 = dataUrl.split(',')[1];
        setCapturedImage(base64);
        stopStream(); // Stop camera immediately to save resources
      }
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    // Effect will trigger startCamera
  };
  
  const handleAnalyze = () => {
    if (capturedImage) {
        onAnalyze(capturedImage);
    }
  };

  const guidelinesContent = [
      { title: "Chest Height", desc: "Hold device vertically at chest level" },
      { title: "Full Body", desc: "Ensure feet and head are visible" },
      { title: "Simple Background", desc: "Avoid cluttered surroundings" },
      { title: "Stand Straight", desc: "Arms relaxed by your sides" }
  ];

  const GuidelinesPanel = () => (
      <div className="bg-zinc-900/50 p-8 rounded-[2rem] border border-white/5 h-full flex flex-col justify-center">
          <div className="mb-8">
              <h3 className="text-2xl font-bold text-white mb-2">Instructions</h3>
              <p className="text-zinc-400 text-sm">Follow these steps for the most accurate biometric analysis.</p>
          </div>
          
          <ul className="space-y-6 mb-8">
              {guidelinesContent.map((item, idx) => (
                  <li key={idx} className="flex gap-4">
                      <div className="w-8 h-8 rounded-full bg-brand/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-brand font-bold text-sm">{idx + 1}</span>
                      </div>
                      <div>
                          <p className="text-white font-medium">{item.title}</p>
                          <p className="text-xs text-zinc-500">{item.desc}</p>
                      </div>
                  </li>
              ))}
          </ul>
      </div>
  );

  return (
    <div className="w-full flex flex-col lg:flex-row gap-8 animate-fade-in lg:h-[700px]">
       
       {/* Left Side: Camera Feed */}
       <div className="relative w-full lg:flex-1 bg-black rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl flex flex-col items-center justify-center min-h-[500px] lg:min-h-full">
           <button onClick={onBack} className="absolute top-6 left-6 z-50 bg-black/50 p-3 rounded-full hover:bg-black/70 transition-colors text-white backdrop-blur-md border border-white/10 group">
              <ArrowLeftIcon className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
           </button>

           {error ? (
               <div className="text-center p-8 max-w-sm">
                   <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                       <CameraOffIcon className="w-10 h-10 text-red-500" />
                   </div>
                   <h3 className="text-white text-xl font-bold mb-3">Camera Issue</h3>
                   <p className="text-zinc-500 mb-8">{error}</p>
                   <div className="flex flex-col gap-3">
                        <button onClick={() => startCamera()} className="px-6 py-3 bg-brand text-white font-bold rounded-xl hover:bg-brand/80 transition-colors">
                            Try Again
                        </button>
                        <button onClick={() => window.location.reload()} className="px-6 py-3 bg-zinc-800 text-zinc-400 font-bold rounded-xl hover:bg-zinc-700 transition-colors text-sm">
                            Reload Page
                        </button>
                   </div>
               </div>
           ) : needsManualStart ? (
                <div className="text-center p-8 z-20">
                    <button onClick={() => { videoRef.current?.play(); setNeedsManualStart(false); }} className="w-20 h-20 bg-brand rounded-full flex items-center justify-center animate-pulse shadow-xl shadow-brand/20 hover:scale-105 transition-transform">
                        <span className="text-3xl pl-1">▶</span>
                    </button>
                    <p className="text-white mt-6 font-bold uppercase tracking-widest">Tap to Start Camera</p>
                </div>
           ) : (
               <>
                   {isCameraInitializing && !capturedImage && (
                       <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-zinc-900">
                           <div className="w-16 h-16 border-4 border-brand/20 border-t-brand rounded-full animate-spin mb-6"></div>
                           <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Initializing Sensor...</p>
                       </div>
                   )}

                   <video 
                       ref={videoRef} 
                       playsInline 
                       muted
                       className={`w-full h-full object-cover ${capturedImage ? 'hidden' : 'block'}`}
                   />
                   
                   {/* Overlay guide for camera */}
                   {!capturedImage && !isCameraInitializing && !needsManualStart && (
                        <div className="absolute inset-0 pointer-events-none border border-white/20 m-6 rounded-[2rem] opacity-60 flex flex-col items-center justify-center">
                             <div className="w-full h-px bg-white/20 absolute top-[20%]"></div>
                             <div className="w-full h-px bg-brand/50 absolute top-[10%]"></div> 
                             <div className="absolute bottom-8 px-4 py-2 bg-black/60 backdrop-blur-md rounded-full border border-white/10">
                                <p className="text-[10px] text-white font-bold uppercase tracking-widest flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                    Align Subject
                                </p>
                             </div>
                        </div>
                   )}

                   <canvas ref={canvasRef} className="hidden"></canvas>
                   {capturedImage && <img src={`data:image/jpeg;base64,${capturedImage}`} alt="Captured" className="w-full h-full object-cover"/>}
               </>
           )}
       </div>

       {/* Right Side: Controls & Guidelines */}
       <div className="w-full lg:w-96 flex flex-col gap-4 flex-shrink-0">
           
           {/* Desktop Guidelines */}
           <div className="flex-1 hidden lg:block">
                <GuidelinesPanel />
           </div>

           {/* Mobile Guidelines Toggle */}
           <div className="block lg:hidden">
                <button 
                    onClick={() => setShowMobileGuidelines(!showMobileGuidelines)}
                    className="w-full flex items-center justify-between p-5 bg-zinc-900/80 rounded-2xl border border-white/5 text-left mb-2 hover:bg-zinc-800 transition-colors"
                >
                    <div className="flex items-center gap-3 text-zinc-300">
                         <InfoIcon className="w-5 h-5 text-brand" />
                         <span className="font-bold text-sm">View Guidelines</span>
                    </div>
                    <span className={`text-zinc-500 text-2xl transition-transform ${showMobileGuidelines ? 'rotate-180' : ''}`}>↓</span>
                </button>
                
                {showMobileGuidelines && (
                    <div className="bg-zinc-900/50 p-6 rounded-2xl border border-white/5 mb-4 animate-slide-up">
                        <ul className="space-y-4">
                            {guidelinesContent.map((item, idx) => (
                                <li key={idx} className="flex gap-4">
                                    <div className="w-6 h-6 rounded-full bg-brand/10 flex items-center justify-center flex-shrink-0">
                                        <span className="text-brand font-bold text-xs">{idx + 1}</span>
                                    </div>
                                    <div>
                                        <p className="text-white font-medium">{item.title}</p>
                                        <p className="text-xs text-zinc-500">{item.desc}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
           </div>

           {/* Action Buttons */}
           <div className="mt-auto pt-4 lg:pt-0">
                {capturedImage ? (
                    <div className="flex gap-4 h-20">
                        <button 
                            onClick={handleRetake} 
                            className="flex-1 bg-zinc-900 text-zinc-300 font-bold rounded-2xl hover:bg-zinc-800 transition-all border border-white/10 uppercase tracking-wider text-sm"
                        >
                            Retake
                        </button>
                        <button 
                            onClick={handleAnalyze} 
                            className="flex-[2] bg-brand text-white font-bold rounded-2xl hover:bg-brand/90 transition-all shadow-xl shadow-brand/20 flex items-center justify-center gap-2 uppercase tracking-wider text-sm"
                        >
                            <span>Analyze</span>
                            <ArrowLeftIcon className="w-4 h-4 rotate-180" />
                        </button>
                    </div>
                ) : (
                    <button 
                        onClick={handleCapture} 
                        disabled={!!error || isCameraInitializing || needsManualStart} 
                        className="w-full h-24 bg-white text-zinc-950 font-bold text-xl rounded-[2rem] hover:bg-zinc-200 transition-all shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-4 group"
                    >
                        <div className="w-16 h-16 rounded-full border-4 border-zinc-950 flex items-center justify-center relative">
                            <div className={`w-12 h-12 bg-red-600 rounded-full transition-transform ${isCameraInitializing ? 'opacity-50' : 'group-hover:scale-90'}`}></div>
                        </div>
                        <span className="uppercase tracking-widest text-sm">Capture</span>
                    </button>
                )}
           </div>
       </div>
    </div>
  )
}