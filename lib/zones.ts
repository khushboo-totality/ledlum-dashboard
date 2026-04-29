export interface Zone {
  id: string        // used in ?zone= query param
  label: string     // display name
  slug: string      // normalized key
}

export const ZONES: Zone[] = [
  { id: 'zone-a',        label: 'Zone A',        slug: 'zone-a'        },
  { id: 'zone-b',        label: 'Zone B',        slug: 'zone-b'        },
  { id: 'zone-c',        label: 'Zone C',        slug: 'zone-c'        },
  { id: 'zone-d',        label: 'Zone D',        slug: 'zone-d'        },
  { id: 'zone-e',        label: 'Zone E',        slug: 'zone-e'        },
  { id: 'zone-g',        label: 'Zone G',        slug: 'zone-g'        },
  { id: 'eb-room',       label: 'EB Room',       slug: 'eb-room'       },
  { id: 'astara-lounge', label: 'Astara Lounge', slug: 'astara-lounge' },
  { id: 'artizan',       label: 'Artizan',       slug: 'artizan'       },
  { id: 'conference',    label: 'Conference',    slug: 'conference'    },
  { id: 'sumeet',        label: 'Sumeet',        slug: 'sumeet'        },
  { id: 'abheek',        label: 'Abheek',        slug: 'abheek'        },
  { id: 'pooja',         label: 'Pooja',         slug: 'pooja'         },
  { id: 'podcast',       label: 'Podcast',       slug: 'podcast'       },
  { id: 'abhav',         label: 'Abhav',         slug: 'abhav'         },
]

export function getZoneById(id: string): Zone | undefined {
  return ZONES.find(z => z.id === id)
}

/** "zone-a" → "a",  "artizan" → "artizan" */
export function getZonePath(zoneId: string): string {
  return zoneId.startsWith('zone-') ? zoneId.slice(5) : zoneId
}

/** Reverse of getZonePath – looks up zone by URL segment */
export function getZoneByPath(path: string): Zone | undefined {
  return ZONES.find(z => getZonePath(z.id) === path)
}
