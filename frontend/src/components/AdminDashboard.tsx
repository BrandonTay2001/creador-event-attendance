import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { ArrowLeft, Plus, Settings, Calendar, Users, Trash2, Edit } from 'lucide-react';
import { getEventList, deleteEvent } from '../lib/eventData';
import { CreateEventDialog } from './CreateEventDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';

interface AdminDashboardProps {
  onBack: () => void;
  onEventClick: (eventId: string) => void;
}

export function AdminDashboard({ onBack, onEventClick }: AdminDashboardProps) {
  const [events, setEvents] = useState(getEventList());
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const handleDeleteEvent = (eventId: string) => {
    const success = deleteEvent(eventId);
    if (success) {
      setEvents(getEventList());
    }
  };

  const handleEventCreated = () => {
    setEvents(getEventList());
    setShowCreateDialog(false);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No date set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

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
                <Settings className="w-5 h-5" />
                Admin Dashboard
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Manage events and participants
              </p>
            </div>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Event
            </Button>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-4">
        {events.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calendar className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg mb-2">No events yet</h3>
              <p className="text-muted-foreground text-center mb-4">
                Create your first event to get started with attendance management
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Event
              </Button>
            </CardContent>
          </Card>
        ) : (
          events.map((event) => (
            <Card key={event.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="truncate">{event.name}</h3>
                      <Badge variant="outline">
                        {event.people.length} guests
                      </Badge>
                    </div>
                    
                    {event.description && (
                      <p className="text-sm text-muted-foreground mb-2">
                        {event.description}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDate(event.date)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {event.people.filter(p => p.isPresent).length} attended
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => onEventClick(event.id)}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Manage
                    </Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Event</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{event.name}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => handleDeleteEvent(event.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <CreateEventDialog 
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onEventCreated={handleEventCreated}
      />
    </div>
  );
}