import { useState, useEffect } from "react";

const useFormLogic = () => {
  const [ownerType, setOwnerType] = useState<string>("");
  const [filePreviews, setFilePreviews] = useState<{ [key: string]: string }>(
    {}
  );
  const [calendarVisible, setCalendarVisible] = useState<{
    [key: string]: boolean;
  }>({
    today: false,
    birth: false,
  });
  const [calendarDate, setCalendarDate] = useState<{
    [key: string]: { month: number; year: number };
  }>(() => {
    const currentYear = new Date().getFullYear()
    const currentMonth = new Date().getMonth()
    console.log('Initializing calendar dates with year:', currentYear, 'month:', currentMonth)
    return {
      today: { month: currentMonth, year: currentYear },
      birth: { month: currentMonth, year: currentYear },
    }
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const calendarElements = document.querySelectorAll(".enhanced-calendar, .modern-calendar, .calendar-container");
      let isClickInside = false;
      calendarElements.forEach((calendar) => {
        if (calendar.contains(event.target as Node)) {
          isClickInside = true;
        }
      });
      if (!isClickInside) {
        setCalendarVisible({ today: false, birth: false });
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleOwnerTypeChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setOwnerType(event.target.value);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { id, files } = event.target;
    if (files && files.length > 0) {
      setFilePreviews((prev) => ({ ...prev, [id]: files[0].name }));
    }
  };

  const clearFileInput = (id: string) => {
    setFilePreviews((prev: { [key: string]: string }) => {
      const newPreviews = { ...prev };
      delete newPreviews[id];
      return newPreviews;
    });
    (document.getElementById(id) as HTMLInputElement).value = "";
  };

  const toggleCalendar = (type: string) => {
    setCalendarVisible((prev: { [key: string]: boolean }) => ({
      ...prev,
      [type]: !prev[type],
    }));
  };

  const selectDate = (type: string, date: string) => {
    (document.getElementById(`${type}Date`) as HTMLInputElement).value = date;
    toggleCalendar(type);
  };

  const handleMonthChange = (
    type: string,
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const month = parseInt(event.target.value);
    setCalendarDate((prev) => ({ ...prev, [type]: { ...prev[type], month } }));
  };

  const handleYearChange = (
    type: string,
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const year = parseInt(event.target.value);
    console.log('handleYearChange - type:', type, 'new year:', year, 'event target value:', event.target.value);
    setCalendarDate(
      (prev: { [key: string]: { month: number; year: number } }) => {
        const newState = {
          ...prev,
          [type]: { ...prev[type], year },
        };
        console.log('Updated calendar date state:', newState);
        return newState;
      }
    );
  };

  const renderCalendar = (type: string) => {
    const { month, year } = calendarDate[type];
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days = [];
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(
        <div
          key={i}
          className="calendarDay"
          onClick={() => selectDate(type, `${month + 1}/${i}/${year}`)}
        >
          {i}
        </div>
      );
    }

    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    const years = [];
    for (
      let i = new Date().getFullYear();
      i >= new Date().getFullYear() - 100;
      i--
    ) {
      years.push(i);
    }

    return (
      <div
        className={`calendar ${calendarVisible[type] ? "" : "calendarHidden"}`}
      >
        <div className="calendarHeader">
          <select value={month} onChange={(e) => handleMonthChange(type, e)}>
            {months.map((m, index) => (
              <option key={index} value={index}>
                {m}
              </option>
            ))}
          </select>
          <select value={year} onChange={(e) => handleYearChange(type, e)}>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
        <div className="calendarGrid">{days}</div>
      </div>
    );
  };

  return {
    ownerType,
    filePreviews,
    calendarVisible,
    calendarDate,
    handleOwnerTypeChange,
    handleFileUpload,
    clearFileInput,
    toggleCalendar,
    selectDate,
    handleMonthChange,
    handleYearChange,
    renderCalendar,
  };
};

export { useFormLogic };
