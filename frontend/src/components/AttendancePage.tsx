import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Checkbox } from './ui/checkbox';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { ArrowLeft, Users, Check, X, Search } from 'lucide-react';
import { Person, mockEventData } from '../lib/eventData';

interface AttendancePageProps {
  eventId: string;
  onBack: () => void;
}

export function AttendancePage({ eventId, onBack }: AttendancePageProps) {
  const [people, setPeople] = useState<Person[]>([]);
  const [eventName, setEventName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const eventData = mockEventData[eventId];
    if (eventData) {
      setPeople(eventData.people);
      setEventName(eventData.name);
    } else {
      // Fallback for unknown event IDs
      setEventName('Unknown Event');
      setPeople([]);
    }
  }, [eventId]);

  const toggleAttendance = (personId: string) => {
    setPeople(prev => 
      prev.map(person => 
        person.id === personId 
          ? { ...person, isPresent: !person.isPresent }
          : person
      )
    );
  };

  const markAllPresent = () => {
    setPeople(prev => prev.map(person => ({ ...person, isPresent: true })));
  };

  const clearAll = () => {
    setPeople(prev => prev.map(person => ({ ...person, isPresent: false })));
  };

  const saveAttendance = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSaving(false);
    
    // In a real app, you would send the attendance data to your backend
    console.log('Attendance saved:', { eventId, people });
    alert('Attendance saved successfully!');
  };

  // Filter people based on search term
  const filteredPeople = people.filter(person => 
    person.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    person.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    person.groupId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (person.role && person.role.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const presentCount = people.filter(person => person.isPresent).length;
  const totalCount = people.length;
  const filteredPresentCount = filteredPeople.filter(person => person.isPresent).length;

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
                <Users className="w-5 h-5" />
                {eventName}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Mark attendance for event participants
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
              <Button variant="outline" size="sm" onClick={clearAll}>
                <X className="w-4 h-4 mr-1" />
                Clear All
              </Button>
              <Button variant="outline" size="sm" onClick={markAllPresent}>
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
            <CardTitle>Attendance List</CardTitle>
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
          </div>
          {searchTerm && (
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {filteredPresentCount} of {filteredPeople.length} present (filtered)
              </Badge>
              <Badge variant="secondary">
                {filteredPeople.length > 0 ? Math.round((filteredPresentCount / filteredPeople.length) * 100) : 0}% attendance
              </Badge>
            </div>
          )}
        </CardHeader>
        <CardContent className="p-0">
          {filteredPeople.length === 0 ? (
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
              {filteredPeople.map((person, index) => (
                <div 
                  key={person.id}
                  className={`flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors ${
                    index !== filteredPeople.length - 1 ? 'border-b' : ''
                  }`}
                >
                  <Checkbox
                    checked={person.isPresent}
                    onCheckedChange={() => toggleAttendance(person.id)}
                    className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                  <div className="flex-1 min-w-0">
                    <p className={`transition-colors ${
                      person.isPresent ? 'text-foreground' : 'text-muted-foreground'
                    }`}>
                      {person.name}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{person.email}</span>
                      <span>#{person.groupId}</span>
                    </div>
                  </div>
                  {person.role && (
                    <Badge variant="secondary" className="shrink-0">
                      {person.role}
                    </Badge>
                  )}
                  {person.isPresent && (
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
          <Button 
            onClick={saveAttendance} 
            disabled={isSaving}
            className="w-full"
          >
            {isSaving ? 'Saving...' : 'Save Attendance'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}