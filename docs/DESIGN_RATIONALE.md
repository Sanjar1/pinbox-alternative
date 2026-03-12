# Design Rationale — Сырная Лавка Voting System

## Concept Direction: "The Fromagerie Ledger"

Both designs share a single conceptual thread: **a premium specialty food ledger** — the kind of notation book a master cheesemaker keeps. Warm, handcrafted, authoritative. Not a tech product. A shop that happens to have a digital feedback system.

The target customer is holding a shopping bag, standing in a market hall, probably on a mid-range Android phone. They have 60–90 seconds at most. The design must earn their attention instantly and reward them with a satisfying, fast interaction.

---

## Color Palette

| Name | Hex | Usage |
|------|-----|-------|
| Forest | `#1A3A2A` | Header, poster background, submit button |
| Forest Mid | `#2D5240` | Hover states |
| Amber | `#C8861A` | Stars, accents, active states |
| Amber Light | `#E8A840` | Highlights, gradients |
| Cream | `#F7EDD0` | Page background, poster text |
| Cream Deep | `#EFE0B8` | Borders, dividers |
| Ivory | `#FFFDF5` | Card backgrounds |
| Terracotta | `#B85C38` | Low-score flow, private feedback |
| Espresso | `#2A1810` | Body text |
| Stone | `#8A7A5A` | Subtext, placeholders |

**Why these colors?**
- Forest green signals premium, natural, trustworthy — cheese, farms, quality
- Amber reads as cheese and warmth without being garish or cliché orange
- Terracotta for negative feedback is deliberate: it's warm, not alarming (unlike red), which lowers defensive walls and encourages honest writing
- Cream background feels like aged paper — tactile, artisanal, not cold-screen

---

## Typography

### Display: Cormorant (Google Fonts, free)
- Italic weight for brand name, headings, CTA text
- Elegant, European artisan feel — used by high-end food brands globally
- Works beautifully in Cyrillic script

### Body: Jost (Google Fonts, free)
- Geometric sans, clean but characterful (not as neutral as Inter)
- Works well at small sizes for instruction text
- Uppercase tracking reads naturally for category labels

**Pairing rationale:** Cormorant for emotion, Jost for legibility. The serif-serif pairing would collapse at 13px; this combination keeps everything scannable.

---

## Voting Page Architecture

### Layout
```
┌─────────────────────────────┐
│  Forest header              │ ← Brand anchoring, always visible
│  Store ID  |  Lang toggle   │
│  "Ваше мнение важно"        │
│  ■■□ Progress pips          │ ← Live feedback as user rates
├─────────────────────────────┤
│  ┃ 01                       │
│  ┃ Сотувчи хизмати          │ ← Amber left-border accent
│  ┃ ★ ★ ★ ★ ☆               │ ← Oversized stars, tactile
├─────────────────────────────┤
│  ┃ 02  ...                  │
├─────────────────────────────┤
│  ┃ 03  ...                  │
├─────────────────────────────┤
│  [ БАҲОЛАШНИ ЯКУНЛАШ ]     │ ← Disabled until all rated
└─────────────────────────────┘
```

### Conditional Flow
- **Average ≥ 4:** Full-bleed cheese emoji + warm thanks + 3 platform links with slide-right hover
- **Average < 4:** Terracotta badge + private textarea + silent submission (no public exposure)

The fork is invisible to the customer — they never know they were routed to a private channel. This protects public reputation while capturing the complaint directly.

### Star Interaction
Stars scale up with a spring easing (`cubic-bezier(0.34,1.56,0.64,1)`) and float +2px on hover. At 36px they're large enough for a thumb press even on budget phones. The amber glow shadow reinforces selection without requiring extra UI chrome.

### Progress Pips
Three narrow bars under the header fill with amber (high), stone (medium), or terracotta (low) as each category is rated. This gives the user a sense of progress and creates a micro-reward loop that reduces drop-off.

---

## QR Poster Architecture

### Visual Weight Distribution
```
┌─────────────────────────────┐
│  STORE NAME         10%     │ ← Identity anchor
├─────────────────────────────┤
│                             │
│   ┌─ ─ ─ ─ ─ ─ ─ ─ ─ ─┐   │
│   │                     │   │
│   │   QR CODE           │   │ ← 62% of vertical space
│   │   (cream on green)  │   │
│   │                     │   │
│   └─ ─ ─ ─ ─ ─ ─ ─ ─ ─┘   │
│                             │
├─────────────────────────────┤
│  "Хизматимизни баҳоланг"    │ ← 18%: persuasion CTA
├─────────────────────────────┤
│  1. Камерани очинг          │
│  2. QR кодни скан қилинг   │ ← 10%: instructions
│  3. Баҳо қолдиринг         │
├─────────────────────────────┤
│  sirnayalavka.uz  ★★★★☆   │ ← 10%: trust footer
└─────────────────────────────┘
```

### Key Design Choices

**Dark background:** Deep forest green on white prints with strong contrast and feels luxurious on shelf. Competitors in Uzbek markets use white/light posters — this is immediately distinctive.

**Cream QR frame:** The cream rectangle frames the QR code and creates maximum contrast for scanning. Amber ornamental corners draw the eye inward to the scan area — they are functional guides, not decoration.

**Diagonal hatch texture (CSS):** Subtle `repeating-linear-gradient` of amber at 4% opacity creates a woven textile feel without increasing file size. Prints as a barely-visible warmth.

**Bilingual steps (Uzbek primary, Russian secondary):** Uzbek Cyrillic is large and legible. Russian sits below at 45% opacity — present for Russian speakers without competing with the primary language.

**No explicit "scan here" arrow:** The QR code size and the numbered steps make the action self-evident. Over-labeling reads as cheap.

---

## Production Notes

### VotingPage.tsx
- Self-contained: fonts loaded via Google Fonts `@import`
- No external UI library dependencies
- `storeId` prop drives the header badge
- Replace `href="#google"` etc. with real Maps URLs per store
- Low-score feedback should POST to your internal API endpoint

### QRPoster.tsx
- Replace `QRPlaceholder` SVG with a real QR code:
  ```tsx
  <QRPoster storeName="Авиасозлар" qrUrl="/qr/aviasozlar.png" />
  ```
- Generate QR codes with any library (e.g., `qrcode` npm package) targeting your voting page URL: `https://sirnayalavka.uz/vote?store=aviasozlar`
- Print at 300dpi: scale poster to 148mm × 210mm (A5) in your print tool
- Lamination recommended — dark background shows fingerprints less than white

---

## Why This Converts in a Real Store

1. **Legibility in mixed lighting:** Dark-on-cream and cream-on-dark both perform in fluorescent market lighting, unlike light-gray-on-white designs.

2. **Zero learning curve:** The 3 star rows + 1 button structure matches what customers expect from any rating interface. The novel branding appears in the header and accents, not in the interaction paradigm.

3. **Trust signals:** The serif Cormorant brand name reads as the same visual register as premium food packaging. Customers who paid more for quality cheese are primed to associate quality design with quality product — and they're more likely to leave a high review.

4. **Speed:** All 3 ratings + submit in under 20 seconds on a good interaction. No signup, no personal data collection (low score goes to private form, not a social account).

5. **Private feedback route:** Customers who had a bad experience are given a dignified, private exit. This is the most important UX decision in the entire system — it prevents 1-star Google reviews from customers who just needed to vent.

6. **Uzbek first:** Showing Uzbek Cyrillic as default (not Russian) signals respect for local identity. In Tashkent markets, this matters more than most international brands realize.
