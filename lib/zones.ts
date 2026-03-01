export interface Zone {
  id: string        // used in ?zone= query param
  label: string     // display name
  slug: string      // normalized key
}

export const ZONES: Zone[] = [
  { id: 'zone-a',             label: 'Zone A',             slug: 'zone-a'             },
  { id: 'zone-b',             label: 'Zone B',             slug: 'zone-b'             },
  { id: 'zone-c',             label: 'Zone C',             slug: 'zone-c'             },
  { id: 'zone-e',             label: 'Zone E',             slug: 'zone-e'             },
  { id: 'zone-g',             label: 'Zone G',             slug: 'zone-g'             },
  { id: 'artizan',            label: 'Artizan',            slug: 'artizan'            },
  { id: 'conference',         label: 'Conference',         slug: 'conference'         },
  { id: 'sumeet',             label: 'Sumeet',             slug: 'sumeet'             },
  { id: 'abheek',             label: 'Abheek',             slug: 'abheek'             },
  { id: 'pooja',              label: 'Pooja',              slug: 'pooja'              },
  { id: 'podcast',            label: 'Podcast',            slug: 'podcast'            },
  { id: 'abhav',              label: 'Abhav',              slug: 'abhav'              },
  { id: 'artizan-jewellery',  label: 'Artizan Jewellery',  slug: 'artizan-jewellery'  },
]

export function getZoneById(id: string): Zone | undefined {
  return ZONES.find(z => z.id === id)
}
