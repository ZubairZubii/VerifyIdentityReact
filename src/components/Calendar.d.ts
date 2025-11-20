import type React from "react";
interface CalendarProps {
    type: string;
    visible: boolean;
    date: {
        month: number;
        year: number;
    };
    selectDate: (type: string, date: string) => void;
    handleMonthChange: (type: string, event: React.ChangeEvent<HTMLSelectElement>) => void;
    handleYearChange: (type: string, event: React.ChangeEvent<HTMLSelectElement>) => void;
    toggleCalendar: (type: string) => void;
}
declare const Calendar: React.FC<CalendarProps>;
export default Calendar;
//# sourceMappingURL=Calendar.d.ts.map