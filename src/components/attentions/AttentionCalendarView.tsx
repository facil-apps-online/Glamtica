import React, { useRef, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

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
  allUsers
}) => {
  const calendarRef = useRef<FullCalendar>(null);
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
    console.log('handleDatesSet called. isProgrammaticNavigation.current:', isProgrammaticNavigation.current, 'dateInfo.start:', dateInfo.start);
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
    <div className="relative p-4 bg-white rounded-lg shadow-md text-sm md:text-base">
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
          <Loader className="animate-spin h-8 w-8 text-blue-600" />
        </div>
      )}

      {allUsers && allUsers.length > 0 && userColorMap && (
        <div className="mb-4 flex flex-wrap gap-x-4 gap-y-2 justify-center">
          {allUsers.map(user => (
            <div key={user.id} className="flex items-center gap-1">
              <span 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: userColorMap.get(user.id) || '#ccc' }}
              ></span>
              <span className="text-xs font-medium">{user.first_name}</span>
            </div>
          ))}
        </div>
      )}

      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'timeGridWeek,timeGridDay'
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