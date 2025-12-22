import { useMemo } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface DateDropdownsProps {
  value?: Date;
  onChange: (date: Date | undefined) => void;
  fromYear?: number;
  toYear?: number;
  placeholder?: {
    day?: string;
    month?: string;
    year?: string;
  };
  className?: string;
}

const months = [
  { value: "0", label: "January" },
  { value: "1", label: "February" },
  { value: "2", label: "March" },
  { value: "3", label: "April" },
  { value: "4", label: "May" },
  { value: "5", label: "June" },
  { value: "6", label: "July" },
  { value: "7", label: "August" },
  { value: "8", label: "September" },
  { value: "9", label: "October" },
  { value: "10", label: "November" },
  { value: "11", label: "December" },
];

const DateDropdowns = ({
  value,
  onChange,
  fromYear = 1920,
  toYear = new Date().getFullYear(),
  placeholder = { day: "DD", month: "MM", year: "YYYY" },
  className = "",
}: DateDropdownsProps) => {
  const selectedDay = value ? value.getDate().toString() : "";
  const selectedMonth = value ? value.getMonth().toString() : "";
  const selectedYear = value ? value.getFullYear().toString() : "";

  // Generate years array (descending for easier selection)
  const years = useMemo(() => {
    const yearsArray = [];
    for (let year = toYear; year >= fromYear; year--) {
      yearsArray.push(year.toString());
    }
    return yearsArray;
  }, [fromYear, toYear]);

  // Generate days based on selected month and year
  const days = useMemo(() => {
    const daysArray = [];
    let maxDays = 31;

    if (selectedMonth && selectedYear) {
      const month = parseInt(selectedMonth);
      const year = parseInt(selectedYear);
      maxDays = new Date(year, month + 1, 0).getDate();
    } else if (selectedMonth) {
      const month = parseInt(selectedMonth);
      // Use a leap year to get max possible days for the month
      maxDays = new Date(2024, month + 1, 0).getDate();
    }

    for (let day = 1; day <= maxDays; day++) {
      daysArray.push(day.toString());
    }
    return daysArray;
  }, [selectedMonth, selectedYear]);

  const handleDayChange = (day: string) => {
    if (selectedMonth && selectedYear) {
      const newDate = new Date(parseInt(selectedYear), parseInt(selectedMonth), parseInt(day));
      onChange(newDate);
    } else if (selectedYear) {
      // Default to January if no month selected
      const newDate = new Date(parseInt(selectedYear), 0, parseInt(day));
      onChange(newDate);
    } else {
      // Default to current year and January
      const newDate = new Date(new Date().getFullYear(), 0, parseInt(day));
      onChange(newDate);
    }
  };

  const handleMonthChange = (month: string) => {
    const year = selectedYear ? parseInt(selectedYear) : new Date().getFullYear();
    let day = selectedDay ? parseInt(selectedDay) : 1;
    
    // Adjust day if it exceeds the max days in the new month
    const maxDays = new Date(year, parseInt(month) + 1, 0).getDate();
    if (day > maxDays) day = maxDays;
    
    const newDate = new Date(year, parseInt(month), day);
    onChange(newDate);
  };

  const handleYearChange = (year: string) => {
    const month = selectedMonth ? parseInt(selectedMonth) : 0;
    let day = selectedDay ? parseInt(selectedDay) : 1;
    
    // Adjust day if it exceeds the max days (e.g., Feb 29 in non-leap year)
    const maxDays = new Date(parseInt(year), month + 1, 0).getDate();
    if (day > maxDays) day = maxDays;
    
    const newDate = new Date(parseInt(year), month, day);
    onChange(newDate);
  };

  return (
    <div className={`flex gap-2 ${className}`}>
      {/* Day */}
      <Select value={selectedDay} onValueChange={handleDayChange}>
        <SelectTrigger className="w-[70px] bg-muted">
          <SelectValue placeholder={placeholder.day} />
        </SelectTrigger>
        <SelectContent className="max-h-[200px] bg-popover z-50">
          {days.map((day) => (
            <SelectItem key={day} value={day}>
              {day.padStart(2, "0")}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Month */}
      <Select value={selectedMonth} onValueChange={handleMonthChange}>
        <SelectTrigger className="w-[110px] bg-muted">
          <SelectValue placeholder={placeholder.month} />
        </SelectTrigger>
        <SelectContent className="max-h-[200px] bg-popover z-50">
          {months.map((month) => (
            <SelectItem key={month.value} value={month.value}>
              {month.label.slice(0, 3)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Year */}
      <Select value={selectedYear} onValueChange={handleYearChange}>
        <SelectTrigger className="w-[90px] bg-muted">
          <SelectValue placeholder={placeholder.year} />
        </SelectTrigger>
        <SelectContent className="max-h-[200px] bg-popover z-50">
          {years.map((year) => (
            <SelectItem key={year} value={year}>
              {year}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default DateDropdowns;
