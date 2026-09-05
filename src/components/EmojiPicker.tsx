import { useEffect, useId, useRef, useState } from 'react'

const EMOJIS = [
  '🧡', '💙', '❤️', '💛', '💚', '💜', '🤍', '🖤',
  '🏀', '⚡️', '📸', '🎉', '✨', '🔥', '🙌', '👏',
  '😊', '😍', '🥳', '🙏', '💪', '🌟', '☀️', '🌙',
  '✅', '➡️', '🔗', '📍', '🛒', '👕', '🌸', '🍦',
]

type Props = {
  disabled?: boolean
  onPick: (emoji: string) => void
  buttonClassName: string
}

export function EmojiPicker({ disabled, onPick, buttonClassName }: Props) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const menuId = useId()

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPointer)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onPointer)
    }
  }, [open])

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        className={`${buttonClassName} font-emoji`}
        disabled={disabled}
        aria-label="Insert emoji"
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((v) => !v)}
      >
        😊
      </button>
      {open && (
        <div
          id={menuId}
          role="listbox"
          aria-label="Emojis"
          className="absolute left-0 z-30 mt-1 grid w-[16.5rem] grid-cols-8 gap-0.5 rounded-control bg-surface p-2 shadow-panel"
        >
          {EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              role="option"
              className="font-emoji flex h-8 w-8 items-center justify-center rounded text-lg hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
              onClick={() => {
                onPick(emoji)
                setOpen(false)
              }}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
