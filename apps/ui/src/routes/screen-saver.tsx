import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

const locale = import.meta.env.VITE_LOCALE || "de-CH";

export const Route = createFileRoute("/screen-saver")({
  component: RouteComponent,
});

function RouteComponent() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const shortTimeFormatter = new Intl.DateTimeFormat(locale, {
    timeStyle: "short",
  });

  const weekdayFormatter = new Intl.DateTimeFormat(locale, {
    weekday: "long",
  });
  const dayFormatter = new Intl.DateTimeFormat(locale, { day: "numeric" });
  const monthFormatter = new Intl.DateTimeFormat(locale, { month: "long" });

  const shortDateFormatter = {
    format: (d: Date) => {
      const weekday = weekdayFormatter.format(d);
      const day = dayFormatter.format(d);
      const month = monthFormatter.format(d);
      return `${weekday}, ${day}. ${month}`;
    },
  };

  return (
    <Link
      to="/radio"
      className="bg-black w-full h-full flex items-center justify-center"
    >
      <div className="text-center">
        <h1 className="text-8xl text-white">
          {shortTimeFormatter.format(time)}
        </h1>
        <h2 className="text-2xl text-white/50">
          {shortDateFormatter.format(time)}
        </h2>
      </div>
    </Link>
  );
}
