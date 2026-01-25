import { Slider } from "@base-ui-components/react";

export default function TouchSlider({
  onValueChange,
  value,
  icon,
}: {
  onValueChange?: (value: number) => void;
  className?: string;
  value?: number;
  icon?: React.ReactNode;
}) {
  return (
    <Slider.Root
      defaultValue={25}
      value={value}
      min={10}
      max={100}
      step={1}
      onValueChange={onValueChange}
      orientation="horizontal"
      className={"relative"}
    >
      <div className="absolute inset-0 flex items-center justify-start px-2 pointer-events-none z-10">
        {icon}
      </div>
      <Slider.Control>
        <Slider.Track
          className={"bg-neutral-800 w-full h-14 rounded-xl overflow-hidden"}
        >
          <Slider.Indicator
            className={"bg-neutral-100 h-14 rounded-xl "}
          ></Slider.Indicator>
          <Slider.Thumb className={""} />
        </Slider.Track>
      </Slider.Control>
    </Slider.Root>
  );
}
