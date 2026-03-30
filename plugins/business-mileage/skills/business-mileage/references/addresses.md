# Known Addresses and Normalization

## Home
- "Home" = address from `.config-local.md`

## Recurring Locations

### BNI Chapters
| Chapter | Address |
|---------|---------|
| Circle of Trust | 123 E Old Settlers Blvd, Round Rock, TX (Williamson County Board of Realtors) |
| Referrals at Twin Creeks | 1150 S Bell Blvd, Cedar Park, TX (Twin Lakes Fellowship) |
| Built to Scale | 1250 Capital of Texas Hwy, Austin, TX |
| Network Mavericks | 10811 Pecan Park Blvd, Austin, TX (Hampton Inn Cedar Park-Lakeline) |
| Connectors in Action | 13010 W Parmer Lane, Cedar Park, TX |
| Profit Powerhouse | 4220 Monterey Oaks Blvd, Austin, TX |
| 360 Group | 5204 RR 2222, Austin, TX (The County Line on the Lake) |
| Referral Powerhouse | 8600 Burnet Rd, Austin, TX (Waterloo Icehouse) |
| Business By Referral | Georgetown, TX |

### Studios and Offices
| Name | Address |
|------|---------|
| JPR Studios / Just Push Record | 908 E 5th St, Austin, TX 78702 |
| PodStyle Studio | 910 Quest Pkwy, Cedar Park, TX 78613 |
| Spectrum News Austin | 1708 Colorado St, Austin, TX 78701 |

### Board Meetings
| Board | Address |
|-------|---------|
| Cypress Ranch WCID (primary) | Si Enviro, RR 620, Lakeway, TX |
| Cypress Ranch WCID (alternate) | 21805 Agarito Ln, Spicewood, TX |

### Frequent Stops
| Name | Address |
|------|---------|
| Panera Bread (I-35) | 13000 N Interstate 35 Frontage Rd, Austin, TX |
| Panera Bread (Cedar Park) | 1504 E Whitestone Blvd, Cedar Park, TX 78613 |

## Address Normalization Rules

When matching addresses for the distance cache, normalize before comparison:

1. Strip business names before the first comma (e.g., "Panera Bread, 1504 E Whitestone" becomes "1504 E Whitestone")
2. Normalize directionals: N/S/E/W, North/South/East/West all equivalent
3. Normalize road types: RR = Ranch Road, I-35 = Interstate 35, Hwy = Highway, Blvd = Boulevard, Pkwy = Parkway, Ln = Lane, St = Street, Ave = Avenue, Trl = Trail, Dr = Drive
4. Strip trailing city/state/zip for comparison (but preserve in output)
5. "Home" always normalizes to the address in `.config-local.md`

## Adding New Locations

When a new recurring location is discovered (appears in 2+ months), add it to the appropriate table above. This improves address recognition and cache matching for future months.
