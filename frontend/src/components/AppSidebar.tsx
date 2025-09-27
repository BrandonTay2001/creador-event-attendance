import { Button } from './ui/button';
import { 
  Sidebar, 
  SidebarContent, 
  SidebarHeader, 
  SidebarMenu, 
  SidebarMenuItem, 
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger
} from './ui/sidebar';
import { Settings, LogOut, User, Calendar } from 'lucide-react';

interface AppSidebarProps {
  user: { username: string; isAdmin: boolean } | null;
  onAdminClick: () => void;
  onLogout: () => void;
}

export function AppSidebar({ user, onAdminClick, onLogout }: AppSidebarProps) {
  if (!user) return null;

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-1">
          <Calendar className="w-5 h-5" />
          <span className="font-medium">Event Management</span>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center gap-2 text-sm">
            <User className="w-4 h-4" />
            <div>
              <p className="font-medium">{user.username}</p>
              <p className="text-xs text-muted-foreground">
                {user.isAdmin ? 'Administrator' : 'User'}
              </p>
            </div>
          </div>
        </div>

        {user.isAdmin && (
          <SidebarMenu className="p-2">
            <SidebarMenuItem>
              <SidebarMenuButton 
                onClick={onAdminClick}
                className="w-full justify-start border-2 border-dashed border-muted-foreground/30 hover:border-muted-foreground/50 hover:bg-sidebar-accent"
              >
                <Settings className="w-4 h-4" />
                <span>Admin Dashboard</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-2">
        <Button 
          variant="ghost" 
          onClick={onLogout}
          className="w-full justify-start text-muted-foreground hover:text-foreground"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}