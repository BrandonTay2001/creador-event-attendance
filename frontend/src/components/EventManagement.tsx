import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from './ui/dropdown-menu';
import { ArrowLeft, Plus, Trash2, Edit, Search, Users, Mail, Hash, Settings, Download, Upload, Send, MoreVertical, Loader2 } from 'lucide-react';
import { getEventList, addGuest, removeGuest, updateGuest, updateEvent, Person, Event } from '../lib/eventData';
import { AddGuestDialog } from './AddGuestDialog';
import { EditGuestDialog } from './EditGuestDialog';
import { EditEventDialog } from './EditEventDialog';
import { BulkImportDialog } from './BulkImportDialog';
import { EmailSection } from './EmailSection';
import { Checkbox } from './ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { toast } from 'sonner@2.0.3';

interface EventManagementProps {
  eventId: string;
  onBack: () => void;
}

export function EventManagement({ eventId, onBack }: EventManagementProps) {
  const [event, setEvent] = useState<Event | null>(null);
  const [guests, setGuests] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingGuest, setEditingGuest] = useState<Person | null>(null);
  const [showEditEventDialog, setShowEditEventDialog] = useState(false);
  const [showBulkImportDialog, setShowBulkImportDialog] = useState(false);
  const [selectedAttendees, setSelectedAttendees] = useState<Set<string>>(new Set());

  const loadEvent = async () => {
    setLoading(true);
    try {
      const events = await getEventList();
      const foundEvent = events.find(e => e.id === eventId);
      setEvent(foundEvent || null);
      if (foundEvent) {
        setGuests(foundEvent.people);
      }
    } catch (error) {
      console.error('Error loading event:', error);
      setEvent(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvent();
  }, [eventId]);

  const filteredGuests = guests.filter(guest => 
    guest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    guest.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (guest.groupName && guest.groupName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleAddGuest = async (guestData: { name: string; email: string; groupName: string; isPresent: boolean }) => {
    const newGuest = await addGuest(eventId, guestData);
    if (newGuest) {
      await loadEvent();
      setShowAddDialog(false);
    }
  };

  const handleEditGuest = async (guestId: string, updates: Partial<Person>) => {
    const updatedGuest = await updateGuest(eventId, guestId, updates);
    if (updatedGuest) {
      await loadEvent();
      setEditingGuest(null);
    }
  };

  const handleDeleteGuest = async (guestId: string) => {
    const success = await removeGuest(eventId, guestId);
    if (success) {
      await loadEvent();
    }
  };

  const handleEditEvent = async (eventId: string, updates: any) => {
    const success = await updateEvent(eventId, updates);
    if (success) {
      await loadEvent();
      toast.success('Event updated successfully');
    }
  };

  const handleBulkImport = async (importedGuests: { name: string; email: string; groupName: string; isPresent: boolean }[]) => {
    let successCount = 0;
    for (const guestData of importedGuests) {
      const newGuest = await addGuest(eventId, guestData);
      if (newGuest) successCount++;
    }
    
    if (successCount > 0) {
      await loadEvent();
      toast.success(`Successfully imported ${successCount} attendees`);
    }
  };

  const handleAttendeeSelection = (attendeeId: string, checked: boolean) => {
    const newSelected = new Set(selectedAttendees);
    if (checked) {
      newSelected.add(attendeeId);
    } else {
      newSelected.delete(attendeeId);
    }
    setSelectedAttendees(newSelected);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(filteredGuests.map(g => g.id));
      setSelectedAttendees(allIds);
    } else {
      setSelectedAttendees(new Set());
    }
  };

  const handleEmailSend = (subject: string, content: string, recipients: Person[]) => {
    // For now, just show a success message
    toast.success(`Email prepared for ${recipients.length} attendee(s): "${subject}"`);
    console.log('Email details:', { subject, content, recipients });
  };

  const getSelectedAttendeeObjects = (): Person[] => {
    return guests.filter(guest => selectedAttendees.has(guest.id));
  };

  const downloadCSV = () => {
    const headers = ['Name', 'Email', 'Group Name', 'Attendance Status'];
    const csvData = [
      headers.join(','),
      ...guests.map(guest => [
        `"${guest.name}"`,
        `"${guest.email}"`,
        `"${guest.groupName || ''}"`,
        guest.isPresent ? 'Present' : 'Absent'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${event?.name || 'event'}_attendees.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast.success('Attendee list downloaded successfully');
  };

  const sendInviteEmails = () => {
    // Mock email sending functionality
    toast.success(`Invitation emails sent to ${guests.length} attendees`);
  };

  if (loading) {
    return (
      <div className="w-full max-w-2xl mx-auto">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mb-4" />
            <h3 className="text-lg mb-2">Loading event...</h3>
            <p className="text-muted-foreground text-center">
              Please wait while we fetch the event details
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="w-full max-w-2xl mx-auto">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">Event not found</p>
            <Button onClick={onBack} className="mt-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                {event.name}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {event.description || 'Manage event participants'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Guest
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => setShowEditEventDialog(true)}>
                    <Settings className="w-4 h-4 mr-2" />
                    Edit Event Details
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setShowBulkImportDialog(true)}>
                    <Upload className="w-4 h-4 mr-2" />
                    Import from CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={downloadCSV} disabled={guests.length === 0}>
                    <Download className="w-4 h-4 mr-2" />
                    Download CSV
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={sendInviteEmails} disabled={guests.length === 0}>
                    <Send className="w-4 h-4 mr-2" />
                    Send Invitations
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 flex-wrap">
            <Badge variant="outline">
              {guests.length} total guests
            </Badge>
            <Badge variant="secondary">
              {guests.filter(g => g.isPresent).length} attended
            </Badge>
            {event.date && (
              <span className="text-sm text-muted-foreground">
                📅 {new Date(event.date).toLocaleDateString()}
              </span>
            )}
            {event.time && (
              <span className="text-sm text-muted-foreground">
                🕒 {event.time}
              </span>
            )}
            {event.location && (
              <span className="text-sm text-muted-foreground">
                📍 {event.location}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={filteredGuests.length > 0 && filteredGuests.every(g => selectedAttendees.has(g.id))}
                onCheckedChange={handleSelectAll}
              />
              <CardTitle>Guest List ({selectedAttendees.size} selected)</CardTitle>
            </div>
            <div className="flex-1 max-w-sm">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search guests..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredGuests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Users className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg mb-2">
                {searchTerm ? 'No matching guests found' : 'No guests yet'}
              </h3>
              <p className="text-muted-foreground text-center mb-4">
                {searchTerm 
                  ? 'Try adjusting your search terms'
                  : 'Add the first guest to get started'
                }
              </p>
              {!searchTerm && (
                <Button onClick={() => setShowAddDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Guest
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-0">
              {filteredGuests.map((guest, index) => (
                <div 
                  key={guest.id}
                  className={`flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors ${
                    index !== filteredGuests.length - 1 ? 'border-b' : ''
                  } ${
                    selectedAttendees.has(guest.id) ? 'bg-primary/5' : ''
                  }`}
                >
                  <Checkbox
                    checked={selectedAttendees.has(guest.id)}
                    onCheckedChange={(checked) => handleAttendeeSelection(guest.id, !!checked)}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p>{guest.name}</p>
                      {guest.isPresent && (
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {guest.email}
                      </span>
                      {guest.groupName && (
                        <span className="flex items-center gap-1">
                          <Hash className="w-3 h-3" />
                          Group name: {guest.groupName}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setEditingGuest(guest)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remove Guest</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to remove "{guest.name}" from this event?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => handleDeleteGuest(guest.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Remove
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AddGuestDialog 
        eventId={eventId}
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onGuestAdded={handleAddGuest}
      />

      {editingGuest && (
        <EditGuestDialog 
          guest={editingGuest}
          open={!!editingGuest}
          onOpenChange={(open) => !open && setEditingGuest(null)}
          onGuestUpdated={handleEditGuest}
        />
      )}

      {event && (
        <EditEventDialog 
          event={event}
          open={showEditEventDialog}
          onOpenChange={setShowEditEventDialog}
          onEventUpdated={handleEditEvent}
        />
      )}

      <BulkImportDialog 
        open={showBulkImportDialog}
        onOpenChange={setShowBulkImportDialog}
        onGuestsImported={handleBulkImport}
      />
      
      <EmailSection 
        selectedAttendees={getSelectedAttendeeObjects()}
        onEmailSend={handleEmailSend}
      />
    </div>
  );
}
