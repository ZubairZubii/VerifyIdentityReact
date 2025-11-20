import type React from "react";
interface Birthday {
    name: string;
    date: string;
    color?: string;
}
interface EnhancedCalendarProps {
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
    birthdays?: Birthday[];
}
declare const EnhancedCalendar: React.FC<EnhancedCalendarProps>;
export default EnhancedCalendar;
//# sourceMappingURL=EnhancedCalendar.d.ts.map