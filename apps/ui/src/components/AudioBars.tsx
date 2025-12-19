type Props = {
  playing?: boolean;
  className?: string;
  color?: string;
};

export default function AudioBars({ playing = false, className = "" }: Props) {
  // animation durations/delays per bar (ms)
  const configs = [
    { dur: 900, delay: 0 },
    { dur: 1500, delay: 120 },
    { dur: 700, delay: 260 },
  ];

  return (
    <div
      className={`inline-flex items-end gap-1 h-7 ${className}`.trim()}
      aria-hidden
    >
      {configs.map((c, i) => {
        // use CSS variable names defined in main css (@theme)
        const animVar = playing ? "var(--animate-play)" : "var(--animate-idle)";
        const style: React.CSSProperties = {
          animation: `${animVar} ${c.dur}ms linear ${c.delay}ms infinite`,
        };

        return (
          <div
            key={i}
            style={style}
            className={`w-1 h-full origin-bottom bg-blue-400 rounded-sm`}
          />
        );
      })}
    </div>
  );
}
