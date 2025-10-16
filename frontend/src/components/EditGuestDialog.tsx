import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Person, Group, getGroupsForEvent } from '../lib/eventData';

interface EditGuestDialogProps {
  guest: Person;
  eventId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGuestUpdated: (guestId: string, updates: Partial<Person>) => void;
}

export function EditGuestDialog({ guest, eventId, open, onOpenChange, onGuestUpdated }: EditGuestDialogProps) {
  const [formData, setFormData] = useState({
    groupName: '',
    name: '',
    email: ''
  });
  const [groups, setGroups] = useState<Group[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingGroups, setLoadingGroups] = useState(false);

  useEffect(() => {
    if (open) {
      loadGroups();
    }
  }, [open, eventId]);

  useEffect(() => {
    if (guest) {
      setFormData({
        groupName: guest.groupName || '',
        name: guest.name,
        email: guest.email
      });
    }
  }, [guest]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setFormData({
        groupName: '',
        name: '',
        email: ''
      });
    }
  }, [open]);

  const loadGroups = async () => {
    setLoadingGroups(true);
    try {
      const eventGroups = await getGroupsForEvent(eventId);
      setGroups(eventGroups);
    } catch (error) {
      console.error('Error loading groups:', error);
    } finally {
      setLoadingGroups(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 300)); // Simulate API call
      
      onGuestUpdated(guest.id, {
        groupName: formData.groupName,
        name: formData.name,
        email: formData.email
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Guest</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="groupName">
              Group {formData.groupName && <span className="text-muted-foreground">(Currently: {formData.groupName})</span>}
            </Label>
            <Select
              value={formData.groupName}
              onValueChange={(value) => handleChange('groupName', value)}
              disabled={loadingGroups}
            >
              <SelectTrigger>
                <SelectValue 
                  placeholder={loadingGroups ? "Loading groups..." : "Select or change group"}
                  className={formData.groupName ? "text-foreground" : "text-muted-foreground"}
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CREATE_NEW_GROUP">
                  <span className="font-medium text-green-600">+ Create New Group</span>
                </SelectItem>
                {groups.map((group) => (
                  <SelectItem key={group.id} value={group.name}>
                    <div className="flex items-center justify-between w-full">
                      <span>{group.name}</span>
                      {group.name === guest.groupName && (
                        <Badge variant="outline" className="ml-2 text-xs">Current</Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
                {/* Show current group if it's not in the groups list (edge case) */}
                {formData.groupName && !groups.some(g => g.name === formData.groupName) && formData.groupName !== "CREATE_NEW_GROUP" && (
                  <SelectItem key="current-group" value={formData.groupName}>
                    {formData.groupName} (Current)
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Enter full name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="Enter email address"
              required
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!formData.name.trim() || !formData.email.trim() || !formData.groupName.trim() || isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}