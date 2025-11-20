declare const useFormLogic: () => {
    ownerType: string;
    filePreviews: {
        [key: string]: string;
    };
    calendarVisible: {
        [key: string]: boolean;
    };
    calendarDate: {
        [key: string]: {
            month: number;
            year: number;
        };
    };
    handleOwnerTypeChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
    handleFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
    clearFileInput: (id: string) => void;
    toggleCalendar: (type: string) => void;
    selectDate: (type: string, date: string) => void;
    handleMonthChange: (type: string, event: React.ChangeEvent<HTMLSelectElement>) => void;
    handleYearChange: (type: string, event: React.ChangeEvent<HTMLSelectElement>) => void;
    renderCalendar: (type: string) => import("react/jsx-runtime").JSX.Element;
};
export { useFormLogic };
//# sourceMappingURL=useFormLogic.d.ts.map