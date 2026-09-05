interface CmsRelease {
  version: string
  date: string
  groups: { heading: string; items: string[] }[]
}

const RELEASES: CmsRelease[] = [
  {
    version: '0.2.0',
    date: 'September 5, 2026',
    groups: [
      {
        heading: 'Pages',
        items: [
          'Curbside site pages are seeded in Web (Home, About Us, programs, Donate)',
          'Header Publish copies page drafts to the live site',
          'Each page has SEO and speakable FAQ fields',
        ],
      },
      {
        heading: 'Components',
        items: [
          'Hero Slider and Content Block layouts are ready to place on pages',
          'Text fields can use a design-system text color',
          'More on a variable duplicates it, copies or moves it to another component, or archives it',
          'Drag the grip on a component in the sidebar to set its order',
        ],
      },
      {
        heading: 'Brand',
        items: [
          'Published tokens include an accessible action pair: fill plus ink on buttons',
          'Design System warns when that pair fails contrast',
        ],
      },
      {
        heading: 'Website',
        items: [
          'The live site reads published tokens and pages — no rebuild after Publish',
          'sitemap.xml and llms.txt come from published pages',
        ],
      },
    ],
  },
  {
    version: '0.1.0',
    date: 'September 4, 2026',
    groups: [
      {
        heading: 'Platform',
        items: [
          'CMS is live for Curbside',
          'Content starts in Web and Alerts',
          'Google sign-in for authorized accounts',
          'Client setup records brand, logos, and editor access',
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
          <section key={release.version} className="rounded-panel bg-surface p-5 shadow-panel">
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
