# Dave's Records Taxonomy

This document defines the terminology used in Dave's Records. We adopt Discogs terminology where we sync data from them, reference MusicBrainz concepts where useful, and define our own concepts for features unique to Dave's Records.

**Discogs Disclaimer**: Dave's Records uses Discogs' API but is not affiliated with, sponsored or endorsed by Discogs. "Discogs" is a trademark of Zink Media, LLC. Discogs terminology documented below is sourced from their official documentation for reference purposes.

**MusicBrainz**: Terminology referenced from MusicBrainz is sourced from their public documentation under CC0.

## Music Metadata (Adopted from Discogs)

These terms are adopted from Discogs. Definitions are sourced from [Discogs Database Guidelines](https://support.discogs.com/hc/en-us/articles/360005006334-Database-Guidelines-1-General-Rules) and [Database Glossary](https://support.discogs.com/hc/en-us/articles/360004017694-Database-Glossary).

### Master Release

A grouping of all versions of a work. Represents the abstract creative work independent of any specific pressing or edition.

Example: "Kind of Blue" by Miles Davis (the concept, not any specific vinyl or CD)

### Release

A specific version of a Master Release. Represents a particular pressing, edition, or format with its own catalog number, label, country, and year.

Example: The 1959 US Columbia mono pressing of "Kind of Blue" (CL 1355)

Releases have:
- **Catalog Number** - Label's identifier for this release
- **Format** - Physical format (Vinyl, CD, Cassette, etc.)
- **Country** - Country of release
- **Year** - Year of release

### Version

A Release in the context of its Master Release. When viewing a Master Release, the available Releases are referred to as "versions."

"Which version do you have?" = "Which specific Release of this Master Release?"

### Artist

A person or group credited on a release. Artists have a Primary Artist Name (PAN) and may have Artist Name Variations (ANV) for different credits.

- **PAN (Primary Artist Name)** - The canonical name (e.g., "Lee Perry")
- **ANV (Artist Name Variation)** - As credited on a specific release (e.g., "Lee 'Scratch' Perry")

### Label

An entity that releases music. A release may have multiple labels (original label, distribution label, etc.).

### Credit

A role attributed to an artist on a release (Producer, Engineer, Mastering, etc.).

### Track

An individual piece of music within a release. Tracks are ordered within the release's format structure.

### Record

Informal term for a vinyl record. Widely used in everyday language but not a formal Discogs database entity. In Dave's Records, we use "record" conversationally while "Release" and "Instance" are the precise terms.

"I just added a record to my stack" = "I placed an Instance in my Stack"

### Format

The physical medium of a release:
- **Vinyl** - Includes LP (12"), 7", 10", etc.
- **CD** - Compact Disc
- **Cassette** - Audio cassette tape
- And others (8-Track, Reel-to-Reel, etc.)

Format descriptions include:
- **LP** - Long Play, typically 12" vinyl with ~20+ minutes per side
- **EP** - Extended Play, between single and LP length
- **Single** - Typically 7" with 1-2 tracks per side

### Format Variations

- **RE (Reissue)** - A release issued again, possibly by a different label or in a different country
- **RP (Repress)** - A new pressing from the original stampers/masters
- **RM (Remastered)** - Audio remastered from original sources
- **TP (Test Pressing)** - Pre-production pressing for approval
- **Promo** - Promotional copy, not for retail sale

---

## Physical Media

### Matrix Number

An identifier etched into the runout groove of a vinyl record. Used to identify the specific stampers used in manufacturing. Often derived from the catalog number but may differ.

### Pressing

The physical act of manufacturing vinyl records. Each pressing run may have subtle variations.

### Grading (Goldmine Standard)

Condition ratings for physical media, used in the Discogs Marketplace:

| Grade | Meaning |
|-------|---------|
| M | Mint - Perfect, unplayed |
| NM / M- | Near Mint - Nearly perfect, minimal signs of handling |
| VG+ | Very Good Plus - Shows some signs of play |
| VG | Very Good - Surface noise evident, groove wear |
| G+ | Good Plus - Significant wear but still playable |
| G | Good - Heavy wear, plays through |
| F | Fair - Barely playable |
| P | Poor - Damaged, may skip |

---

## Collection & Organization (Discogs-aligned)

### Collection

A user's catalog of owned records in Discogs. The Collection is the source of truth - Dave's Records syncs from it but never modifies it.

### Folder

Discogs' organizational structure within a Collection. Users can create folders to organize their collection (e.g., "Jazz", "To Sell", "Favorites"). Folder 0 is the uncategorized/all folder.

### Wantlist

A user's list of releases they want to acquire. (Not currently used in Dave's Records but may be in the future.)

### Instance

A specific physical copy of a Release in a user's Collection. If you own two copies of the same Release, you have two Instances with different `instance_id` values.

This is critical for:
- Tracking duplicates
- Placing different copies in different Stacks
- Per-copy notes and grading

---

## Dave's Records Concepts

These are concepts specific to Dave's Records, not from Discogs.

### View

A filtered perspective on a Collection. Views apply privacy filters and display preferences without modifying the underlying Collection.

A View may:
- Exclude certain releases (privacy filter)
- Apply sorting preferences
- Filter by format, genre, year, etc.

### Privacy Filter

Settings that control what is visible in public Views. Implemented through Excluded Releases - items hidden from public display but still in the Collection.

### Excluded Release

A Release hidden from public Views. The release remains in the user's Discogs Collection; it is simply not displayed publicly in Dave's Records.

### Stack

A listening station - a physical location where records are currently placed for listening. Stacks represent *where records are*, distinct from the Collection which represents *what you own*.

Examples:
- "Living Room" - records by the main turntable
- "Office Setup" - records at a secondary system
- "Currently Spinning" - active rotation

Stacks can contain:
- Records from the owner's Collection
- Records from other users' Collections (shared listening spaces)

Stack types:
- **Personal** - An individual's listening station
- **Commercial** - A business (record shop, bar) - future use
- **Institutional** - A library, museum - future use
- **Public** - Community space - future use

### Curator

A user with management access to a Stack. Curator roles:
- **Owner** - Created the Stack, full control
- **Curator** - Can add/remove records
- **Viewer** - Can see but not modify

### Stack Record

An Instance placed in a Stack. Links a specific physical copy (Instance) to a physical location (Stack).

### Connection

A linked Discogs account. Users authenticate with Google, then connect their Discogs account(s) to sync their Collection. A user may have multiple Connections (up to 2).

- **Primary Connection** - The default Discogs account used for API calls
- **Connection Name** - User-defined label (e.g., "Personal Collection", "DJ Crates")

### Public Slug

A URL-friendly identifier for a user's public page. Generated from the user's name or email, unique across the platform.

Example: `davesrecords.com/c/johns-vinyl`

---

## User Interface

Terms for UI components in Dave's Records.

### Gallery

The grid display of releases in a collection View. Shows album artwork in a responsive grid layout.

### Detail Modal

The overlay that appears when selecting a release from the Gallery. Shows full release information including tracklist, credits, and notes.

### Filter Panel

UI component for narrowing the Gallery display by format, genre, year, style, or other facets.

### Search Bar

Text input for searching releases by artist, title, or other metadata within the current View.

### Sort Select

Dropdown for ordering Gallery results (by artist, title, year added, etc.).

---

## MusicBrainz Concepts (Reference)

These terms from MusicBrainz are not currently used in Dave's Records but may inform future features, particularly for metadata enrichment.

### Recording

A specific captured audio performance. Distinct from a Release - the same Recording may appear on multiple Releases.

### Work

The abstract composition, independent of any performance. "Yesterday" as written by Lennon-McCartney is a Work; The Beatles' 1965 recording is a Recording of that Work.

### Release Group

MusicBrainz equivalent of Discogs' Master Release. Groups related Releases together.

---

## Entity Hierarchy

```
Master Release (the work)
├── Release / Version (specific pressing)
│   └── Instance (your physical copy)
│       └── Stack Record (where it currently is)

Collection (what you own)
├── Folder (organization)
│   └── Instance (each copy)

Stack (listening station)
├── Stack Record
│   └── Instance (from any user's Collection)
```

---

## Sources

- [Discogs Database Glossary](https://support.discogs.com/hc/en-us/articles/360004017694-Database-Glossary)
- [Discogs Database Guidelines](https://support.discogs.com/hc/en-us/articles/360005006334-Database-Guidelines-1-General-Rules)
- [MusicBrainz Terminology](https://musicbrainz.org/doc/Terminology)
