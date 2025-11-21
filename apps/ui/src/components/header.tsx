import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Settings2, X } from "lucide-react";
import { useEffect, useState } from "react";
import useWeather from "../hooks/use-weather";
const locale = import.meta.env.VITE_LOCALE || "de-CH";

export default function Header() {
  const location = useRouterState({ select: (s) => s.location });

  const [time, setTime] = useState(new Date());

  const { temperature } = useWeather(47.0274, 7.74526);

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const shortTimeFormatter = new Intl.DateTimeFormat(locale, {
    timeStyle: "short",
  });
  return (
    <div className="text-xl text-white/70 font-medium py-2 grid grid-cols-3 px-5">
      <p>{temperature ? `${temperature}°` : ""}</p>
      <p className="text-center">{shortTimeFormatter.format(time)}</p>
      <p className="flex justify-end items-center">
        {location.pathname !== "/app/settings" ? (
          <Link to="/app/settings">
            <Settings2 className="w-6 h-6 stroke-white/70" />
          </Link>
        ) : (
          <Link to="/app/radio">
            <Home className="w-6 h-6 stroke-white/70" />
          </Link>
        )}
      </p>
    </div>
  );
}
