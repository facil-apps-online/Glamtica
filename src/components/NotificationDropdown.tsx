import { useNotificationStore, Notification } from '../stores/notificationStore';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { cn } from '../lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { MailOpen } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

export const NotificationDropdown = () => {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
  } = useNotificationStore();
  const navigate = useNavigate();

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read_at) {
      markAsRead(notification.id);
    }
    if (notification.link_to) {
      navigate(notification.link_to);
    }
  };

  return (
    <div>
      <div className="p-3 pb-2 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Notificaciones</h3>
        {unreadCount > 0 && (
          <TooltipProvider delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={markAllAsRead} className="h-8 w-8">
                  <MailOpen className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Marcar todas como leídas</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      <ScrollArea className="h-96">
        {notifications.length === 0 ? (
          <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
            <p>No tienes notificaciones.</p>
          </div>
        ) : (
          <div className="p-2">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={cn(
                  'p-3 rounded-lg cursor-pointer hover:bg-accent',
                  !notification.read_at && 'bg-blue-50 dark:bg-blue-900/20'
                )}
              >
                <div className="flex items-start gap-3">
                  {!notification.read_at && (
                    <div className="h-2 w-2 rounded-full bg-blue-500 mt-1.5"></div>
                  )}
                  <div className={cn('flex-1 min-w-0 overflow-hidden', notification.read_at && 'pl-5')}>
                    <p className="font-semibold text-sm">{notification.title}</p>
                    <p className="text-xs text-muted-foreground">{notification.body}</p>
                    <p className="text-xs text-blue-500 mt-1">
                      {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: es })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};
