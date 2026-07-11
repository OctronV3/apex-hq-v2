"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  isToday,
  parseISO,
} from "date-fns";
import { ChevronLeft, ChevronRight, CalendarDays, List } from "lucide-react";
import { useCalendarEvents } from "@/hooks/use-apex";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function CalendarEventDot({ color }: { color: string }) {
  return (
    <span
      className="inline-block h-2 w-2 rounded-full"
      style={{ backgroundColor: color }}
    />
  );
}

function CalendarDay({
  day,
  currentMonth,
  events,
  onSelect,
}: {
  day: Date;
  currentMonth: Date;
  events: { id: string; title: string; color: string; link: string }[];
  onSelect: (d: Date) => void;
}) {
  const isCurrentMonth = isSameMonth(day, currentMonth);
  const isTodayDate = isToday(day);

  return (
    <div
      onClick={() => onSelect(day)}
      className={`min-h-[80px] cursor-pointer border-r border-b border-[#222222] p-2 transition-colors hover:bg-[#111111] ${
        isCurrentMonth ? "bg-[#0a0a0a]" : "bg-[#050505]"
      }`}
    >
      <div className="flex items-center justify-between">
        <span
          className={`text-xs ${
            isTodayDate
              ? "rounded bg-[#ff1a1a] px-1.5 py-0.5 text-white"
              : isCurrentMonth
              ? "text-white"
              : "text-[#555555]"
          }`}
        >
          {format(day, "d")}
        </span>
      </div>
      <div className="mt-1 space-y-1">
        {events.slice(0, 3).map((event) => (
          <div
            key={event.id}
            className="flex items-center gap-1.5 overflow-hidden text-[10px] text-[#aaaaaa]"
            title={event.title}
          >
            <CalendarEventDot color={event.color} />
            <span className="truncate">{event.title}</span>
          </div>
        ))}
        {events.length > 3 && (
          <p className="text-[10px] text-[#666666]">+{events.length - 3} more</p>
        )}
      </div>
    </div>
  );
}

export function CalendarView() {
  const router = useRouter();
  const { data: events, isLoading } = useCalendarEvents();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<"month" | "week">("month");

  const eventsByDay = (events || []).map((event) => ({
    ...event,
    dateObj: parseISO(event.date),
  }));

  function eventsForDay(day: Date) {
    return eventsByDay
      .filter((e) => isSameDay(e.dateObj, day))
      .map((e) => ({ id: e.id, title: e.title, color: e.color, link: e.link }));
  }

  function navigate(direction: "prev" | "next") {
    if (view === "month") {
      setCurrentDate(direction === "prev" ? subMonths(currentDate, 1) : addMonths(currentDate, 1));
    } else {
      setCurrentDate(direction === "prev" ? subWeeks(currentDate, 1) : addWeeks(currentDate, 1));
    }
  }

  function goToToday() {
    setCurrentDate(new Date());
  }

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const weekStart = startOfWeek(currentDate);
  const weekEnd = endOfWeek(currentDate);
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  if (isLoading) {
    return (
      <Card className="border-[#222222] bg-[#0a0a0a]">
        <CardContent className="h-96 animate-pulse rounded bg-[#111111]" />
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("prev")}
            className="text-white hover:bg-[#111111]"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-semibold text-white min-w-[180px] text-center">
            {view === "month" ? format(currentDate, "MMMM yyyy") : `${format(weekStart, "MMM d")} - ${format(weekEnd, "MMM d, yyyy")}`}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("next")}
            className="text-white hover:bg-[#111111]"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={goToToday}
            className="border-[#222222] bg-[#111111] text-white hover:bg-[#222222]"
          >
            Today
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={view === "month" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("month")}
            className={`text-sm ${
              view === "month"
                ? "bg-[#ff1a1a] text-white hover:bg-[#d60a0a]"
                : "border-[#222222] bg-[#111111] text-white hover:bg-[#222222]"
            }`}
          >
            <CalendarDays className="mr-1 h-4 w-4" /> Month
          </Button>
          <Button
            variant={view === "week" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("week")}
            className={`text-sm ${
              view === "week"
                ? "bg-[#ff1a1a] text-white hover:bg-[#d60a0a]"
                : "border-[#222222] bg-[#111111] text-white hover:bg-[#222222]"
            }`}
          >
            <List className="mr-1 h-4 w-4" /> Week
          </Button>
        </div>
      </div>

      {view === "month" ? (
        <Card className="border-[#222222] bg-[#0a0a0a]">
          <CardContent className="p-0">
            <div className="grid grid-cols-7 border-b border-[#222222]">
              {WEEKDAYS.map((day) => (
                <div key={day} className="p-2 text-center text-xs font-medium text-[#888888]">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {days.map((day) => (
                <CalendarDay
                  key={day.toISOString()}
                  day={day}
                  currentMonth={monthStart}
                  events={eventsForDay(day)}
                  onSelect={(d) => {
                    setCurrentDate(d);
                    setView("week");
                  }}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-[#222222] bg-[#0a0a0a]">
          <CardHeader>
            <CardTitle className="text-white text-base">Weekly agenda</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {weekDays.map((day) => {
              const dayEvents = eventsForDay(day);
              const isTodayDate = isToday(day);
              return (
                <div
                  key={day.toISOString()}
                  className={`rounded border border-[#222222] p-3 ${
                    isTodayDate ? "bg-[#111111]" : "bg-[#0a0a0a]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className={`text-sm font-medium ${isTodayDate ? "text-[#ff1a1a]" : "text-white"}`}>
                      {format(day, "EEEE, MMM d")}
                    </p>
                    <span className="text-xs text-[#888888]">{dayEvents.length} events</span>
                  </div>
                  <div className="mt-2 space-y-2">
                    {dayEvents.length ? (
                      dayEvents.map((event) => (
                        <button
                          key={event.id}
                          onClick={() => router.push(event.link)}
                          className="flex w-full items-center gap-2 rounded p-1.5 text-left text-sm text-[#aaaaaa] hover:bg-[#222222]"
                        >
                          <CalendarEventDot color={event.color} />
                          {event.title}
                        </button>
                      ))
                    ) : (
                      <p className="text-sm text-[#666666]">No events</p>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      <Card className="border-[#222222] bg-[#0a0a0a]">
        <CardHeader>
          <CardTitle className="text-white text-base">Upcoming</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {(events || [])
              .filter((e) => parseISO(e.date) >= new Date())
              .slice(0, 10)
              .map((event) => (
                <button
                  key={event.id}
                  onClick={() => router.push(event.link)}
                  className="flex w-full items-center justify-between rounded border border-[#222222] bg-[#111111] p-3 text-left hover:border-[#333333]"
                >
                  <div className="flex items-center gap-2">
                    <CalendarEventDot color={event.color} />
                    <span className="text-sm text-white">{event.title}</span>
                  </div>
                  <span className="text-xs text-[#888888]">{format(parseISO(event.date), "MMM d")}</span>
                </button>
              ))}
            {!events?.filter((e) => parseISO(e.date) >= new Date()).length && (
              <p className="text-sm text-[#666666]">No upcoming events.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
