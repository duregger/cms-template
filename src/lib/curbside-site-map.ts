export type SitePageSeed = {
  slug: string
  parentSlug?: string
  title: string
  description: string
  path: string
  group: 'site' | 'programs'
  domain?: string
}

export const CURBSIDE_SITE = 'https://www.curbside.org'

export const CURBSIDE_SITE_PAGES: SitePageSeed[] = [
  {
    slug: 'home',
    title: 'Home',
    description:
      'Providing income opportunities to people struggling with homelessness in OKC. Supportive employment and housing programs.',
    path: '/',
    group: 'site',
  },
  {
    slug: 'about-us',
    title: 'About Us',
    description:
      'Curbside Enterprises is a 501c3 nonprofit that provides income and employment opportunities to people struggling with homelessness and poverty in Oklahoma City.',
    path: '/about-us',
    group: 'site',
  },
  {
    slug: 'get-involved',
    title: 'Get Involved',
    description:
      'Donate, volunteer, or support Curbside’s employment and housing programs in Oklahoma City.',
    path: '/get-involved',
    group: 'site',
  },
  {
    slug: 'our-programs',
    title: 'Our Programs',
    description:
      'Social enterprises providing low-barrier income, supportive employment, and housing case management.',
    path: '/our-programs',
    group: 'site',
  },
  {
    slug: 'contact-us',
    title: 'Contact Us',
    description:
      'Reach Curbside Enterprises at 1318 Linwood Blvd, Suite A, Oklahoma City. Lobby hours Monday–Friday, 9 a.m. to 4 p.m. (405) 415-8425.',
    path: '/contact-us',
    group: 'site',
  },
  {
    slug: 'donate-now',
    title: 'DONATE NOW',
    description: 'Your donations help Curbside provide income and housing opportunities to people in our programs.',
    path: '/donate-now',
    group: 'site',
  },
  {
    slug: 'sasquatch-shaved-ice',
    parentSlug: 'our-programs',
    title: 'Sasquatch Shaved Ice',
    description: 'Youth employment program. Program site: SasquatchShavedIce.org',
    path: '/our-programs/sasquatch-shaved-ice',
    group: 'programs',
    domain: 'SasquatchShavedIce.org',
  },
  {
    slug: 'wrap-up-homelessness',
    parentSlug: 'our-programs',
    title: 'Wrap Up Homelessness',
    description: 'Holiday wrapping-paper program. Program site: WrapUpHomelessness.org',
    path: '/our-programs/wrap-up-homelessness',
    group: 'programs',
    domain: 'WrapUpHomelessness.org',
  },
  {
    slug: 'the-curbside-chronicle',
    parentSlug: 'our-programs',
    title: 'The Curbside Chronicle',
    description: 'Street paper and low-barrier income program. Program site: TheCurbsideChronicle.org',
    path: '/our-programs/the-curbside-chronicle',
    group: 'programs',
    domain: 'TheCurbsideChronicle.org',
  },
  {
    slug: 'curbside-apparel',
    parentSlug: 'our-programs',
    title: 'Curbside Apparel',
    description: 'Screen printing shop and job-skills training. Program site: CurbsideApparel.com',
    path: '/our-programs/curbside-apparel',
    group: 'programs',
    domain: 'CurbsideApparel.com',
  },
  {
    slug: 'curbside-flowers',
    parentSlug: 'our-programs',
    title: 'Curbside Flowers',
    description: 'Full-service flower shop and supportive employment. Program site: CurbsideFlowers.com',
    path: '/our-programs/curbside-flowers',
    group: 'programs',
    domain: 'CurbsideFlowers.com',
  },
]

export const CURBSIDE_GROUP_LABEL: Record<SitePageSeed['group'], string> = {
  site: 'Site',
  programs: 'Our Programs',
}

/** Slugs created in the first pass that should not remain as pages. */
export const CURBSIDE_OBSOLETE_PAGE_SLUGS = [
  'about',
  'programs',
  'contact',
  'chronicle',
  'flowers',
  'apparel',
  'sasquatch',
  'support-services',
  'donate',
  'donate-supplies',
  'join',
  'host-a-drive',
] as const
