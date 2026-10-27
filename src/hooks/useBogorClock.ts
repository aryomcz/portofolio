"use client";

import { useEffect, useState } from "react";

/**
 * Live tabular-nums clock for Bogor, Indonesia (UTC+7 / Asia/Jakarta).
 */
export function useBogorClock(): string {
  const [timeString, setTimeString] = useState<string>("--:--:-- WIB");

  useEffect(() => {
    const formatter = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Jakarta",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });

    const updateClock = () => {
      setTimeString(`${formatter.format(new Date())} WIB`);
    };

    updateClock();
    const intervalId = window.setInterval(updateClock, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  return timeString;
}
