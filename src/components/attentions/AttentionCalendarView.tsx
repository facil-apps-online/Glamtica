import React, { useRef, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

import { UserAvatar } from "@/components/UserAvatar";
import { startOfDay } from 'date-fns';
import { Loader } from 'lucide-react';

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  allDay: boolean;
  backgroundColor?: string;
  borderColor?: string;
  display?: string;
  extendedProps?: any;
}

interface AttentionCalendarViewProps {
  events: CalendarEvent[];
  initialView?: string;
  currentDate?: Date;
  onDateSelect: (selectionInfo: any) => void;
  onEventClick: (eventInfo: any) => void;
  onDateChange?: (newDate: Date) => void;
  onViewChange?: (view: string) => void;
  isLoading?: boolean;
  userColorMap?: Map<string, string>;
  allUsers?: any[];
  screenSize: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  slotMinTime: string;
  slotMaxTime: string;
}

const AttentionCalendarView: React.FC<AttentionCalendarViewProps> = ({
  events,
  initialView = 'timeGridWeek',
  currentDate,
  onDateSelect,
  onEventClick,
  onDateChange,
  onViewChange,
  isLoading,
  userColorMap,
  allUsers,
  screenSize,
  slotMinTime,
  slotMaxTime
}) => {  const calendarRef = useRef<FullCalendar>(null);
  const isProgrammaticNavigation = useRef(false);

  useEffect(() => {
    if (currentDate && calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      const currentCalendarDate = calendarApi.getDate();
      if (startOfDay(currentDate).getTime() !== startOfDay(currentCalendarDate).getTime()) {
        isProgrammaticNavigation.current = true; // Set flag before programmatic navigation
        calendarApi.gotoDate(currentDate);
      }
    }
  }, [currentDate]);

  const handleDatesSet = (dateInfo: any) => {
    if (isProgrammaticNavigation.current) {
      isProgrammaticNavigation.current = false; // Reset flag after programmatic navigation
      // We still want to update the view state if it changed due to programmatic navigation
      if (onViewChange) {
        onViewChange(dateInfo.view.type);
      }
      return; // Don't update date if it was programmatic
    }

    const newDate = dateInfo.start;
    const newView = dateInfo.view.type;

    const dateChanged = !currentDate || startOfDay(newDate).getTime() !== startOfDay(currentDate).getTime();

    if (onDateChange && dateChanged) {
      onDateChange(newDate);
    }

    if (onViewChange && newView !== initialView) {
      onViewChange(newView);
    }
  };

  return (
    <div className="relative p-4 rounded-lg shadow-md text-sm md:text-base">
      <style>{`
        .dark .fc .fc-toolbar-title {
          color: hsl(var(--card-foreground));
        }
        .dark .fc .fc-button {
          background-color: hsl(var(--primary));
          color: hsl(var(--primary-foreground));
          border: none;
        }
        .dark .fc .fc-button:hover {
          background-color: hsl(var(--primary) / 0.9);
        }
        .dark .fc-theme-standard .fc-day-today {
          background-color: hsl(var(--accent)) !important;
        }
        .dark .fc-scrollgrid {
            border: none;
            border-collapse: collapse;
        }
        .dark .fc-theme-standard th,
        .dark .fc-theme-standard td {
          background-color: hsl(var(--card));
          border: 1px solid hsl(var(--border));
        }
        .dark .fc-timegrid-slot-label,
        .dark .fc-daygrid-day-number {
            color: hsl(var(--card-foreground));
        }
        .dark .fc-col-header-cell-cushion {
            color: hsl(var(--card-foreground));
        }
        .dark .fc a {
            color: hsl(var(--card-foreground));
        }
      `}</style>
      {isLoading && (
        <div className="absolute inset-0 bg-card/75 flex items-center justify-center z-10">
          <Loader className="animate-spin h-8 w-8 text-blue-600" />
        </div>
      )}

      {allUsers && allUsers.length > 0 && userColorMap && (
        <div className="mb-4 flex flex-wrap gap-x-4 gap-y-2 justify-center">
          {allUsers.map(user => (
            <div key={user.id} className="flex items-center gap-2">
                <UserAvatar
                    src={user.avatar_url}
                    alt={user.first_name}
                    fallback={user.first_name?.[0]}
                    borderColor={userColorMap.get(user.id) || '#ccc'}
                    className="h-8 w-8 border-2"
                />
              <span className="text-xs font-medium">{user.first_name}</span>
            </div>
          ))}
        </div>
      )}

      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        headerToolbar={screenSize === 'sm' || screenSize === 'md' ? {
          left: 'prev,next',
          center: 'title',
          right: 'today'
        } : {
          left: 'prev,next today',
          center: 'title',
          right: 'timeGridDay'
        }}
        initialView={initialView}
        weekends={true}
        events={events}
        locale="es"
        firstDay={1}
        editable={false}
        selectable={true}
        navLinks={false}
        select={onDateSelect}
        eventClick={onEventClick}
        datesSet={handleDatesSet}
        height="auto"
        contentHeight="auto"
        aspectRatio={1.5}
        allDaySlot={true}
        slotMinTime={slotMinTime}
        slotMaxTime={slotMaxTime}
        buttonText={{
          today: 'Hoy',
          month: 'Mes',
          week: 'Semana',
          day:   'Día',
        }}
      />
    </div>
  );
};

export default AttentionCalendarView;