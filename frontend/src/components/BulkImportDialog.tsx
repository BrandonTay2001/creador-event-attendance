import { useState, useRef } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Upload, Download, AlertCircle, CheckCircle, X } from 'lucide-react';
import { Person } from '../lib/eventData';

interface BulkImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGuestsImported: (guests: Omit<Person, 'id'>[]) => void;
}

export function BulkImportDialog({ open, onOpenChange, onGuestsImported }: BulkImportDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [parsedData, setParsedData] = useState<Omit<Person, 'id'>[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const csv = e.target?.result as string;
      parseCSV(csv);
    };
    reader.readAsText(file);
  };

  const parseCSV = (csv: string) => {
    const lines = csv.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      setErrors(['CSV file must contain headers and at least one data row']);
      return;
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const requiredFields = ['name', 'email', 'groupid'];
    const missingFields = requiredFields.filter(field => !headers.includes(field));
    
    if (missingFields.length > 0) {
      setErrors([`Missing required columns: ${missingFields.join(', ')}`]);
      return;
    }

    const guests: Omit<Person, 'id'>[] = [];
    const parseErrors: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      if (values.length < headers.length) continue;

      const guest: any = { isPresent: false };
      
      headers.forEach((header, index) => {
        const value = values[index]?.replace(/"/g, '').trim();
        
        switch (header) {
          case 'name':
            guest.name = value;
            break;
          case 'email':
            guest.email = value;
            break;
          case 'groupid':
          case 'group_id':
            guest.groupId = value;
            break;
          case 'role':
            guest.role = value || undefined;
            break;
        }
      });

      // Validate required fields
      if (!guest.name || !guest.email || !guest.groupId) {
        parseErrors.push(`Row ${i + 1}: Missing required fields (name, email, or groupId)`);
        continue;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(guest.email)) {
        parseErrors.push(`Row ${i + 1}: Invalid email format`);
        continue;
      }

      guests.push(guest);
    }

    setErrors(parseErrors);
    setParsedData(guests);
  };

  const handleImport = async () => {
    if (parsedData.length === 0) return;

    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      onGuestsImported(parsedData);
      onOpenChange(false);
      resetState();
    } catch (error) {
      setErrors(['Failed to import guests. Please try again.']);
    } finally {
      setIsLoading(false);
    }
  };

  const resetState = () => {
    setParsedData([]);
    setErrors([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const downloadTemplate = () => {
    const csvContent = 'name,email,groupId,role\n"John Doe","john@example.com","GRP001","Speaker"\n"Jane Smith","jane@example.com","GRP002","Attendee"';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'attendees_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleClose = () => {
    resetState();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import Attendees from CSV</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Upload CSV File</Label>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={downloadTemplate}
              >
                <Download className="w-4 h-4 mr-2" />
                Download Template
              </Button>
            </div>
            
            <div className="border-2 border-dashed border-border rounded-lg p-6">
              <div className="text-center space-y-2">
                <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
                <div>
                  <Button 
                    variant="outline" 
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Choose CSV File
                  </Button>
                  <p className="text-sm text-muted-foreground mt-1">
                    Required columns: name, email, groupId. Optional: role
                  </p>
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          </div>

          {errors.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="w-4 h-4" />
                <span className="font-medium">Import Errors</span>
              </div>
              <div className="bg-destructive/10 rounded-md p-3 space-y-1">
                {errors.map((error, index) => (
                  <p key={index} className="text-sm text-destructive">{error}</p>
                ))}
              </div>
            </div>
          )}

          {parsedData.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-4 h-4" />
                <span className="font-medium">Preview ({parsedData.length} attendees)</span>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 rounded-md p-3 max-h-48 overflow-y-auto">
                <div className="space-y-2">
                  {parsedData.slice(0, 5).map((guest, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <Badge variant="outline" className="shrink-0">#{guest.groupId}</Badge>
                      <span>{guest.name}</span>
                      <span className="text-muted-foreground">({guest.email})</span>
                      {guest.role && (
                        <Badge variant="secondary">{guest.role}</Badge>
                      )}
                    </div>
                  ))}
                  {parsedData.length > 5 && (
                    <p className="text-sm text-muted-foreground">
                      ... and {parsedData.length - 5} more
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleImport}
            disabled={isLoading || parsedData.length === 0 || errors.length > 0}
          >
            {isLoading ? 'Importing...' : `Import ${parsedData.length} Attendees`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}