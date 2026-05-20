import { useRef, useState, useCallback, useEffect } from "react";

export const useCamera = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState(null);

  const startCamera = useCallback(async (options = {}) => {
    try {
      setError(null);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: options.facingMode || "environment",
        },
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setIsActive(true);
    } catch (err) {
      setError(err);
      setIsActive(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsActive(false);
  }, []);

  const capturePhoto = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) return null;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0);

    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) return resolve(null);

          const file = new File([blob], `photo-${Date.now()}.jpg`, {
            type: "image/jpeg",
          });

          resolve({
            blob,
            file,
            previewUrl: URL.createObjectURL(blob),
          });
        },
        "image/jpeg",
        0.9
      );
    });
  }, []);

  const switchCamera = useCallback(async () => {
    stopCamera();
    await startCamera({ facingMode: "user" });
  }, [startCamera, stopCamera]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return {
    videoRef,
    canvasRef,
    isActive,
    error,
    startCamera,
    stopCamera,
    capturePhoto,
    switchCamera,
  };
};