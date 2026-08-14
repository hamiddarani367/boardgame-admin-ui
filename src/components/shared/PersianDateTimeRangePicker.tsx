"use client";

import React from "react";
import DatePicker, { DateObject } from "react-multi-date-picker";
import TimePicker from "react-multi-date-picker/plugins/time_picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import { Calendar, X } from "lucide-react";

interface PersianDateTimeRangePickerProps {
  value?: {
    from: DateObject | null;
    to: DateObject | null;
  };
  onChange?: (value: { from: DateObject | null; to: DateObject | null }) => void;
  fromPlaceholder?: string;
  toPlaceholder?: string;
  className?: string;
}

function CustomInput({
  value,
  openCalendar,
  placeholder,
  prefixLabel,
  onClear,
}: {
  value?: string;
  openCalendar?: () => void;
  placeholder?: string;
  prefixLabel: string;
  onClear?: () => void;
}) {
  return (
    <div className="relative">
      <input
        value={value || ""}
        onClick={openCalendar}
        placeholder={placeholder}
        readOnly
        className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 pl-10 pr-8 text-sm text-right ring-offset-background focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      />
      {/* برچسب داخلی */}
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground pointer-events-none">
        {prefixLabel}
      </span>

      {/* آیکون تقویم */}
      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />

      {/* دکمه حذف */}
      {value && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClear?.();
          }}
          className="absolute left-9 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-muted"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      )}
    </div>
  );
}

function isSameDay(a: DateObject | null, b: DateObject | null): boolean {
  if (!a || !b) return false;
  return a.year === b.year && a.month === b.month && a.day === b.day;
}

export function PersianDateTimeRangePicker({
  value = { from: null, to: null },
  onChange,
  fromPlaceholder = "انتخاب تاریخ و زمان",
  toPlaceholder = "انتخاب تاریخ و زمان",
  className,
}: PersianDateTimeRangePickerProps) {
  const handleFromChange = (date: DateObject | null) => {
    if (!date) {
      onChange?.({ ...value, from: null });
      return;
    }

    let newFrom = date;

    // اگر روز تغییر کرده، ساعت را 00:00:00 قرار بده
    if (!isSameDay(value.from, date)) {
      newFrom = new DateObject({
        date: date.toDate(),
        calendar: persian,
        locale: persian_fa,
      }).set({
        hour: 0,
        minute: 0,
        second: 0,
        millisecond: 0,
      });
    }

    let newTo = value.to;

    // اگر شروع بعد از پایان باشد، پایان را برابر شروع قرار می‌دهیم
    if (newTo && newFrom.toDate().getTime() > newTo.toDate().getTime()) {
      newTo = newFrom;
    }

    onChange?.({ from: newFrom, to: newTo });
  };

  const handleToChange = (date: DateObject | null) => {
    if (!date) {
      onChange?.({ ...value, to: null });
      return;
    }

    let newTo = date;

    // اگر روز تغییر کرده، ساعت را 23:59:59 قرار بده
    if (!isSameDay(value.to, date)) {
      newTo = new DateObject({
        date: date.toDate(),
        calendar: persian,
        locale: persian_fa,
      }).set({
        hour: 23,
        minute: 59,
        second: 59,
        millisecond: 999,
      });
    }

    let newFrom = value.from;

    // اگر پایان قبل از شروع باشد، شروع را برابر پایان قرار می‌دهیم
    if (newFrom && newTo.toDate().getTime() < newFrom.toDate().getTime()) {
      newFrom = newTo;
    }

    onChange?.({ from: newFrom, to: newTo });
  };

  const handleClearFrom = () => {
    onChange?.({ ...value, from: null });
  };

  const handleClearTo = () => {
    onChange?.({ ...value, to: null });
  };

  return (
    <div className={`grid grid-cols-2 gap-2 ${className || ""}`}>
      {/* از */}
      <DatePicker
        value={value.from || null}
        onChange={handleFromChange}
        calendar={persian}
        locale={persian_fa}
        format="YYYY/MM/DD HH:mm"
        plugins={[<TimePicker position="bottom" key="from-time" />]}
        placeholder={fromPlaceholder}
        containerClassName="w-full"
        maxDate={value.to || undefined}
        onOpenPickNewDate={false} // ⬅️ جلوگیری از انتخاب خودکار تاریخ امروز
        render={(value, openCalendar) => (
          <CustomInput
            value={value}
            openCalendar={openCalendar}
            placeholder={fromPlaceholder}
            prefixLabel="از"
            onClear={handleClearFrom}
          />
        )}
      />

      {/* تا */}
      <DatePicker
        value={value.to || null}
        onChange={handleToChange}
        calendar={persian}
        locale={persian_fa}
        format="YYYY/MM/DD HH:mm"
        plugins={[<TimePicker position="bottom" key="to-time" />]}
        placeholder={toPlaceholder}
        containerClassName="w-full"
        minDate={value.from || undefined}
        onOpenPickNewDate={false} // ⬅️ جلوگیری از انتخاب خودکار تاریخ امروز
        render={(value, openCalendar) => (
          <CustomInput
            value={value}
            openCalendar={openCalendar}
            placeholder={toPlaceholder}
            prefixLabel="تا"
            onClear={handleClearTo}
          />
        )}
      />
    </div>
  );
}