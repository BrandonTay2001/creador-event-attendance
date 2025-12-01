/*
 * AttendancePage Component - Handles two modes:
 * 
 * 1. Manual Mode (eventId prop): 
 *    - Shows all attendees for the selected event
 *    - Includes search functionality
 *    - Used when staff selects event from EventSelector
 * 
 * 2. QR Mode (qrData prop):
 *    - Shows only attendees for the scanned group
 *    - QR data format: {"group_id": "uuid", "event_id": "uuid"}
 *    - No search needed (specific group already filtered)
 *    - Used when staff scans QR code from QRScanner
 */

import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Checkbox } from './ui/checkbox';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { ArrowLeft, Users, Check, X, Search, Loader2, QrCode } from 'lucide-react';
import { QRScanner } from './QRScanner';
import { getEvent, getEventAttendees, getGroupAttendees, markAttendance, AttendeeWithGroup } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

interface AttendancePageProps {
  eventId?: string;
  qrData?: string; // JSON string with group_id and event_id
  onBack: () => void;
}

interface QRCodeData {
  group_id: string;
  event_id: string;
}

export function AttendancePage({ eventId, qrData, onBack }: AttendancePageProps) {
  const [attendees, setAttendees] = useState<AttendeeWithGroup[]>([]);
  const [originalAttendees, setOriginalAttendees] = useState<AttendeeWithGroup[]>([]);
  const [eventName, setEventName] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [groupContactName, setGroupContactName] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isQRMode, setIsQRMode] = useState(false);
  const [activeQrData, setActiveQrData] = useState<string | undefined>(qrData);
  const [showScanner, setShowScanner] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    loadEventData();
  }, [eventId, activeQrData]);

  const loadEventData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let actualEventId = eventId;
      let actualGroupId: string | null = null;
      
      // Check if we're in QR mode
      if (activeQrData) {
        try {
          const qrCodeData: QRCodeData = JSON.parse(activeQrData);
          setIsQRMode(true);
          
          if (!qrCodeData.group_id || !qrCodeData.event_id) {
            throw new Error('Invalid QR code: missing group_id or event_id');
          }
          
          actualEventId = qrCodeData.event_id;
          actualGroupId = qrCodeData.group_id;
        } catch (parseErr) {
          throw new Error('Invalid QR code format');
        }
      } else {
        setIsQRMode(false);
      }
      
      if (!actualEventId) {
        throw new Error('No event ID provided');
      }
      
      // Load event details
      const event = await getEvent(actualEventId);
      if (event) {
        setEventName(event.name);
        setEventLocation(event.location || '');
      } else {
        throw new Error('Event not found');
      }
      
      // Load attendees - either for specific group or entire event
      let eventAttendees: AttendeeWithGroup[];
      if (actualGroupId) {
        eventAttendees = await getGroupAttendees(actualEventId, actualGroupId);
        if (eventAttendees.length === 0) {
          throw new Error('No attendees found for this group');
        }
        setGroupContactName(eventAttendees[0]?.groups?.name || 'Unknown Group');
      } else {
        eventAttendees = await getEventAttendees(actualEventId);
      }
      
      setAttendees(eventAttendees);
      setOriginalAttendees([...eventAttendees]); // Store original state
      setHasUnsavedChanges(false);
    } catch (err) {
      console.error('Error loading event data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load event data. Please try again.');
      toast.error('Failed to load event data');
    } finally {
      setLoading(false);
    }
  };

  const handleInlineQRScanSuccess = (scannedQrData: string) => {
    setShowScanner(false);
    setActiveQrData(scannedQrData);
  };

  const toggleAttendance = (attendeeId: string) => {
    const staffName = user?.email || 'Staff';
    
    // Update local state only
    setAttendees(prev => 
      prev.map(attendee => 
        attendee.id === attendeeId 
          ? { 
              ...attendee, 
              is_attending: !attendee.is_attending,
              checked_in_at: !attendee.is_attending ? new Date().toISOString() : null,
              checked_in_by: !attendee.is_attending ? staffName : null
            }
          : attendee
      )
    );
    
    setHasUnsavedChanges(true);
  };

  const markAllPresent = () => {
    const staffName = user?.email || 'Staff';
    const attendeeIds = attendees.filter(a => !a.is_attending).map(a => a.id);
    
    if (attendeeIds.length > 0) {
      setAttendees(prev => prev.map(attendee => ({
        ...attendee,
        is_attending: true,
        checked_in_at: new Date().toISOString(),
        checked_in_by: staffName
      })));
      setHasUnsavedChanges(true);
    }
  };

  const clearAll = () => {
    const attendeeIds = attendees.filter(a => a.is_attending).map(a => a.id);
    
    if (attendeeIds.length > 0) {
      setAttendees(prev => prev.map(attendee => ({
        ...attendee,
        is_attending: false,
        checked_in_at: null,
        checked_in_by: null
      })));
      setHasUnsavedChanges(true);
    }
  };

  const saveAttendance = async () => {
    if (!hasUnsavedChanges) {
      toast.success('No changes to save');
      return;
    }

    try {
      setIsSaving(true);
      
      // Find attendees that have changed compared to original state
      const changedAttendees = attendees.filter((current, index) => {
        const original = originalAttendees[index];
        return original && current.is_attending !== original.is_attending;
      });

      if (changedAttendees.length === 0) {
        toast.success('No changes to save');
        setHasUnsavedChanges(false);
        return;
      }

      // Group changes by attendance status for batch updates
      const toMarkPresent = changedAttendees
        .filter(attendee => attendee.is_attending)
        .map(attendee => attendee.id);
      
      const toMarkAbsent = changedAttendees
        .filter(attendee => !attendee.is_attending)
        .map(attendee => attendee.id);

      const staffName = user?.email || 'Staff';
      let successCount = 0;

      // Save present attendees
      if (toMarkPresent.length > 0) {
        const success = await markAttendance(toMarkPresent, true, staffName);
        if (success) {
          successCount += toMarkPresent.length;
        } else {
          throw new Error('Failed to save some attendance changes');
        }
      }

      // Save absent attendees
      if (toMarkAbsent.length > 0) {
        const success = await markAttendance(toMarkAbsent, false, '');
        if (success) {
          successCount += toMarkAbsent.length;
        } else {
          throw new Error('Failed to save some attendance changes');
        }
      }

      // Update original attendees to reflect saved state
      setOriginalAttendees([...attendees]);
      setHasUnsavedChanges(false);
      
      toast.success(`Successfully saved ${successCount} attendance changes`);
    } catch (err) {
      console.error('Error saving attendance:', err);
      toast.error('Failed to save attendance changes');
    } finally {
      setIsSaving(false);
    }
  };

  // Filter attendees based on search term (only in manual mode)
  const filteredAttendees = isQRMode ? attendees : attendees.filter(attendee => 
    attendee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    attendee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (attendee.groups?.name && attendee.groups.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (attendee.groups?.email && attendee.groups.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const presentCount = attendees.filter(attendee => attendee.is_attending).length;
  const totalCount = attendees.length;
  const filteredPresentCount = filteredAttendees.filter(attendee => attendee.is_attending).length;

  if (loading) {
    return (
      <div className="w-full max-w-2xl mx-auto space-y-6">
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin mr-2" />
            <span>Loading event data...</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-2xl mx-auto space-y-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <X className="w-12 h-12 text-destructive mb-4" />
            <h3 className="text-lg mb-2">Failed to Load Event</h3>
            <p className="text-muted-foreground text-center mb-4">{error}</p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onBack}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </Button>
              <Button onClick={loadEventData}>
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2">
                {isQRMode ? (
                  <>
                    <QrCode className="w-5 h-5" />
                    Group Check-In
                  </>
                ) : (
                  <>
                    <Users className="w-5 h-5" />
                    {eventName}
                  </>
                )}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {isQRMode ? (
                  `${eventName}${groupContactName ? ` • Group: ${groupContactName}` : ''}`
                ) : (
                  `${eventLocation && `${eventLocation} • `}Mark attendance for event participants`
                )}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 mb-4">
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {presentCount} of {totalCount} present
              </Badge>
              <Badge variant={presentCount === totalCount ? "default" : "secondary"}>
                {totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0}% attendance
              </Badge>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={clearAll}
                disabled={presentCount === 0}
              >
                <X className="w-4 h-4 mr-1" />
                Clear All
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={markAllPresent}
                disabled={presentCount === totalCount}
              >
                <Check className="w-4 h-4 mr-1" />
                Mark All
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <CardTitle>{isQRMode ? 'Group Attendees' : 'Attendance List'}</CardTitle>
            {!isQRMode && (
              <div className="flex-1 max-w-sm">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search participants..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
            )}
          </div>
          {searchTerm && !isQRMode && (
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {filteredPresentCount} of {filteredAttendees.length} present (filtered)
              </Badge>
              <Badge variant="secondary">
                {filteredAttendees.length > 0 ? Math.round((filteredPresentCount / filteredAttendees.length) * 100) : 0}% attendance
              </Badge>
            </div>
          )}
        </CardHeader>
        <CardContent className="p-0">
          {filteredAttendees.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Users className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg mb-2">
                {searchTerm ? 'No matching participants found' : 'No participants yet'}
              </h3>
              <p className="text-muted-foreground text-center">
                {searchTerm 
                  ? 'Try adjusting your search terms'
                  : 'This event has no registered participants'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-0">
              {filteredAttendees.map((attendee, index) => (
                <div 
                  key={attendee.id}
                  className={`flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors ${
                    index !== filteredAttendees.length - 1 ? 'border-b' : ''
                  }`}
                >
                  <Checkbox
                    checked={attendee.is_attending || false}
                    onCheckedChange={() => toggleAttendance(attendee.id)}
                    className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                  <div className="flex-1 min-w-0">
                    <p className={`transition-colors ${
                      attendee.is_attending ? 'text-foreground' : 'text-muted-foreground'
                    }`}>
                      {attendee.name}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{attendee.email}</span>
                      {attendee.groups?.name && (
                        <span>Group: {attendee.groups.name}</span>
                      )}
                    </div>
                    {attendee.checked_in_at && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Checked in: {new Date(attendee.checked_in_at).toLocaleString()}
                        {attendee.checked_in_by && ` by ${attendee.checked_in_by}`}
                      </div>
                    )}
                  </div>
                  {attendee.is_attending && (
                    <div className="w-2 h-2 bg-green-500 rounded-full shrink-0"></div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="space-y-3">
            {hasUnsavedChanges && (
              <p className="text-sm text-muted-foreground text-center">
                You have unsaved changes
              </p>
            )}
            <Button 
              onClick={saveAttendance} 
              disabled={isSaving}
              className="w-full"
              variant={hasUnsavedChanges ? "default" : "outline"}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                hasUnsavedChanges ? 'Save Changes' : 'No Changes to Save'
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => setShowScanner(true)}
            >
              <QrCode className="w-4 h-4 mr-2" />
              Continue Scanning
            </Button>
          </div>
        </CardContent>
      </Card>

      {showScanner && (
        <QRScanner onScanSuccess={handleInlineQRScanSuccess} />
      )}
    </div>
  );
}