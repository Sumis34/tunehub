import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Settings2 } from "lucide-react";
import { useEffect, useState } from "react";
import useWeather from "../hooks/use-weather";
import QuickMenu from "./quick-menu";
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
    <>
      <QuickMenu>
        <div className="text-xl text-neutral-500 py-2 grid grid-cols-3 px-5">
          <p>{temperature ? `${temperature}°` : ""}</p>
          <p
            className="text-center"
            onClick={(e) => {
              if (e.detail === 3) {
                window.location.reload();
              }
            }}
          >
            {shortTimeFormatter.format(time)}
          </p>
          <p className="flex justify-end items-center">
            {location.pathname !== "/app/settings" ? (
              <Link to="/app/settings">
                <Settings2 className="w-6 h-6 text-neutral-500" />
              </Link>
            ) : (
              <Link to="/app/radio">
                <Home className="w-6 h-6 text-neutral-500" />
              </Link>
            )}
          </p>
        </div>
      </QuickMenu>
    </>
  );
}
