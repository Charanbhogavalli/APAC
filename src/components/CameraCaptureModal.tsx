import React, { useRef, useState, useEffect } from 'react';

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (blob: Blob) => void;
}

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({
  isOpen,
  onClose,
  onCapture,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setCapturedPhoto(null);
      setCameraError(null);
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 640 } },
        audio: false,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setCameraError('Camera access unavailable. Please grant permission or use photo upload instead.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const captureFrame = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    const size = Math.min(video.videoWidth, video.videoHeight);
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Center crop square
    const startX = (video.videoWidth - size) / 2;
    const startY = (video.videoHeight - size) / 2;
    ctx.drawImage(video, startX, startY, size, size, 0, 0, size, size);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedPhoto(dataUrl);

    // Also get blob
    canvas.toBlob((blob) => {
      if (blob) {
        // save pending blob
        (canvas as unknown as { capturedBlob: Blob }).capturedBlob = blob;
      }
    }, 'image/jpeg', 0.9);
  };

  const handleConfirm = () => {
    if (!capturedPhoto) return;
    // convert dataUrl to blob
    fetch(capturedPhoto)
      .then((res) => res.blob())
      .then((blob) => {
        onCapture(blob);
        onClose();
      })
      .catch((err) => {
        console.error('Failed to convert photo', err);
      });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#2b2f49]/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#ffffff] rounded-3xl max-w-md w-full p-6 shadow-2xl relative border border-[#dee0ed] text-center">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-10 h-10 rounded-full bg-[#f4f2ff] hover:bg-[#edecff] text-[#161a33] flex items-center justify-center cursor-pointer transition-colors"
          type="button"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>

        <div className="w-12 h-12 rounded-2xl bg-[#3a4efb]/10 text-[#3a4efb] mx-auto flex items-center justify-center mb-3">
          <span className="material-symbols-outlined text-[26px]">photo_camera</span>
        </div>
        <h3 className="text-[20px] font-bold text-[#161a33] mb-1">Delegate Photo</h3>
        <p className="text-[13px] text-[#444656] mb-5">
          Take a clear headshot for your official conference credential badge.
        </p>

        {cameraError ? (
          <div className="bg-[#ffdad6] text-[#93000a] p-4 rounded-2xl text-[14px] mb-4">
            {cameraError}
          </div>
        ) : (
          <div className="relative w-64 h-64 mx-auto rounded-3xl overflow-hidden bg-[#161a33] mb-6 shadow-inner ring-4 ring-[#edecff]">
            {capturedPhoto ? (
              <img
                src={capturedPhoto}
                alt="Captured delegate preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            )}
            {!capturedPhoto && (
              <div className="absolute inset-0 pointer-events-none border-2 border-dashed border-[#d4f029]/70 rounded-full m-4"></div>
            )}
          </div>
        )}

        <div className="flex gap-3">
          {capturedPhoto ? (
            <>
              <button
                type="button"
                onClick={() => setCapturedPhoto(null)}
                className="flex-1 py-3 px-4 rounded-full bg-[#f4f2ff] text-[#161a33] font-bold text-[14px] hover:bg-[#edecff] transition-all cursor-pointer"
              >
                Retake
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="flex-1 py-3 px-4 rounded-full bg-[#d4f029] text-[#191e00] font-bold text-[14px] hover:scale-102 transition-all cursor-pointer shadow-md"
              >
                Use Photo
              </button>
            </>
          ) : (
            <button
              type="button"
              disabled={!!cameraError}
              onClick={captureFrame}
              className="w-full py-3.5 px-6 rounded-full bg-[#3a4efb] text-white font-bold text-[14px] hover:bg-[#152de4] transition-all disabled:opacity-50 cursor-pointer shadow-md flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[20px]">camera</span>
              <span>Take Photo</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
