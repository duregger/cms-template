import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import type { CmsPageAeo, CmsPageFaq, CmsPageSeo } from '@/types/cms'
import { uploadCmsAsset } from '@/lib/storage'
import { joinList, splitList } from '@/lib/page-discovery'
import { ChevronDown } from '@/components/icons/ChevronDown'

const FIELD =
  'rounded-control border-hairline px-3 py-2 text-sm border-2 focus:border-brand-primary focus:outline-none focus-visible:ring-0'

function ListInput({
  values,
  onCommit,
  placeholder,
}: {
  values: string[] | undefined
  onCommit: (next: string[]) => void
  placeholder?: string
}) {
  const joined = joinList(values)
  const [draft, setDraft] = useState(joined)
  const [focused, setFocused] = useState(false)
  useEffect(() => {
    if (!focused) setDraft(joined)
  }, [joined, focused])

  return (
    <input
      type="text"
      value={draft}
      onChange={(e) => {
        setDraft(e.target.value)
        onCommit(splitList(e.target.value))
      }}
      onFocus={() => setFocused(true)}
      onBlur={() => {
        setFocused(false)
        onCommit(splitList(draft))
      }}
      placeholder={placeholder}
      className={FIELD}
    />
  )
}

function Group({
  title,
  subtitle,
  defaultOpen = false,
  children,
}: {
  title: string
  subtitle?: string
  defaultOpen?: boolean
  children: ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  const panelId = useId()
  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-0 py-3 text-start"
      >
        <span>
          <span className="text-xs font-medium uppercase tracking-wider text-text-subtle">{title}</span>
          {subtitle ? (
            <span className="mt-0.5 block text-xs font-normal text-text-muted">{subtitle}</span>
          ) : null}
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-text-subtle transition ${open ? 'rotate-180' : ''}`} />
      </button>
      {open ? (
        <div id={panelId} className="grid gap-4 pb-5 sm:grid-cols-2">
          {children}
        </div>
      ) : null}
    </div>
  )
}

function ImageField({
  label,
  value,
  fallbackUrl,
  onChange,
}: {
  label: string
  value: string
  fallbackUrl?: string
  onChange: (url: string) => void
}) {
  const preview = value || fallbackUrl
  return (
    <div className="flex flex-col gap-1 sm:col-span-2">
      <span className="text-xs font-medium text-text-muted">{label}</span>
      <div className="flex items-center gap-3">
        <input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={fallbackUrl || 'https://…'}
          className={`min-w-0 flex-1 ${FIELD}`}
        />
        <label className="flex shrink-0 cursor-pointer items-center rounded-control border border-hairline bg-hairline-soft px-4 py-2 text-xs font-medium text-text-muted transition-colors duration-state hover:bg-hairline-soft">
          Upload
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={async (e) => {
              const file = e.target.files?.[0]
              if (!file) return
              try {
                onChange(await uploadCmsAsset(file, 'og'))
              } catch (err) {
                console.error('Discovery image upload failed', err)
              }
              e.target.value = ''
            }}
          />
        </label>
      </div>
      {preview ? (
        <img src={preview} alt="" className="mt-2 h-24 w-auto rounded-tile border border-hairline object-cover" />
      ) : null}
    </div>
  )
}

function emptyFaq(): CmsPageFaq {
  return { id: crypto.randomUUID(), question: '', answer: '' }
}

type Props = {
  seo: CmsPageSeo
  aeo: CmsPageAeo
  heroImageUrl?: string
  onSeo: (next: CmsPageSeo) => void
  onAeo: (next: CmsPageAeo) => void
}

export function PageDiscoveryPanel({
  seo,
  aeo,
  heroImageUrl,
  onSeo,
  onAeo,
}: Props) {
  const [open, setOpen] = useState(false)
  const panelId = useId()
  const fallbackFaq = useRef<CmsPageFaq | null>(null)
  if (!fallbackFaq.current) fallbackFaq.current = emptyFaq()
  const faqs = aeo.faqs?.length ? aeo.faqs : [fallbackFaq.current]

  return (
    <section className="mb-8 divide-y divide-hairline rounded-panel bg-surface shadow-panel">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-6 py-4 text-start"
      >
        <span>
          <h2 className="font-label text-sm text-brand-ink">Page discovery</h2>
          <span className="mt-0.5 block text-xs text-text-muted">
            Listings, share cards, and spoken answers
          </span>
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-text-subtle transition ${open ? 'rotate-180' : ''}`} />
      </button>

      {open ? (
        <div id={panelId} className="divide-y divide-hairline px-6">
          <Group title="SEO" subtitle="Search listing optimization">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-text-muted">Title</span>
              <input
                type="text"
                value={seo.title ?? ''}
                onChange={(e) => onSeo({ ...seo, title: e.target.value })}
                className={FIELD}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-text-muted">Canonical URL</span>
              <input
                type="url"
                value={seo.canonical ?? ''}
                onChange={(e) => onSeo({ ...seo, canonical: e.target.value })}
                className={FIELD}
              />
            </label>
            <label className="flex flex-col gap-1 sm:col-span-2">
              <span className="text-xs font-medium text-text-muted">Description</span>
              <textarea
                rows={2}
                value={seo.description ?? ''}
                onChange={(e) => onSeo({ ...seo, description: e.target.value })}
                className={FIELD}
              />
            </label>
            <label className="flex flex-col gap-1 sm:col-span-2">
              <span className="text-xs font-medium text-text-muted">Keywords</span>
              <ListInput
                values={seo.keywords}
                onCommit={(keywords) => onSeo({ ...seo, keywords })}
                placeholder="homelessness, street paper, Oklahoma City"
              />
            </label>
            <ImageField
              label="Image"
              value={seo.image ?? ''}
              fallbackUrl={heroImageUrl}
              onChange={(image) => onSeo({ ...seo, image })}
            />
            <label className="flex items-center gap-2 sm:col-span-2">
              <input
                type="checkbox"
                checked={seo.noIndex ?? false}
                onChange={(e) => onSeo({ ...seo, noIndex: e.target.checked })}
                className="h-4 w-4 rounded border-hairline text-brand-primary focus:ring-brand-primary"
              />
              <span className="text-xs font-medium text-text-muted">Hide from search engines</span>
            </label>
          </Group>

          <Group title="AEO" subtitle="Answer Engine Optimization">
            <label className="flex flex-col gap-1 sm:col-span-2">
              <span className="text-xs font-medium text-text-muted">Speakable summary of page</span>
              <textarea
                rows={2}
                value={aeo.speakable ?? ''}
                onChange={(e) => onAeo({ ...aeo, speakable: e.target.value })}
                className={FIELD}
              />
            </label>
            <div className="sm:col-span-2">
              <div className="mb-3 flex items-center justify-between gap-3">
                <span className="text-xs font-medium text-text-muted">Questions and answers</span>
                <button
                  type="button"
                  onClick={() => onAeo({ ...aeo, faqs: [...faqs, emptyFaq()] })}
                  className="rounded-pill border border-hairline px-3 py-1 text-xs font-medium text-brand-ink transition-colors duration-state hover:bg-hairline-soft"
                >
                  Add question
                </button>
              </div>
              {faqs.map((faq, idx) => (
                <div key={faq.id} className="mb-5 grid gap-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-text-muted">
                      {faqs.length > 1 ? `Question ${idx + 1}` : 'Question'}
                    </span>
                    {faqs.length > 1 ? (
                      <button
                        type="button"
                        onClick={() => onAeo({ ...aeo, faqs: faqs.filter((item) => item.id !== faq.id) })}
                        className="text-xs text-danger hover:underline"
                      >
                        Remove
                      </button>
                    ) : null}
                  </div>
                  <label className="flex flex-col gap-1">
                    <span className="sr-only">Question {idx + 1}</span>
                    <input
                      type="text"
                      value={faq.question}
                      onChange={(e) =>
                        onAeo({
                          ...aeo,
                          faqs: faqs.map((item) =>
                            item.id === faq.id ? { ...item, question: e.target.value } : item,
                          ),
                        })
                      }
                      placeholder="What is Curbside?"
                      className={FIELD}
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-text-muted">Answer</span>
                    <textarea
                      rows={3}
                      value={faq.answer}
                      onChange={(e) =>
                        onAeo({
                          ...aeo,
                          faqs: faqs.map((item) =>
                            item.id === faq.id ? { ...item, answer: e.target.value } : item,
                          ),
                        })
                      }
                      placeholder="A short answer the site can speak or cite."
                      className={FIELD}
                    />
                  </label>
                </div>
              ))}
            </div>
          </Group>
        </div>
      ) : null}
    </section>
  )
}
