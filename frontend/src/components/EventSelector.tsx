import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Calendar, ChevronRight, Loader2 } from 'lucide-react';
import { getEvents, getEventStats, Event } from '../lib/api';

interface EventSelectorProps {
  onEventSelect: (eventId: string) => void;
}

export function EventSelector({ onEventSelect }: EventSelectorProps) {
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [events, setEvents] = useState<Event[]>([]);
  const [eventStats, setEventStats] = useState<Record<string, { total: number; checkedIn: number }>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const eventsData = await getEvents();
      setEvents(eventsData);
      
      // Load stats for each event
      const statsPromises = eventsData.map(async (event) => {
        const stats = await getEventStats(event.id);
        return { eventId: event.id, stats: { total: stats.total_attendees, checkedIn: stats.checked_in } };
      });
      
      const statsResults = await Promise.all(statsPromises);
      const statsMap = statsResults.reduce((acc, { eventId, stats }) => {
        acc[eventId] = stats;
        return acc;
      }, {} as Record<string, { total: number; checkedIn: number }>);
      
      setEventStats(statsMap);
    } catch (err) {
      setError('Failed to load events. Please try again.');
      console.error('Error loading events:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEventChange = (eventId: string) => {
    setSelectedEventId(eventId);
  };

  const handleProceed = () => {
    if (selectedEventId) {
      onEventSelect(selectedEventId);
    }
  };

  const selectedEvent = events.find(event => event.id === selectedEventId);
  const selectedEventStats = selectedEvent ? eventStats[selectedEvent.id] : null;

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Select Event
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md mb-4">
            {error}
            <Button variant="outline" size="sm" onClick={loadEvents} className="ml-2">
              Retry
            </Button>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm">Choose an event to manage attendance:</label>
          <Select value={selectedEventId} onValueChange={handleEventChange} disabled={loading}>
            <SelectTrigger>
              <SelectValue placeholder={loading ? "Loading events..." : "Select an event..."} />
            </SelectTrigger>
            <SelectContent>
              {events.map((event) => {
                const stats = eventStats[event.id];
                const eventDate = new Date(event.event_date).toLocaleDateString();
                return (
                  <SelectItem key={event.id} value={event.id}>
                    <div className="flex flex-col items-start">
                      <span>{event.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {eventDate} • {stats ? `${stats.total} participants` : 'Loading...'}
                      </span>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        {selectedEvent && selectedEventStats && (
          <div className="p-3 bg-muted/50 rounded-md">
            <p className="text-sm">
              <strong>{selectedEvent.name}</strong>
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {new Date(selectedEvent.event_date).toLocaleDateString()} • 
              {selectedEventStats.total} participants registered • 
              {selectedEventStats.checkedIn} checked in
            </p>
            {selectedEvent.description && (
              <p className="text-xs text-muted-foreground mt-2">
                {selectedEvent.description}
              </p>
            )}
          </div>
        )}

        <Button 
          onClick={handleProceed} 
          disabled={!selectedEventId || loading}
          className="w-full"
        >
          {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Proceed to Attendance
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );
}