import { useState, useRef } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Camera, Type, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface QRScannerProps {
  onScanSuccess: (qrData: string) => void;
}

export function QRScanner({ onScanSuccess }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualInput, setManualInput] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startScanning = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        } 
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsScanning(true);
      toast.info('Camera started. Position QR code within the frame.');
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Could not access camera. Please check permissions or use manual input.');
      toast.error('Camera access denied');
    }
  };

  const stopScanning = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
  };

  const handleManualSubmit = () => {
    if (manualInput.trim()) {
      try {
        // Validate JSON format
        const qrData = JSON.parse(manualInput.trim());
        if (qrData.group_id && qrData.event_id) {
          onScanSuccess(manualInput.trim());
          setManualInput('');
          setShowManualInput(false);
          toast.success('QR code data processed successfully!');
        } else {
          toast.error('Invalid QR code format. Must contain group_id and event_id.');
        }
      } catch (err) {
        toast.error('Invalid JSON format. Please check your input.');
      }
    }
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
        {!isScanning && !showManualInput ? (
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
            
            <Button onClick={() => setShowManualInput(true)} className="w-full" variant="secondary">
              <Type className="w-4 h-4 mr-2" />
              Manual Input
            </Button>
            
            <p className="text-xs text-muted-foreground text-center">
              Scan QR code or enter data manually
            </p>
          </div>
        ) : isScanning ? (
          <div className="space-y-4">
            <div className="relative aspect-square bg-black rounded-lg overflow-hidden">
              <video 
                ref={videoRef}
                className="w-full h-full object-cover"
                autoPlay 
                playsInline 
                muted
              />
              
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
            
            <Button variant="outline" onClick={stopScanning} className="w-full">
              Stop Scanning
            </Button>
            
            <p className="text-sm text-center text-muted-foreground">
              Position the QR code within the frame
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="qr-input">QR Code Data (JSON)</Label>
              <Input
                id="qr-input"
                placeholder='{"group_id": "uuid", "event_id": "uuid"}'
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                className="font-mono text-sm"
              />
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowManualInput(false)} className="flex-1">
                Back
              </Button>
              <Button onClick={handleManualSubmit} disabled={!manualInput.trim()} className="flex-1">
                Submit
              </Button>
            </div>
            
            <div className="p-3 bg-muted/50 rounded-md">
              <p className="text-xs text-muted-foreground">
                <strong>Expected format:</strong><br/>
                {'{"group_id": "your-group-uuid", "event_id": "your-event-uuid"}'}
              </p>
            </div>
          </div>
        )}
        
        {error && (
          <div className="space-y-3">
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
            <Button onClick={() => setShowManualInput(true)} className="w-full" variant="default">
              <Type className="w-4 h-4 mr-2" />
              Use Manual Input
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}