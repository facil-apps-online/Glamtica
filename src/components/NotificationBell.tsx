import { Bell } from 'lucide-react';
import { useNotificationStore } from '../stores/notificationStore';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { NotificationDropdown } from './NotificationDropdown';

export const NotificationBell = () => {
  const unreadCount = useNotificationStore((state) => state.unreadCount);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <div className="relative p-2 hover:bg-accent rounded-lg cursor-pointer transition-colors">
          <Bell className="h-6 w-6" />
          {unreadCount > 0 && (
            <div className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </div>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent align="end" className="p-0 w-80 sm:w-96">
        <NotificationDropdown />
      </PopoverContent>
    </Popover>
  );
};
