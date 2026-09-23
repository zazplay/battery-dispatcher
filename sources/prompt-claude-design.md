# Prompt for Claude Design — animated landing page

Copy everything between the two lines into Claude Design.

---

Make an **animated one-page landing website** that sells a service: we build a **turnkey smart system for solar plants with batteries** — it decides when to charge the battery and when to sell electricity to the grid at the best price.

Audience: owners of solar plants and companies that install solar + batteries. Practical people, not IT people. Everything must be understood at a glance: **few words, big numbers, clear animated pictures.** No long text, no jargon, no marketing clichés.

The heart of the page is an **animated illustration of a power station** that shows how the system works.

## The main illustration (hero scene)

A clean, flat vector scene (SVG, slightly isometric or side view), left to right:

1. **Solar panels** on the ground under a sky with a sun that moves across the sky (day cycle).
2. **Battery containers** (2 cabinets) with a big charge level indicator (fills and empties).
3. **A big switch / breaker lever** in the middle between the battery and the grid. Next to it sits the **"AI operator"** — a friendly, simple character or a glowing smart controller box with an "AI" chip on it and a small screen, holding / pointing at the lever. It "watches" a price display above it.
4. **The grid**: a transmission tower with power lines going off to a small city skyline.
5. Above the scene: a **price display** like a small stock ticker showing the current electricity price (€/MWh), green/red arrow.

**Animated energy flow**: glowing dots/lines move along the cables to show where energy goes.

**The day loop (~20 s, repeats):**
- **Morning (07:00, 118 €/MWh)** — sun rises, AI flips the lever to the grid, a little energy flows from battery to the grid. Caption: "Morning: small sale at 118 €".
- **Noon (13:00, −24 €/MWh, price display turns violet)** — sun at the top, panels glow, lever switches to "charge", energy flows from panels AND from the grid into the battery, battery fills to 100 %. Caption: "Noon: price below zero — we charge, and even get paid for it."
- **Evening (19:00, 228 €/MWh, price display turns amber)** — sun sets, city lights turn on, AI flips the lever to "sell", strong energy flow from battery to the grid, a money counter goes up (+ €). Caption: "Evening: peak price — we sell."
- **Night** — sky dark, battery at 20 %, lever on "hold". Caption: "Night: keep a reserve."

Under the scene: a small timeline slider 00:00–24:00 that moves with the animation; the visitor can drag it to any time of day and the scene follows. Play / pause button.

## Page sections (scroll from top to bottom)

**1. Hero** — the animated scene takes most of the screen. Headline: "Your battery can earn more." Subtitle: "A smart system that charges when power is cheap and sells when it's expensive. Automatically, 24/7." Buttons: "See how it works" (scrolls down) and "Get a demo".

**2. The problem** — a price chart for one summer day draws itself when scrolled into view: price drops below zero at noon (−24 €/MWh), jumps to 228 €/MWh in the evening. Text: "At noon everyone sells solar — the price falls. In the evening it's 10× higher. Most batteries miss this."

**3. How it works** — 4 steps appearing one by one with icons and arrows between them:
Your equipment → Market prices + weather forecast → Smart plan for every 15 minutes → Automatic control on site.

**4. See it live** — a clean dashboard screen mockup in a laptop frame for site "Kolín — Farma Jih" (PV 1.8 MWp, battery 2 MWh): a day chart (price line, charging bars at midday, selling bars in the evening, battery level line), 4 big numbers (Earned today 240 €, Battery 67 %, Selling now 1 MW, Price now 228 €/MWh), a small box "Why?": "Selling now: price is 2.4× the day average. Keeping 20 % for the night." Next to it a phone with the owner's simple view: "Today +240 €". The numbers gently tick as if live.

**5. Every decision is explained** — chat bubbles appear one after another:
Owner: "Why didn't we sell at 8 in the morning?"
AI: "At 8:00 the price was 96 €/MWh, at 19:00 — 228 €/MWh. We waited: +131 € more."
Small text: "You set the rules. You can take control at any moment."

**6. Works with your equipment** — a slowly scrolling row of logos: Huawei, SolarEdge, Victron, Sungrow, GoodWe, Deye, Fronius, SMA. Draw them as simple wordmarks in brand colors (placeholders, will be replaced later). Label: "Works with your equipment".

**7. The result** — big numbers that count up when scrolled into view:
**+22 %** more revenue · **+150 €** extra on a sunny day for a 2 MWh battery · **24/7** automatic.
Small note: "Example for a typical Czech summer day. Real numbers depend on the site."

**8. Turnkey — what you get** — 4 tiles with icons: Your brand · Your servers · Your source code · No % from your revenue. Text: "We connect your equipment, set everything up and support it."

**9. Contact** — "Let's calculate what your battery can earn." Simple form: name, company, phone/email, size of the plant (kWp) and battery (kWh), button "Get a free estimate". Contact placeholder: name, phone, email. Footer with "Your Brand" logo.

## Style

- **Light background (white / very light blue-grey), main accent color: blue** — deep blue #1E4E8C for headlines, buttons, key numbers; light blue #E8F0FA for soft section backgrounds and cards. Blue is the brand color.
- Illustration in the same palette: blues and light greys, with accent colors only for meaning: sun and solar = warm yellow, charging = teal, selling = amber, negative price = violet, energy flow = glowing blue/teal dots.
- Modern, clean, friendly-technical — like a good SaaS landing page. No stock photos, no leaves, no cartoonish clutter.
- Big type (Inter), numbers in a monospaced font. Lots of white space.
- Smooth, calm animations (fade/slide-in on scroll, count-up numbers, flowing energy dots). Respect "reduced motion" settings.
- Sticky top bar: "Your Brand" logo, links (How it works · Demo · Equipment · Contact), button "Get a demo".
- Fully responsive: on phone the hero scene scales down and stays readable.
- Language: English.

---
