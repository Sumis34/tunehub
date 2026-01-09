type ButtonProps = {
  children: React.ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

export default function Button({ children, ...buttonProps }: ButtonProps) {
  return (
    <button
      className="bg-neutral-800 px-4 py-3 active:bg-neutral-700 text-neutral-100 rounded-xl transition-all active:scale-95 scale-100"
      {...buttonProps}
    >
      {children}
    </button>
  );
}
