import { useState, useRef } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Camera, Upload } from 'lucide-react';

interface QRScannerProps {
  onScanSuccess: (result: string) => void;
}

export function QRScanner({ onScanSuccess }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startScanning = async () => {
    setError(null);
    // Simulate successful camera access
    setIsScanning(true);
  };

  const stopScanning = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  };

  // Simulate QR code detection (in a real app, you'd use a QR detection library)
  const simulateQRDetection = () => {
    // Mock QR codes for different events
    const mockQRCodes = [
      'event:team-meeting-2024',
      'event:company-retreat-2024',
      'event:training-session-2024'
    ];
    const randomCode = mockQRCodes[Math.floor(Math.random() * mockQRCodes.length)];
    onScanSuccess(randomCode);
    stopScanning();
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="w-5 h-5" />
          QR Code Scanner
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isScanning ? (
          <div className="space-y-4">
            <Button onClick={startScanning} className="w-full">
              <Camera className="w-4 h-4 mr-2" />
              Start Camera Scanning
            </Button>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or</span>
              </div>
            </div>
            
            <Button onClick={simulateQRDetection} className="w-full" variant="secondary">
              <Upload className="w-4 h-4 mr-2" />
              Demo Mode - Simulate QR Code
            </Button>
            
            <p className="text-xs text-muted-foreground text-center">
              Demo mode works without camera permissions
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative aspect-square bg-black rounded-lg overflow-hidden">
              {/* Simulated camera feed with animated scanning effect */}
              <div className="w-full h-full bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
                <div className="text-white/30 text-center">
                  <Camera className="w-12 h-12 mx-auto mb-2" />
                  <p className="text-sm">Camera Active</p>
                </div>
              </div>
              
              {/* Scanning frame with corners */}
              <div className="absolute inset-4 border-2 border-white rounded-lg">
                <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-primary"></div>
                <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-primary"></div>
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-primary"></div>
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-primary"></div>
              </div>
              
              {/* Animated scanning line */}
              <div className="absolute inset-4 pointer-events-none">
                <div className="w-full h-0.5 bg-primary/60 animate-pulse shadow-lg shadow-primary/30 transform translate-y-[50px]"></div>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={stopScanning} className="flex-1">
                Stop Scanning
              </Button>
              <Button onClick={simulateQRDetection} className="flex-1">
                Test Scan
              </Button>
            </div>
            
            <p className="text-sm text-center text-muted-foreground">
              Position the QR code within the frame
            </p>
          </div>
        )}
        
        {error && (
          <div className="space-y-3">
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-sm text-destructive">{error}</p>
            </div>
            <Button onClick={simulateQRDetection} className="w-full" variant="default">
              <Upload className="w-4 h-4 mr-2" />
              Continue with Demo Mode
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}