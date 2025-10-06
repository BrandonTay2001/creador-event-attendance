import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Person, Group, getGroupsForEvent } from '../lib/eventData';

interface AddGuestDialogProps {
  eventId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGuestAdded: (guestData: { name: string; email: string; groupName: string; isPresent: boolean }) => void;
}

export function AddGuestDialog({ eventId, open, onOpenChange, onGuestAdded }: AddGuestDialogProps) {
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
      onGuestAdded({
        name: formData.name,
        email: formData.email,
        groupName: formData.groupName,
        isPresent: false
      });

      setFormData({ groupName: '', name: '', email: '' });
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
          <DialogTitle>Add New Guest</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="groupName">Group</Label>
            <Select
              value={formData.groupName}
              onValueChange={(value) => handleChange('groupName', value)}
              disabled={loadingGroups}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingGroups ? "Loading groups..." : "Select a group"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CREATE_NEW_GROUP">
                  <span className="font-medium text-green-600">+ Create New Group</span>
                </SelectItem>
                {groups.map((group) => (
                  <SelectItem key={group.id} value={group.name}>
                    {group.name}
                  </SelectItem>
                ))}
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
              {isSubmitting ? 'Adding...' : 'Add Guest'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}