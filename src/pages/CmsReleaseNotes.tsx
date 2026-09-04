interface CmsRelease {
  version: string
  date: string
  groups: { heading: string; items: string[] }[]
}

const RELEASES: CmsRelease[] = [
  {
    version: '1.1.1',
    date: 'August 25, 2026',
    groups: [
      {
        heading: 'Fixes',
        items: [
          'Refreshing the page no longer flashes the default accent color before your saved one loads',
          'Fixed a handful of leftover unstyled spots — the delete-section confirmation dialog, status toasts, and a few small badges now match the rest of the redesign',
        ],
      },
    ],
  },
  {
    version: '1.1.0',
    date: 'August 25, 2026',
    groups: [
      {
        heading: 'Admin Redesign',
        items: [
          'A refreshed look for the CMS itself — concentric corner radii, a hairline-and-shadow system, and consistent motion timing across every screen',
          'The nav rail now carries a soft wash of the CMS accent color; the rest of the interface stays clean white',
          'Buttons and content cards match the new design system spec — accent-filled buttons compute their own readable text color, and cards use a double-outline “mat” treatment instead of a plain border',
        ],
      },
      {
        heading: 'Account',
        items: [
          'A new account menu in the top right — update your display name and profile photo without touching your email or Google account',
          'Pick the CMS’s own accent color from a set of design-system presets; the whole interface retints instantly',
        ],
      },
    ],
  },
  {
    version: '1.0.0',
    date: 'July 29, 2026',
    groups: [
      {
        heading: 'Platform',
        items: [
          'BEGIN the work CMS launches on a new, modern platform',
          'Content is organized by space \u2014 Web, Apps, Kiosk, and Alerts \u2014 each managed independently',
          'Firestore-backed content with Firebase Storage for image and asset uploads',
          'Google sign-in with access limited to authorized accounts',
        ],
      },
      {
        heading: 'Design Tokens',
        items: [
          'Define a space\u2019s brand by uploading colors, typography, and sizing as a JSON file',
          'Tokens are managed per space, with a draft you can preview before it goes live',
          'Publish to push a space\u2019s tokens to its connected site and update its look in one step',
        ],
      },
    ],
  },
]

export function CmsReleaseNotes() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <h1 className="font-label text-xl text-brand-ink">CMS Release Notes</h1>
      <p className="mt-1 text-sm text-text-muted">What's new in the Content Manager.</p>

      <div className="mt-6 space-y-6">
        {RELEASES.map((release) => (
          <section key={release.version} className="rounded-panel border border-hairline-soft bg-surface p-5 shadow-panel">
            <div className="flex items-center gap-3">
              <span className="inline-block rounded-pill bg-brand-ink px-3 py-1 font-button text-xs text-brand-cloud">
                v{release.version}
              </span>
              <span className="text-xs text-text-subtle">{release.date}</span>
            </div>

            <div className="mt-4 space-y-4">
              {release.groups.map((group) => (
                <div key={group.heading}>
                  <h3 className="mb-1.5 text-xs font-medium uppercase tracking-wider text-text-subtle">
                    {group.heading}
                  </h3>
                  <ul className="space-y-1 pl-5">
                    {group.items.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-brand-ink">
                        <span className="mt-[7px] block h-[6px] w-[6px] min-h-[6px] min-w-[6px] flex-shrink-0 rounded-full bg-brand-primary" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
