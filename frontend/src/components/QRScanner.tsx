import { useState, useEffect } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Camera, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface QRScannerProps {
  onScanSuccess: (qrData: string) => void;
  autoStart?: boolean;
}

export function QRScanner({ onScanSuccess, autoStart }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startScanning = () => {
    setError(null);
    setIsScanning(true);
    toast.info('Camera started. Position QR code within the frame.');
  };

  const stopScanning = () => {
    setIsScanning(false);
  };

  useEffect(() => {
    if (autoStart) {
      startScanning();
    }
  }, [autoStart]);

  // Manual input removed

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

            <p className="text-xs text-muted-foreground text-center">Scan a QR code to continue</p>
          </div>
        ) : isScanning ? (
          <div className="space-y-4">
            <div className="relative w-full aspect-square bg-black rounded-lg overflow-hidden">
              <Scanner 
                constraints={{ facingMode: 'environment' }}
                onScan={(detectedCodes) => {
                  const first = detectedCodes && detectedCodes.length > 0 ? detectedCodes[0] : null;
                  const text = (first as any)?.rawValue ?? (first as any)?.rawValue?.toString?.();
                  if (text) {
                    onScanSuccess(String(text));
                    setIsScanning(false);
                    toast.success('QR code scanned');
                  }
                }}
                onError={(err) => {
                  console.error('QR scan error:', err);
                  setError('Failed to access camera or decode QR. Check permissions and try again.');
                }}
              />
            </div>
            
            <Button variant="outline" onClick={stopScanning} className="w-full">
              Stop Scanning
            </Button>
            
            <p className="text-sm text-center text-muted-foreground">
              Position the QR code within the frame
            </p>
          </div>
        ) : null}
        
        {error && (
          <div className="space-y-3">
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
            <Button onClick={startScanning} className="w-full" variant="default">
              Try Again
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}