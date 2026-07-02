# Homepage images

Drop the actual photo files here, then import them statically (NOT via `public/`,
which is wiped on every `pnpm generate`). Co-located static imports are bundled by
webpack into `/_next/static/media/<hash>` and survive generation.

Expected filenames (pre-size them — `images.unoptimized` means no server resizing):

| File | Used by | Suggested size |
|---|---|---|
| `shaykh-portrait.jpg` | Hero accent (low-opacity, behind the Nūr veil) | ~1200×1500 |
| `zawiya-exterior.jpg` | Intention band + footer backdrop | ~1600×1000 |
| `muraqqaa-flatlay.jpg` | Texture under the Twelve Lights spectrum | ~1400×1400 |
| `hadra-group.jpg` | Pathways "History" thumbnail / Recently-inscribed header | ~1200×630 |
| `calligraphy-wall.jpg` | Footer backdrop behind the Amiri wordmark | ~1600×1000 |

## Wiring an image

```tsx
import Image from 'next/image';
import zawiya from './images/zawiya-exterior.jpg';

<Image src={zawiya} alt="The Zāwiya" placeholder="blur" className="..." />
```

The section components currently render with parchment/gradient placeholders and
accept an optional image prop — pass a static import once the file is added. See
`DESIGN.md` → Imagery guidance.
