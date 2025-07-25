import React, { useRef, useEffect, useState } from 'react';
import { IconX, IconCamera, IconRefresh } from './icons';

interface CameraCaptureProps {
    onCapture: (imageData: string, mimeType: string) => void;
    onClose: () => void;
    isOpen: boolean;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onClose, isOpen }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');

    const startCamera = async () => {
        try {
            setError(null);
            
            // Stop existing stream if any
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }

            const constraints: MediaStreamConstraints = {
                video: {
                    facingMode: facingMode,
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                }
            };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            streamRef.current = stream;
            
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
            }
            
            setHasPermission(true);
        } catch (err) {
            console.error('Error accessing camera:', err);
            setHasPermission(false);
            
            if (err instanceof Error) {
                if (err.name === 'NotAllowedError') {
                    setError('Camera access denied. Please allow camera permissions and try again.');
                } else if (err.name === 'NotFoundError') {
                    setError('No camera found on this device.');
                } else if (err.name === 'NotSupportedError') {
                    setError('Camera not supported on this device.');
                } else {
                    setError(`Camera error: ${err.message}`);
                }
            } else {
                setError('Failed to access camera. Please try again.');
            }
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
    };

    const capturePhoto = () => {
        if (!videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        if (!context) return;

        // Set canvas dimensions to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Draw the video frame to canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Convert to base64
        canvas.toBlob((blob) => {
            if (blob) {
                const reader = new FileReader();
                reader.onload = () => {
                    const base64String = (reader.result as string).split(',')[1];
                    onCapture(base64String, blob.type);
                    handleClose();
                };
                reader.readAsDataURL(blob);
            }
        }, 'image/jpeg', 0.8);
    };

    const switchCamera = () => {
        setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    };

    const handleClose = () => {
        stopCamera();
        onClose();
    };

    useEffect(() => {
        if (isOpen) {
            startCamera();
        } else {
            stopCamera();
        }

        return () => {
            stopCamera();
        };
    }, [isOpen, facingMode]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center p-4 bg-gray-900/90 backdrop-blur-sm">
                <h2 className="text-white text-lg font-semibold">Scan Business Card</h2>
                <button
                    onClick={handleClose}
                    className="text-white hover:text-gray-300 p-2"
                >
                    <IconX className="h-6 w-6" />
                </button>
            </div>

            {/* Camera View */}
            <div className="flex-1 relative overflow-hidden">
                {hasPermission === null && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                        <div className="text-center text-white">
                            <p className="mb-4">Requesting camera access...</p>
                        </div>
                    </div>
                )}

                {hasPermission === false && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                        <div className="text-center text-white max-w-sm mx-4">
                            <IconCamera className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                            <h3 className="text-lg font-semibold mb-2">Camera Access Required</h3>
                            <p className="text-gray-300 mb-4">{error}</p>
                            <button
                                onClick={startCamera}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
                            >
                                Try Again
                            </button>
                        </div>
                    </div>
                )}

                {hasPermission && (
                    <>
                        <video
                            ref={videoRef}
                            className="w-full h-full object-cover"
                            playsInline
                            muted
                        />
                        
                        {/* Overlay guide */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="border-2 border-white border-dashed rounded-lg w-80 h-48 flex items-center justify-center">
                                <p className="text-white text-sm bg-black/50 px-3 py-1 rounded">
                                    Position business card within frame
                                </p>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Controls */}
            {hasPermission && (
                <div className="bg-gray-900/90 backdrop-blur-sm p-4">
                    <div className="flex justify-center items-center space-x-8">
                        {/* Switch Camera */}
                        <button
                            onClick={switchCamera}
                            className="text-white hover:text-gray-300 p-3"
                            title="Switch Camera"
                        >
                            <IconRefresh className="h-6 w-6" />
                        </button>

                        {/* Capture Button */}
                        <button
                            onClick={capturePhoto}
                            className="bg-white hover:bg-gray-200 text-gray-900 rounded-full p-4 shadow-lg"
                            title="Capture Photo"
                        >
                            <IconCamera className="h-8 w-8" />
                        </button>

                        {/* Spacer for symmetry */}
                        <div className="w-12"></div>
                    </div>
                </div>
            )}

            {/* Hidden canvas for photo capture */}
            <canvas ref={canvasRef} className="hidden" />
        </div>
    );
};

export default CameraCapture;
