import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Person } from '../lib/eventData';

interface EditGuestDialogProps {
  guest: Person;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGuestUpdated: (guestId: string, updates: Partial<Person>) => void;
}

export function EditGuestDialog({ guest, open, onOpenChange, onGuestUpdated }: EditGuestDialogProps) {
  const [formData, setFormData] = useState({
    groupId: '',
    name: '',
    email: '',
    role: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (guest) {
      setFormData({
        groupId: guest.groupId,
        name: guest.name,
        email: guest.email,
        role: guest.role || ''
      });
    }
  }, [guest]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 300)); // Simulate API call
      
      onGuestUpdated(guest.id, {
        groupId: formData.groupId,
        name: formData.name,
        email: formData.email,
        role: formData.role || undefined
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
            <Label htmlFor="groupId">Group ID</Label>
            <Input
              id="groupId"
              value={formData.groupId}
              onChange={(e) => handleChange('groupId', e.target.value)}
              placeholder="e.g., GRP001"
              required
            />
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

          <div className="space-y-2">
            <Label htmlFor="role">Role (Optional)</Label>
            <Input
              id="role"
              value={formData.role}
              onChange={(e) => handleChange('role', e.target.value)}
              placeholder="e.g., Manager, Developer"
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
              disabled={!formData.name.trim() || !formData.email.trim() || !formData.groupId.trim() || isSubmitting}
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