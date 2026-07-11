import { CalendarView } from "@/components/calendar/calendar-view";

export default function CalendarPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-white">Calendar</h2>
      <CalendarView />
    </div>
  );
}
