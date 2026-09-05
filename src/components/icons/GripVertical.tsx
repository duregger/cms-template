export function GripVertical({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 16"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <circle cx="5.5" cy="3" r="1.15" />
      <circle cx="10.5" cy="3" r="1.15" />
      <circle cx="5.5" cy="8" r="1.15" />
      <circle cx="10.5" cy="8" r="1.15" />
      <circle cx="5.5" cy="13" r="1.15" />
      <circle cx="10.5" cy="13" r="1.15" />
    </svg>
  )
}
