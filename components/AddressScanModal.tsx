import React, { useState, useCallback } from 'react';
import { IconX, IconCamera, IconUpload, IconSparkles, IconLocation } from './icons';
import { scanAddressFromImage, AddressResult } from '../services/addressScanService';
import CameraCapture from './CameraCapture';
import Spinner from './Spinner';

interface AddressScanModalProps {
    onClose: () => void;
    onAddressScanned: (address: string) => void;
    isOpen: boolean;
}

const AddressScanModal: React.FC<AddressScanModalProps> = ({ onClose, onAddressScanned, isOpen }) => {
    const [isScanning, setIsScanning] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<AddressResult | null>(null);
    const [isCameraOpen, setIsCameraOpen] = useState(false);

    // Check if device likely has camera (mobile detection)
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const hasCamera = 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices;

    const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            setError("Please upload a valid image file.");
            return;
        }

        await processImage(file);
        e.target.value = ''; // Reset file input
    }, []);

    const handleCameraCapture = useCallback(async (base64Image: string, mimeType: string) => {
        setIsScanning(true);
        setError(null);
        setResult(null);

        try {
            const addressResult = await scanAddressFromImage(base64Image, mimeType);
            setResult(addressResult);
        } catch (err) {
            setError(err instanceof Error ? err.message : "An unknown error occurred during scanning.");
        } finally {
            setIsScanning(false);
        }
    }, []);

    const processImage = async (file: File) => {
        setIsScanning(true);
        setError(null);
        setResult(null);

        try {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = async () => {
                const base64String = (reader.result as string).split(',')[1];
                const addressResult = await scanAddressFromImage(base64String, file.type);
                setResult(addressResult);
            };
            reader.onerror = () => {
                throw new Error("Failed to read the image file.");
            };
        } catch (err) {
            setError(err instanceof Error ? err.message : "An unknown error occurred during scanning.");
        } finally {
            setIsScanning(false);
        }
    };

    const handleUseAddress = () => {
        if (result?.address) {
            onAddressScanned(result.address);
            handleClose();
        }
    };

    const handleClose = () => {
        setIsScanning(false);
        setError(null);
        setResult(null);
        setIsCameraOpen(false);
        onClose();
    };

    const openCamera = () => {
        console.log('Opening camera...');
        setIsCameraOpen(true);
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 bg-black/70 z-40 flex items-center justify-center animate-fade-in-fast backdrop-blur-sm p-4">
                <div className="bg-gray-800 rounded-lg shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col">
                    <div className="flex justify-between items-center p-4 border-b border-gray-700">
                        <h2 className="text-xl font-bold text-white flex items-center">
                            <IconLocation className="h-6 w-6 mr-2 text-blue-400" />
                            Scan Address
                        </h2>
                        <button onClick={handleClose} className="text-gray-400 hover:text-white">
                            <IconX className="h-6 w-6" />
                        </button>
                    </div>

                    <div className="p-6 overflow-y-auto">
                        {error && (
                            <div className="bg-red-900/50 border border-red-700 text-red-300 p-3 rounded-md mb-4 text-center">
                                {error}
                            </div>
                        )}

                        {result && (
                            <div className="bg-green-900/50 border border-green-700 text-green-300 p-4 rounded-md mb-4">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="font-semibold">Address Found</h3>
                                    <span className="text-xs bg-green-800 px-2 py-1 rounded">
                                        {Math.round(result.confidence * 100)}% confident
                                    </span>
                                </div>
                                <p className="text-white mb-2">{result.address}</p>
                                {result.notes && (
                                    <p className="text-xs text-green-200">{result.notes}</p>
                                )}
                                <button
                                    onClick={handleUseAddress}
                                    className="mt-3 w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-md transition-colors"
                                >
                                    Use This Address
                                </button>
                            </div>
                        )}

                        {isScanning ? (
                            <div className="flex flex-col items-center justify-center py-8">
                                <Spinner />
                                <p className="mt-4 text-blue-400">Analyzing image with AI...</p>
                                <p className="text-xs text-gray-500 mt-1">This may take a few seconds</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {/* Camera Option (Mobile Priority) */}
                                {hasCamera && (
                                    <div className="relative border-2 border-dashed border-gray-600 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
                                        <IconCamera className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                                        <button
                                            onClick={openCamera}
                                            className="text-blue-400 font-semibold hover:text-blue-300 transition-colors"
                                        >
                                            {isMobile ? 'Take Photo' : 'Use Camera'}
                                            <IconSparkles className="inline-block h-4 w-4 ml-1" />
                                        </button>
                                        <p className="text-xs text-gray-500 mt-2">
                                            {isMobile 
                                                ? 'Capture a photo of mail, documents, or signs with addresses'
                                                : 'Use your camera to scan address information'
                                            }
                                        </p>
                                    </div>
                                )}

                                {/* File Upload Option */}
                                <div className="relative border-2 border-dashed border-gray-600 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
                                    <IconUpload className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                                    <label htmlFor="address-image-upload" className="cursor-pointer">
                                        <span className="text-blue-400 font-semibold hover:text-blue-300 transition-colors">
                                            Upload Image
                                            <IconSparkles className="inline-block h-4 w-4 ml-1" />
                                        </span>
                                        <input
                                            id="address-image-upload"
                                            name="address-image-upload"
                                            type="file"
                                            className="sr-only"
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                        />
                                    </label>
                                    <p className="text-xs text-gray-500 mt-2">
                                        Upload a photo containing address information
                                    </p>
                                </div>

                                {!hasCamera && (
                                    <p className="text-center text-xs text-gray-500">
                                        Camera not available on this device
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Camera Component */}
            <CameraCapture
                isOpen={isCameraOpen}
                onCapture={handleCameraCapture}
                onClose={() => setIsCameraOpen(false)}
            />
        </>
    );
};

export default AddressScanModal;
