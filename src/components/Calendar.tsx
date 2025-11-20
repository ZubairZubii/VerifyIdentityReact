"use client"

import type React from "react"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

interface CalendarProps {
  type: string
  visible: boolean
  date: { month: number; year: number }
  selectDate: (type: string, date: string) => void
  handleMonthChange: (type: string, event: React.ChangeEvent<HTMLSelectElement>) => void
  handleYearChange: (type: string, event: React.ChangeEvent<HTMLSelectElement>) => void
  toggleCalendar: (type: string) => void
}

const Calendar: React.FC<CalendarProps> = ({
  type,
  visible,
  date,
  selectDate,
  handleMonthChange,
  handleYearChange,
  toggleCalendar,
}) => {
  const { month, year } = date
  const [selectedDay, setSelectedDay] = useState<number | null>(null)

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDayOfMonth = new Date(year, month, 1).getDay()
  const daysInPrevMonth = new Date(year, month, 0).getDate()

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
  ]

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  // Check if month navigation is allowed
  const canNavigateMonth = (direction: number) => {
    const currentDate = new Date()
    const currentYear = currentDate.getFullYear()
    const currentMonth = currentDate.getMonth()
    
    const newMonth = month + direction
    let newYear = year
    
    if (newMonth < 0) {
      newYear = year - 1
      const newMonthValue = 11
      return !(newYear > currentYear || (newYear === currentYear && newMonthValue > currentMonth))
    } else if (newMonth > 11) {
      newYear = year + 1
      const newMonthValue = 0
      return !(newYear > currentYear || (newYear === currentYear && newMonthValue > currentMonth))
    } else {
      return !(year > currentYear || (year === currentYear && newMonth > currentMonth))
    }
  }


  const isFutureDate = (day: number) => {
    const currentDate = new Date()
    const currentYear = currentDate.getFullYear()
    const currentMonth = currentDate.getMonth()
    const currentDay = currentDate.getDate()
    
    return year > currentYear || (year === currentYear && month > currentMonth) || 
           (year === currentYear && month === currentMonth && day > currentDay)
  }

  const handleDateSelect = (day: number) => {
    // Check if the selected date is in the future
    if (isFutureDate(day)) {
      return // Don't allow future date selection
    }
    
    setSelectedDay(day)
    selectDate(type, `${month + 1}/${day}/${year}`)
  }

  const navigateMonth = (direction: number, event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    event.nativeEvent.stopImmediatePropagation()
    
    const currentDate = new Date()
    const currentYear = currentDate.getFullYear()
    const currentMonth = currentDate.getMonth()
    
    const newMonth = month + direction
    let newYear = year
    
    if (newMonth < 0) {
      newYear = year - 1
      const newMonthValue = 11
      // Check if the new date is in the future
      if (newYear > currentYear || (newYear === currentYear && newMonthValue > currentMonth)) {
        return // Don't navigate to future
      }
      handleYearChange(type, { target: { value: newYear.toString() } } as any)
      handleMonthChange(type, { target: { value: newMonthValue.toString() } } as any)
    } else if (newMonth > 11) {
      newYear = year + 1
      const newMonthValue = 0
      // Check if the new date is in the future
      if (newYear > currentYear || (newYear === currentYear && newMonthValue > currentMonth)) {
        return // Don't navigate to future
      }
      handleYearChange(type, { target: { value: newYear.toString() } } as any)
      handleMonthChange(type, { target: { value: newMonthValue.toString() } } as any)
    } else {
      // Check if the new date is in the future
      if (year > currentYear || (year === currentYear && newMonth > currentMonth)) {
        return // Don't navigate to future
      }
      handleMonthChange(type, { target: { value: newMonth.toString() } } as any)
    }
  }

  // Generate year options for dropdown
  const generateYearOptions = () => {
    const currentDate = new Date()
    const currentYear = currentDate.getFullYear()
    const years = []
    
    // Generate years from current year down to 1900 (most recent first)
    for (let year = currentYear; year >= 1900; year--) {
      years.push(year)
    }
    
    return years
  }

  const yearOptions = generateYearOptions()


  const renderCalendarDays = () => {
    const days = []

    // Previous month's trailing days
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      days.push(
        <motion.div
          key={`prev-${daysInPrevMonth - i}`}
          className="calendar-day other-month"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          {daysInPrevMonth - i}
        </motion.div>,
      )
    }

    // Current month's days
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(
        <motion.div
          key={day}
          className={`calendar-day ${selectedDay === day ? "selected" : ""} ${isFutureDate(day) ? "future" : ""}`}
          onClick={() => handleDateSelect(day)}
          whileHover={!isFutureDate(day) ? { scale: 1.1 } : {}}
          whileTap={!isFutureDate(day) ? { scale: 0.9 } : {}}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: day * 0.01 }}
        >
          {day}
        </motion.div>,
      )
    }

    // Next month's leading days
    const totalCells = Math.ceil((firstDayOfMonth + daysInMonth) / 7) * 7
    const remainingCells = totalCells - (firstDayOfMonth + daysInMonth)
    for (let day = 1; day <= remainingCells; day++) {
      days.push(
        <motion.div
          key={`next-${day}`}
          className="calendar-day other-month"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          {day}
        </motion.div>,
      )
    }

    return days
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="modern-calendar"
          initial={{ opacity: 0, scale: 0.9, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -20 }}
          transition={{ duration: 0.3 }}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            e.nativeEvent.stopImmediatePropagation()
          }}
          onMouseDown={(e) => {
            e.preventDefault()
            e.stopPropagation()
            e.nativeEvent.stopImmediatePropagation()
          }}
        >
          {/* Mobile close button */}
          <div className="mobile-close-btn">
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                toggleCalendar(type)
              }}
              className="close-button"
              title="Close Calendar"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
          <div 
            className="calendar-header"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              e.nativeEvent.stopImmediatePropagation()
            }}
            onMouseDown={(e) => {
              e.preventDefault()
              e.stopPropagation()
              e.nativeEvent.stopImmediatePropagation()
            }}
          >
            <motion.button
              className={`calendar-nav ${!canNavigateMonth(-1) ? 'disabled' : ''}`}
              onClick={canNavigateMonth(-1) ? (e) => navigateMonth(-1, e) : undefined}
              whileHover={canNavigateMonth(-1) ? { scale: 1.1 } : {}}
              whileTap={canNavigateMonth(-1) ? { scale: 0.9 } : {}}
              type="button"
              disabled={!canNavigateMonth(-1)}
              title={!canNavigateMonth(-1) ? "Cannot go to future months" : "Previous Month"}
            >
              <i className="fas fa-chevron-left"></i>
            </motion.button>

            <div className="calendar-title">
              <div className="calendar-month-year">
                <h3>
                  &lt; {months[month]} {year} &gt;
                </h3>
                <div 
                  className="year-dropdown-container"
                  onClick={(e) => e.stopPropagation()}
                >
                  <select
                    className="year-dropdown"
                    value={year}
                    onChange={(e) => handleYearChange(type, e)}
                    title="Select Year"
                  >
                    {yearOptions.map((yearOption) => (
                      <option key={yearOption} value={yearOption}>
                        {yearOption}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <motion.button
              className={`calendar-nav ${!canNavigateMonth(1) ? 'disabled' : ''}`}
              onClick={canNavigateMonth(1) ? (e) => navigateMonth(1, e) : undefined}
              whileHover={canNavigateMonth(1) ? { scale: 1.1 } : {}}
              whileTap={canNavigateMonth(1) ? { scale: 0.9 } : {}}
              type="button"
              disabled={!canNavigateMonth(1)}
              title={!canNavigateMonth(1) ? "Cannot go to future months" : "Next Month"}
            >
              <i className="fas fa-chevron-right"></i>
            </motion.button>
          </div>

          <div className="calendar-grid">
            {weekDays.map((day) => (
              <div key={day} className="calendar-day" style={{ fontWeight: "bold", cursor: "default" }}>
                {day}
              </div>
            ))}
            {renderCalendarDays()}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default Calendar
