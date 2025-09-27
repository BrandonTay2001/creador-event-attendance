import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Calendar, ChevronRight } from 'lucide-react';
import { getEventList } from '../lib/eventData';

interface EventSelectorProps {
  onEventSelect: (eventId: string) => void;
}

export function EventSelector({ onEventSelect }: EventSelectorProps) {
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const events = getEventList();

  const handleEventChange = (eventId: string) => {
    setSelectedEventId(eventId);
  };

  const handleProceed = () => {
    if (selectedEventId) {
      onEventSelect(selectedEventId);
    }
  };

  const selectedEvent = events.find(event => event.id === selectedEventId);

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Select Event
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm">Choose an event to manage attendance:</label>
          <Select value={selectedEventId} onValueChange={handleEventChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select an event..." />
            </SelectTrigger>
            <SelectContent>
              {events.map((event) => (
                <SelectItem key={event.id} value={event.id}>
                  <div className="flex flex-col items-start">
                    <span>{event.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {event.people.length} participants
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedEvent && (
          <div className="p-3 bg-muted/50 rounded-md">
            <p className="text-sm">
              <strong>{selectedEvent.name}</strong>
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {selectedEvent.people.length} participants registered
            </p>
          </div>
        )}

        <Button 
          onClick={handleProceed} 
          disabled={!selectedEventId}
          className="w-full"
        >
          Proceed to Attendance
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );
}