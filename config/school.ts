export const schoolBrand = {
  name: 'PASS College',
  legalName: 'PASS College',
  systemName: 'PASS e-Advising System',
  tagline: 'Prerequisite Academic Support',
  address: 'Quezon Avenue, City of Alaminos',
  locality: 'City of Alaminos, Pangasinan',
  logoSrc: '/passlogo-small.png',
  logoSrcLarge: '/passlogo-large.png',
  logoAlt: 'PASS College',
} as const;

export type SchoolBrand = typeof schoolBrand;
