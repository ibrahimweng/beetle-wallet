# Company logos (Rounds 38 and 39)

Each file is a 64 square tile: the brand's ground colour as the first `<rect>`,
then its mark. `npm run logos` turns them into `src/design/logos.ts`.

The marks are the companies' own trademarks. They are shown to name the
company a payment goes to, the way any bank app does. They are not Beetle's,
and they are not used to suggest any tie with Beetle.

**From the brand's own vector**, set on its tile:

- mtn: MTN's 2022 logo.
- uba: UBA's letters.
- gtbank: GTBank's own SVG.
- fidelity: from fidelitybank.ng.
- opay: from opayweb.com.
- wema: from wemabank.com.

**From open icon sets:**

- [Simple Icons](https://simpleicons.org) (CC0): airtel, netflix, spotify, apple, whatsapp, solana.
  - The Solana mark is filled with its purple-to-green gradient.
- [gilbarbara/logos](https://github.com/gilbarbara/logos) (CC0), through Iconify: google, googleplay.
- [cryptocurrency-icons](https://github.com/spothq/cryptocurrency-icons) (CC0): usdc, usdt, ethereum, tron.

**Drawn here:**

- mastercard: the two circles, at Mastercard's published proportions and colours.
- base: Base's blue square.
- beetle: Beetle's own mark from the icon set.

**Traced to vector from the brand's own picture.** Each picture was cut into its brand colours, and each colour was traced with potrace.

From App Store icons:

- Banks: firstbank, kuda, moniepoint, providus (also used for Unity Bank, now one bank with Providus), stanbic, union, heritage.
- Networks: glo, t2 (9mobile is now T2).
- Others: ecobank, spectranet, kaduna, portharcourt.

From each company's own site:

- Banks: access, keystone, palmpay, polaris, sterling, zenith, fcmb.
- Billers: dstv, showmax, bet9ja, lawma, waec.
- Electricity companies: ikeja, eko, abuja, jos, kano, ibadan, enugu, yola, benin.

**Round 39, for the longer lists of banks, money apps and merchants:**

- [Simple Icons](https://simpleicons.org) (CC0), each set on its brand colour: youtube, applemusic, icloud,
  appletv, uber, aliexpress, audiomack, deezer, duolingo, coursera, udemy, x, zoom, notion, figma, github,
  steam, playstation, airbnb, bookingdotcom, upwork, fiverr, shopify, etsy, ebay, tiktok, snapchat, telegram,
  discord, twitch, claude, perplexity, grammarly, dropbox, googledrive, googlecloud, paramountplus,
  crunchyroll, patreon, substack, medium, namecheap, godaddy, hostinger, cloudflare, digitalocean, vercel.
- Traced from the icon on each company's own site: ninepsb, aba (Aba Power), bitnob, branch, citi,
  coronation, creditdirect, flutterwave, carbon, paga, piggyvest, sparkle, summit, fairmoney, gomoney,
  paystack.
- Traced from the pictures gathered by
  [nigerian-banks-api](https://github.com/supermx1/nigerian-banks-api): vfd, accion, ekondo, eyowo, globus,
  jaiz, lotus, momopsb, optimus, parallex, premiumtrust, rubies, safehaven, standardchartered, stellas,
  suntrust, taj, tangerine, abbey.

The smaller banks whose marks could be found only as a 16-pixel favicon, and the merchants whose marks are
not open to use (Amazon, Microsoft, Adobe, LinkedIn, OpenAI's ChatGPT and others), show their initials.

The list of banks itself is the one Paystack publishes for Nigeria (its public `/bank` endpoint).

**Lagos Water Corporation** publishes no logo that could be found, so its bill keeps the water glyph.
