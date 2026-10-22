# The 45° pass

Written by `node glyphs/tools/build-library.mjs`. A straight line within 12° of a diagonal, and a pair of neighbouring dots lined up within 12° of one, is moved onto it exactly (45°, 135°, 225° or 315°) by moving its points as little as possible, with no point moving more than 0.75 on the 24 grid. Lines already flat, upright or diagonal stay so. The sources are untouched: this happens as the library is built. See `tools/snap45.mjs`.

4996 lines snapped in 559 icons. 1002 lines in 115 icons could not be taken without changing the icon too much; they stay as drawn and are listed below with the reason. 24 icons are left as drawn on purpose.

## Left as drawn, on purpose

- **app glyph: mark**: the Beetle mark is the brand's own drawing.
- **core set: asterisk**: an asterisk's arms are evenly spaced; snapping some of them would leave them uneven.
- **core set: heading-1**: letters, numerals and handwriting keep the shapes of their type.
- **core set: heading-2**: letters, numerals and handwriting keep the shapes of their type.
- **core set: heading-3**: letters, numerals and handwriting keep the shapes of their type.
- **core set: heading-4**: letters, numerals and handwriting keep the shapes of their type.
- **core set: heading-5**: letters, numerals and handwriting keep the shapes of their type.
- **core set: heading-6**: letters, numerals and handwriting keep the shapes of their type.
- **core set: languages**: letters, numerals and handwriting keep the shapes of their type.
- **core set: sigma**: letters, numerals and handwriting keep the shapes of their type.
- **core set: signature**: letters, numerals and handwriting keep the shapes of their type.
- **core set: square-asterisk**: an asterisk's arms are evenly spaced; snapping some of them would leave them uneven.
- **core set: square-m**: letters, numerals and handwriting keep the shapes of their type.
- **core set: square-sigma**: letters, numerals and handwriting keep the shapes of their type.
- **four-style set: asterisk**: an asterisk's arms are evenly spaced; snapping some of them would leave them uneven.
- **four-style set: circle-asterisk**: an asterisk's arms are evenly spaced; snapping some of them would leave them uneven.
- **four-style set: heading-1**: letters, numerals and handwriting keep the shapes of their type.
- **four-style set: heading-2**: letters, numerals and handwriting keep the shapes of their type.
- **four-style set: heading-3**: letters, numerals and handwriting keep the shapes of their type.
- **four-style set: heading-4**: letters, numerals and handwriting keep the shapes of their type.
- **four-style set: heading-5**: letters, numerals and handwriting keep the shapes of their type.
- **four-style set: heading-6**: letters, numerals and handwriting keep the shapes of their type.
- **four-style set: signature**: letters, numerals and handwriting keep the shapes of their type.
- **four-style set: square-asterisk**: an asterisk's arms are evenly spaced; snapping some of them would leave them uneven.

## Lines it could not take

| Icon | Drawing | Line | Angle | Why not |
| --- | --- | --- | ---: | --- |
| app glyph: check | line | 10.05, 17.35 to 18.8, 6.8 | 129.67° | it would push the icon out past its own box |
| app glyph: power | line | 11, 21 to 18, 10.8 | 124.46° | it would move a point 1.29 (the most is 0.75) |
| app glyph: power | line | 13, 3 to 6, 13.2 | 124.46° | it would move a point 1.29 (the most is 0.75) |
| app glyph: receipt | line | 16, 19.2 to 13.65, 20.95 | 143.33° | it would push the icon out past its own box |
| app glyph: receipt | line | 11.75, 19.05 to 9.25, 20.95 | 142.77° | it would push the icon out past its own box |
| app glyph: settings-filled | solid | 16.14, 19.58 to 13.645, 21.455 | 143.08° | it would push the icon out past its own box |
| app glyph: settings-filled | solid | 11.615, 19.425 to 8.965, 21.455 | 142.55° | it would push the icon out past its own box |
| core set: arrow-down-a-z | line | 20, 14 to 15, 20 | 129.81° | it would push the icon out past its own box |
| core set: arrow-down-z-a | line | 20, 4 to 15, 10 | 129.81° | it would push the icon out past its own box |
| core set: arrow-up-a-z | line | 20, 14 to 15, 20 | 129.81° | it would push the icon out past its own box |
| core set: arrow-up-z-a | line | 20, 4 to 15, 10 | 129.81° | it would push the icon out past its own box |
| core set: bird | line | 12.72, 4.7 to 2, 20 | 125.02° | it would move a point 2.88 (the most is 0.75) |
| core set: birdhouse | line | 3, 8 to 10.82, 2.38 | 144.3° | it would move a point 1.38 (the most is 0.75) |
| core set: birdhouse | line | 13.18, 2.38 to 21, 8 | 35.7° | it would move a point 1.38 (the most is 0.75) |
| core set: brain-circuit | line | 16, 13 to 20, 8 | 128.66° | it would push the icon out past its own box |
| core set: church | line | 6.38, 6.22 to 11.38, 2.22 | 141.34° | it would push the icon out past its own box |
| core set: cuboid | line | 2.336, 8.89 to 10, 14 | 33.69° | it would move a point 1.03 (the most is 0.75) |
| core set: cuboid | line | 8.89, 21.67 to 2.89, 17.67 | 33.69° | it would move a point 1.03 (the most is 0.75) |
| core set: cuboid | line | 15.11, 2.34 to 21.11, 6.34 | 33.69° | it would move a point 1.03 (the most is 0.75) |
| core set: gem | line | 21.61, 10.18 to 13.62, 21.17 | 126.02° | it would move a point 1.06 (the most is 0.75) |
| core set: gem | line | 10.38, 21.17 to 2.39, 10.18 | 53.98° | it would move a point 1.06 (the most is 0.75) |
| core set: hamburger | line | 13.9175, 18.2825 to 18.75, 12 | 127.57° | it would move a point 0.85 (the most is 0.75) |
| core set: lasso-select | line | 17.18, 18.01 to 14.61, 21.86 | 123.72° | it would move a point 0.95 (the most is 0.75) |
| core set: mail-open | line | 2.8, 8.4 to 10.8, 2.4 | 143.13° | it would move a point 0.94 (the most is 0.75) |
| core set: mail-open | line | 13.2, 2.4 to 21.2, 8.4 | 36.87° | it would move a point 0.94 (the most is 0.75) |
| core set: mails | line | 22, 5.5 to 15.58, 9.68 | 146.93° | it would move a point 1.41 (the most is 0.75) |
| core set: mails | line | 13.42, 9.68 to 7, 5.5 | 33.07° | it would move a point 1.41 (the most is 0.75) |
| core set: mic-vocal | line | 11, 7.6 to 5.01, 15.79 | 126.18° | it would move a point 1.38 (the most is 0.75) |
| core set: mic-vocal | line | 7.24, 17.99 to 15.09, 12 | 142.65° | it would move a point 1.17 (the most is 0.75) |
| core set: paintbrush | line | 2.11, 12.77 to 9.44, 21.65 | 50.46° | it would push the icon out past its own box |
| core set: pentagon | line | 13.17, 2.38 to 21.17, 8.12 | 35.66° | it would move a point 0.80 (the most is 0.75) |
| core set: pentagon | line | 2.83, 8.12 to 10.83, 2.38 | 144.34° | it would move a point 0.80 (the most is 0.75) |
| core set: plane | line | 3.7, 8.5 to 9.291667, 12.291667 | 34.14° | it would move a point 1.10 (the most is 0.75) |
| core set: plane | line | 11.708333, 14.708333 to 15.5, 20.3 | 55.86° | it would move a point 1.10 (the most is 0.75) |
| core set: pyramid | line | 2.18, 15.45 to 11.18, 2.43 | 124.65° | it would move a point 1.42 (the most is 0.75) |
| core set: pyramid | line | 12.82, 2.43 to 21.82, 15.44 | 55.33° | it would move a point 1.42 (the most is 0.75) |
| core set: ribbon | line | 12, 18 to 14.246667, 14.823333 | 125.27° | it would move a point 0.97 (the most is 0.75) |
| core set: ribbon | line | 17.92, 20.46 to 16.03, 21.82 | 144.26° | it would move a point 0.97 (the most is 0.75) |
| core set: ribbon | line | 14.65, 21.6 to 12, 18 | 53.64° | it would move a point 0.83 (the most is 0.75) |
| core set: ribbon | line | 12, 18 to 9.32, 21.59 | 126.74° | it would push the icon out past its own box |
| core set: ribbon | line | 7.93, 21.81 to 6.07, 20.45 | 36.17° | it would move a point 0.97 (the most is 0.75) |
| core set: ribbon | line | 5.86, 19.03 to 9.185, 14.365 | 125.48° | it would push the icon out past its own box |
| core set: sailboat | line | 3.18, 11.43 to 9.16, 2.46 | 123.69° | it would move a point 1.06 (the most is 0.75) |
| core set: sandwich | line | 2.37, 11.22 to 10.74, 4.45 | 141.03° | it would move a point 1.01 (the most is 0.75) |
| core set: sandwich | line | 13.26, 4.45 to 21.63, 11.22 | 38.97° | it would move a point 1.01 (the most is 0.75) |
| core set: sandwich | line | 6.67, 15 to 14.4, 20.8 | 36.88° | it would move a point 1.01 (the most is 0.75) |
| core set: sandwich | line | 14.4, 20.8 to 18.75, 15 | 126.87° | it would move a point 1.01 (the most is 0.75) |
| core set: server-crash | line | 13, 6 to 9, 12 | 123.69° | it would move a point 0.94 (the most is 0.75) |
| core set: server-crash | line | 15, 12 to 11, 18 | 123.69° | it would move a point 0.81 (the most is 0.75) |
| core set: sport-shoe | line | 21.2, 6.4 to 15.59, 2.19 | 36.89° | it would push the icon out past its own box |
| core set: store | line | 2.46, 7.06 to 5.34, 2.88 | 124.57° | it would push the icon out past its own box |
| core set: store | line | 18.65, 2.87 to 21.55, 7.07 | 55.38° | it would push the icon out past its own box |
| core set: triangle-right | line | 2.6, 18.7 to 20.4, 4.3 | 141.03° | it would move a point 1.20 (the most is 0.75) |
| core set: turtle | line | 4.82, 7.9 to 8, 10 | 33.44° | it would push the icon out past its own box |
| core set: turtle | line | 15.18, 7.9 to 12, 10 | 146.56° | it would push the icon out past its own box |
| core set: university | line | 17.86, 5.64 to 13.14, 2.36 | 34.8° | it would push the icon out past its own box |
| core set: university | line | 10.86, 2.36 to 6.14, 5.64 | 145.2° | it would push the icon out past its own box |
| core set: vector-polygon | line | 9.772, 5.579 to 5.228, 11.42 | 127.88° | it would push the icon out past its own box |
| core set: video | line | 16, 13 to 21.22, 16.48 | 33.69° | it would move a point 1.09 (the most is 0.75) |
| core set: zodiac-aquarius | line | 2, 10 to 4.46, 6.32 | 123.76° | it would move a point 0.77 (the most is 0.75) |
| core set: zodiac-aquarius | line | 19.54, 6.32 to 22, 10 | 56.24° | it would move a point 0.77 (the most is 0.75) |
| core set: zodiac-aquarius | line | 2, 18 to 4.46, 14.32 | 123.76° | it would move a point 0.77 (the most is 0.75) |
| core set: zodiac-aquarius | line | 19.54, 14.32 to 22, 18 | 56.24° | it would move a point 0.77 (the most is 0.75) |
| four-style set: airplay | sharp-outline | 12, 13 to 18, 21 | 53.13° | it would move a point 1.00 (the most is 0.75) |
| four-style set: airplay | sharp-outline | 6, 21 to 12, 13 | 126.87° | it would move a point 0.81 (the most is 0.75) |
| four-style set: airplay | sharp-two-tone | 12.8, 12.4 to 18.8, 20.4 | 53.13° | it would move a point 1.00 (the most is 0.75) |
| four-style set: airplay | sharp-two-tone | 5.2, 20.4 to 11.2, 12.4 | 126.87° | it would move a point 1.00 (the most is 0.75) |
| four-style set: airplay | sharp-two-tone | 12, 13 to 18, 21 | 53.13° | it would move a point 1.00 (the most is 0.75) |
| four-style set: airplay | sharp-two-tone | 6, 21 to 12, 13 | 126.87° | it would move a point 0.81 (the most is 0.75) |
| four-style set: arrow-u-turn-left | rounded-outline | 10, 5 to 5.1877, 8.6096 | 143.13° | it would push the icon out past its own box |
| four-style set: arrow-u-turn-left | rounded-two-tone | 10, 5 to 5.1877, 8.6096 | 143.13° | it would push the icon out past its own box |
| four-style set: arrow-u-turn-left | rounded-duotone | 10, 5 to 5.1877, 8.6096 | 143.13° | it would push the icon out past its own box |
| four-style set: arrow-u-turn-left | rounded-solid | 10, 5 to 5.1877, 8.6096 | 143.13° | it would push the icon out past its own box |
| four-style set: arrow-u-turn-left | sharp-outline | 10.2739, 4.7809 to 5, 9 | 141.34° | it would push the icon out past its own box |
| four-style set: arrow-u-turn-left | sharp-outline | 5, 9 to 10.3753, 13.3002 | 38.66° | it would push the icon out past its own box |
| four-style set: arrow-u-turn-left | sharp-two-tone | 10.2739, 4.7809 to 5, 9 | 141.34° | it would push the icon out past its own box |
| four-style set: arrow-u-turn-left | sharp-two-tone | 5, 9 to 10.3753, 13.3002 | 38.66° | it would push the icon out past its own box |
| four-style set: arrow-u-turn-left | sharp-duotone | 10.2739, 4.7809 to 5, 9 | 141.34° | it would push the icon out past its own box |
| four-style set: arrow-u-turn-left | sharp-duotone | 5, 9 to 10.3753, 13.3002 | 38.66° | it would push the icon out past its own box |
| four-style set: arrow-u-turn-left | sharp-solid | 10.2739, 4.7809 to 5, 9 | 141.34° | it would push the icon out past its own box |
| four-style set: arrow-u-turn-left | sharp-solid | 5, 9 to 10.3753, 13.3002 | 38.66° | it would push the icon out past its own box |
| four-style set: arrow-u-turn-right | rounded-outline | 14, 5 to 18.8123, 8.6096 | 36.87° | it would push the icon out past its own box |
| four-style set: arrow-u-turn-right | rounded-two-tone | 14, 5 to 18.8123, 8.6096 | 36.87° | it would push the icon out past its own box |
| four-style set: arrow-u-turn-right | rounded-duotone | 14, 5 to 18.8123, 8.6096 | 36.87° | it would push the icon out past its own box |
| four-style set: arrow-u-turn-right | rounded-solid | 14, 5 to 18.8123, 8.6096 | 36.87° | it would push the icon out past its own box |
| four-style set: arrow-u-turn-right | sharp-outline | 13.726, 4.7809 to 18.73115, 8.73125 | 38.28° | it would push the icon out past its own box |
| four-style set: arrow-u-turn-right | sharp-two-tone | 13.726, 4.7809 to 18.73115, 8.73125 | 38.28° | it would push the icon out past its own box |
| four-style set: arrow-u-turn-right | sharp-duotone | 13.726, 4.7809 to 18.73115, 8.73125 | 38.28° | it would push the icon out past its own box |
| four-style set: arrow-u-turn-right | sharp-solid | 13.726, 4.7809 to 18.73115, 8.73125 | 38.28° | it would push the icon out past its own box |
| four-style set: bird | rounded-outline | 10.701475, 6.927475 to 2.0956, 18.7651 | 126.02° | it would move a point 1.52 (the most is 0.75) |
| four-style set: bird | rounded-two-tone | 9.80098, 6.22518 to 1.2963, 18.1641 | 125.46° | it would move a point 1.35 (the most is 0.75) |
| four-style set: bird | rounded-two-tone | 10.701475, 6.927475 to 2.0956, 18.7651 | 126.02° | it would move a point 1.52 (the most is 0.75) |
| four-style set: bird | rounded-duotone | 9.80098, 6.22518 to 1.2963, 18.1641 | 125.46° | it would move a point 1.35 (the most is 0.75) |
| four-style set: bird | rounded-solid | 9.80098, 6.22518 to 1.2963, 18.1641 | 125.46° | it would move a point 1.35 (the most is 0.75) |
| four-style set: bird | rounded-solid | 3.6984, 18.2975 to 10.6668, 9.0308 | 126.94° | it would move a point 1.35 (the most is 0.75) |
| four-style set: bird | sharp-outline | 10.701475, 6.927475 to 2, 19.3162 | 125.08° | it would move a point 1.74 (the most is 0.75) |
| four-style set: bird | sharp-two-tone | 10.061, 6.5089 to 1.1907, 18.7288 | 125.98° | it would move a point 1.74 (the most is 0.75) |
| four-style set: bird | sharp-two-tone | 10.701475, 6.927475 to 2, 19.3162 | 125.08° | it would move a point 1.74 (the most is 0.75) |
| four-style set: bird | sharp-duotone | 10.061, 6.5089 to 1.1907, 18.7288 | 125.98° | it would move a point 1.18 (the most is 0.75) |
| four-style set: bird | sharp-solid | 10.061, 6.5089 to 1.1907, 18.7288 | 125.98° | it would move a point 1.18 (the most is 0.75) |
| four-style set: bird | sharp-solid | 4.2157, 17.9661 to 10.6784, 9.063 | 125.98° | it would move a point 0.86 (the most is 0.75) |
| four-style set: car | rounded-outline | 13.5971, 5.6768 to 18, 10.6667 | 48.58° | it would turn a line it was not snapping by 6.5° |
| four-style set: car | rounded-two-tone | 14.347, 5.0151 to 18.5717, 9.8031 | 48.58° | it would turn a line it was not snapping by 6.9° |
| four-style set: car | rounded-two-tone | 13.5971, 5.6768 to 18, 10.6667 | 48.58° | it would turn a line it was not snapping by 6.5° |
| four-style set: car | rounded-duotone | 14.347, 5.0151 to 18.5717, 9.8031 | 48.58° | it would turn a line it was not snapping by 6.9° |
| four-style set: car | rounded-solid | 14.347, 5.0151 to 18.5717, 9.8031 | 48.58° | it would turn a line it was not snapping by 6.9° |
| four-style set: car | rounded-solid | 15.2328, 9 to 12.8844, 6.3384 | 48.58° | it would turn a line it was not snapping by 6.9° |
| four-style set: car | sharp-outline | 13, 5 to 18, 10.6667 | 48.58° | it would turn a line it was not snapping by 6.2° |
| four-style set: car | sharp-two-tone | 13, 5 to 18, 10.6667 | 48.58° | it would turn a line it was not snapping by 6.2° |
| four-style set: chart-no-axes-combined | rounded-outline | 22, 3 to 13.5984, 10.0013 | 140.19° | it would move a point 0.79 (the most is 0.75) |
| four-style set: chart-no-axes-combined | rounded-outline | 12.37, 10.0418 to 8.1911, 7.0026 | 36.03° | it would move a point 0.79 (the most is 0.75) |
| four-style set: chart-no-axes-combined | rounded-two-tone | 22, 3 to 13.5984, 10.0013 | 140.19° | it would move a point 0.79 (the most is 0.75) |
| four-style set: chart-no-axes-combined | rounded-two-tone | 12.37, 10.0418 to 8.1911, 7.0026 | 36.03° | it would move a point 0.79 (the most is 0.75) |
| four-style set: chart-no-axes-combined | rounded-duotone | 22, 3 to 13.5984, 10.0013 | 140.19° | it would move a point 0.79 (the most is 0.75) |
| four-style set: chart-no-axes-combined | rounded-duotone | 12.37, 10.0418 to 8.1911, 7.0026 | 36.03° | it would move a point 0.79 (the most is 0.75) |
| four-style set: chart-no-axes-combined | rounded-solid | 22, 3 to 13.5984, 10.0013 | 140.19° | it would move a point 0.79 (the most is 0.75) |
| four-style set: chart-no-axes-combined | rounded-solid | 12.37, 10.0418 to 8.1911, 7.0026 | 36.03° | it would move a point 0.79 (the most is 0.75) |
| four-style set: chart-no-axes-combined | sharp-outline | 22.2781, 2.7682 to 13, 10.5 | 140.19° | it would push the icon out past its own box |
| four-style set: chart-no-axes-combined | sharp-outline | 13, 10.5 to 7.5, 6.5 | 36.03° | it would move a point 0.76 (the most is 0.75) |
| four-style set: chart-no-axes-combined | sharp-two-tone | 22.2781, 2.7682 to 13, 10.5 | 140.19° | it would push the icon out past its own box |
| four-style set: chart-no-axes-combined | sharp-two-tone | 13, 10.5 to 7.5, 6.5 | 36.03° | it would move a point 0.76 (the most is 0.75) |
| four-style set: chart-no-axes-combined | sharp-duotone | 22.2781, 2.7682 to 13, 10.5 | 140.19° | it would push the icon out past its own box |
| four-style set: chart-no-axes-combined | sharp-duotone | 13, 10.5 to 7.5, 6.5 | 36.03° | it would move a point 0.76 (the most is 0.75) |
| four-style set: chart-no-axes-combined | sharp-solid | 22.2781, 2.7682 to 13, 10.5 | 140.19° | it would push the icon out past its own box |
| four-style set: chart-no-axes-combined | sharp-solid | 13, 10.5 to 7.5, 6.5 | 36.03° | it would move a point 0.76 (the most is 0.75) |
| four-style set: chart-no-axes-combined-sparkles | rounded-outline | 22, 2 to 13.5984, 9.0013 | 140.19° | it would move a point 0.79 (the most is 0.75) |
| four-style set: chart-no-axes-combined-sparkles | rounded-outline | 12.37, 9.0418 to 8.1911, 6.0026 | 36.03° | it would move a point 0.79 (the most is 0.75) |
| four-style set: chart-no-axes-combined-sparkles | rounded-two-tone | 22, 2 to 13.5984, 9.0013 | 140.19° | it would move a point 0.79 (the most is 0.75) |
| four-style set: chart-no-axes-combined-sparkles | rounded-two-tone | 12.37, 9.0418 to 8.1911, 6.0026 | 36.03° | it would move a point 0.79 (the most is 0.75) |
| four-style set: chart-no-axes-combined-sparkles | rounded-duotone | 22, 2 to 13.5984, 9.0013 | 140.19° | it would move a point 0.79 (the most is 0.75) |
| four-style set: chart-no-axes-combined-sparkles | rounded-duotone | 12.37, 9.0418 to 8.1911, 6.0026 | 36.03° | it would move a point 0.79 (the most is 0.75) |
| four-style set: chart-no-axes-combined-sparkles | rounded-solid | 22, 2 to 13.5984, 9.0013 | 140.19° | it would move a point 0.79 (the most is 0.75) |
| four-style set: chart-no-axes-combined-sparkles | rounded-solid | 12.37, 9.0418 to 8.1911, 6.0026 | 36.03° | it would move a point 0.79 (the most is 0.75) |
| four-style set: chart-no-axes-combined-sparkles | sharp-outline | 22.2781, 1.7682 to 13, 9.5 | 140.19° | it would push the icon out past its own box |
| four-style set: chart-no-axes-combined-sparkles | sharp-outline | 13, 9.5 to 7.5, 5.5 | 36.03° | it would move a point 0.76 (the most is 0.75) |
| four-style set: chart-no-axes-combined-sparkles | sharp-two-tone | 22.2781, 1.7682 to 13, 9.5 | 140.19° | it would push the icon out past its own box |
| four-style set: chart-no-axes-combined-sparkles | sharp-two-tone | 13, 9.5 to 7.5, 5.5 | 36.03° | it would move a point 0.76 (the most is 0.75) |
| four-style set: chart-no-axes-combined-sparkles | sharp-duotone | 22.2781, 1.7682 to 13, 9.5 | 140.19° | it would push the icon out past its own box |
| four-style set: chart-no-axes-combined-sparkles | sharp-duotone | 13, 9.5 to 7.5, 5.5 | 36.03° | it would move a point 0.76 (the most is 0.75) |
| four-style set: chart-no-axes-combined-sparkles | sharp-solid | 22.2781, 1.7682 to 13, 9.5 | 140.19° | it would push the icon out past its own box |
| four-style set: chart-no-axes-combined-sparkles | sharp-solid | 13, 9.5 to 7.5, 5.5 | 36.03° | it would move a point 0.76 (the most is 0.75) |
| four-style set: code | rounded-outline | 8, 5 to 2, 12 | 130.6° | it would push the icon out past its own box |
| four-style set: code | rounded-outline | 2, 12 to 8, 19 | 49.4° | it would push the icon out past its own box |
| four-style set: code | rounded-outline | 16, 5 to 22.25, 12.25 | 49.24° | it would push the icon out past its own box |
| four-style set: code | rounded-two-tone | 8, 5 to 2, 12 | 130.6° | it would push the icon out past its own box |
| four-style set: code | rounded-two-tone | 2, 12 to 8, 19 | 49.4° | it would push the icon out past its own box |
| four-style set: code | rounded-two-tone | 16, 5 to 22.25, 12.25 | 49.24° | it would push the icon out past its own box |
| four-style set: code | rounded-duotone | 8, 5 to 2, 12 | 130.6° | it would push the icon out past its own box |
| four-style set: code | rounded-duotone | 2, 12 to 8, 19 | 49.4° | it would push the icon out past its own box |
| four-style set: code | rounded-duotone | 16, 5 to 22.25, 12.25 | 49.24° | it would push the icon out past its own box |
| four-style set: code | rounded-solid | 8, 5 to 2, 12 | 130.6° | it would push the icon out past its own box |
| four-style set: code | rounded-solid | 2, 12 to 8, 19 | 49.4° | it would push the icon out past its own box |
| four-style set: code | rounded-solid | 16, 5 to 22.25, 12.25 | 49.24° | it would push the icon out past its own box |
| four-style set: code | sharp-outline | 8.2993, 4.6508 to 2, 12 | 130.6° | it would push the icon out past its own box |
| four-style set: code | sharp-outline | 2, 12 to 8.2993, 19.3492 | 49.4° | it would push the icon out past its own box |
| four-style set: code | sharp-outline | 15.7007, 4.6508 to 22, 12 | 49.4° | it would push the icon out past its own box |
| four-style set: code | sharp-outline | 22, 12 to 15.7007, 19.3492 | 130.6° | it would push the icon out past its own box |
| four-style set: code | sharp-two-tone | 8.2993, 4.6508 to 2, 12 | 130.6° | it would push the icon out past its own box |
| four-style set: code | sharp-two-tone | 2, 12 to 8.2993, 19.3492 | 49.4° | it would push the icon out past its own box |
| four-style set: code | sharp-two-tone | 15.7007, 4.6508 to 22, 12 | 49.4° | it would push the icon out past its own box |
| four-style set: code | sharp-two-tone | 22, 12 to 15.7007, 19.3492 | 130.6° | it would push the icon out past its own box |
| four-style set: code | sharp-duotone | 8.2993, 4.6508 to 2, 12 | 130.6° | it would push the icon out past its own box |
| four-style set: code | sharp-duotone | 2, 12 to 8.2993, 19.3492 | 49.4° | it would push the icon out past its own box |
| four-style set: code | sharp-duotone | 15.7007, 4.6508 to 22, 12 | 49.4° | it would push the icon out past its own box |
| four-style set: code | sharp-duotone | 22, 12 to 15.7007, 19.3492 | 130.6° | it would push the icon out past its own box |
| four-style set: code | sharp-solid | 8.2993, 4.6508 to 2, 12 | 130.6° | it would push the icon out past its own box |
| four-style set: code | sharp-solid | 2, 12 to 8.2993, 19.3492 | 49.4° | it would push the icon out past its own box |
| four-style set: code | sharp-solid | 15.7007, 4.6508 to 22, 12 | 49.4° | it would push the icon out past its own box |
| four-style set: code | sharp-solid | 22, 12 to 15.7007, 19.3492 | 130.6° | it would push the icon out past its own box |
| four-style set: code-xml | rounded-outline | 6, 7 to 2, 12 | 128.66° | it would push the icon out past its own box |
| four-style set: code-xml | rounded-outline | 2, 12 to 6, 17 | 51.34° | it would push the icon out past its own box |
| four-style set: code-xml | rounded-outline | 18, 7 to 22.25, 12.25 | 51.01° | it would push the icon out past its own box |
| four-style set: code-xml | rounded-two-tone | 6, 7 to 2, 12 | 128.66° | it would push the icon out past its own box |
| four-style set: code-xml | rounded-two-tone | 2, 12 to 6, 17 | 51.34° | it would push the icon out past its own box |
| four-style set: code-xml | rounded-two-tone | 18, 7 to 22.25, 12.25 | 51.01° | it would push the icon out past its own box |
| four-style set: code-xml | rounded-duotone | 6, 7 to 2, 12 | 128.66° | it would push the icon out past its own box |
| four-style set: code-xml | rounded-duotone | 2, 12 to 6, 17 | 51.34° | it would push the icon out past its own box |
| four-style set: code-xml | rounded-duotone | 18, 7 to 22.25, 12.25 | 51.01° | it would push the icon out past its own box |
| four-style set: code-xml | rounded-solid | 6, 7 to 2, 12 | 128.66° | it would push the icon out past its own box |
| four-style set: code-xml | rounded-solid | 2, 12 to 6, 17 | 51.34° | it would push the icon out past its own box |
| four-style set: code-xml | rounded-solid | 18, 7 to 22.25, 12.25 | 51.01° | it would push the icon out past its own box |
| four-style set: code-xml | sharp-outline | 6.3002, 6.6247 to 2, 12 | 128.66° | it would push the icon out past its own box |
| four-style set: code-xml | sharp-outline | 2, 12 to 6.3002, 17.3753 | 51.34° | it would push the icon out past its own box |
| four-style set: code-xml | sharp-outline | 17.6998, 6.6247 to 22, 12 | 51.34° | it would push the icon out past its own box |
| four-style set: code-xml | sharp-outline | 22, 12 to 17.6998, 17.3753 | 128.66° | it would push the icon out past its own box |
| four-style set: code-xml | sharp-two-tone | 6.3002, 6.6247 to 2, 12 | 128.66° | it would push the icon out past its own box |
| four-style set: code-xml | sharp-two-tone | 2, 12 to 6.3002, 17.3753 | 51.34° | it would push the icon out past its own box |
| four-style set: code-xml | sharp-two-tone | 17.6998, 6.6247 to 22, 12 | 51.34° | it would push the icon out past its own box |
| four-style set: code-xml | sharp-two-tone | 22, 12 to 17.6998, 17.3753 | 128.66° | it would push the icon out past its own box |
| four-style set: code-xml | sharp-duotone | 6.3002, 6.6247 to 2, 12 | 128.66° | it would push the icon out past its own box |
| four-style set: code-xml | sharp-duotone | 2, 12 to 6.3002, 17.3753 | 51.34° | it would push the icon out past its own box |
| four-style set: code-xml | sharp-duotone | 17.6998, 6.6247 to 22, 12 | 51.34° | it would push the icon out past its own box |
| four-style set: code-xml | sharp-duotone | 22, 12 to 17.6998, 17.3753 | 128.66° | it would push the icon out past its own box |
| four-style set: code-xml | sharp-solid | 6.3002, 6.6247 to 2, 12 | 128.66° | it would push the icon out past its own box |
| four-style set: code-xml | sharp-solid | 2, 12 to 6.3002, 17.3753 | 51.34° | it would push the icon out past its own box |
| four-style set: code-xml | sharp-solid | 17.6998, 6.6247 to 22, 12 | 51.34° | it would push the icon out past its own box |
| four-style set: code-xml | sharp-solid | 22, 12 to 17.6998, 17.3753 | 128.66° | it would push the icon out past its own box |
| four-style set: crown | sharp-two-tone | 7.1298, 9.6331 to 11.1588, 3.4592 | 123.13° | it would move a point 1.24 (the most is 0.75) |
| four-style set: crown | sharp-two-tone | 12.8412, 3.4592 to 16.8702, 9.6331 | 56.87° | it would move a point 1.24 (the most is 0.75) |
| four-style set: crown | sharp-duotone | 7.1298, 9.6331 to 11.1588, 3.4592 | 123.13° | it would move a point 1.24 (the most is 0.75) |
| four-style set: crown | sharp-duotone | 12.8412, 3.4592 to 16.8702, 9.6331 | 56.87° | it would move a point 1.24 (the most is 0.75) |
| four-style set: crown | sharp-solid | 7.1298, 9.6331 to 11.1588, 3.4592 | 123.13° | it would move a point 1.24 (the most is 0.75) |
| four-style set: crown | sharp-solid | 12.8412, 3.4592 to 16.8702, 9.6331 | 56.87° | it would move a point 1.24 (the most is 0.75) |
| four-style set: delete | sharp-outline | 2.0001, 12 to 9, 4 | 131.19° | it would push the icon out past its own box |
| four-style set: delete | sharp-outline | 9, 20 to 2.0001, 12 | 48.81° | it would push the icon out past its own box |
| four-style set: double-check | sharp-outline | 21.7407, 10.7191 to 15.5, 18 | 130.6° | it would push the icon out past its own box |
| four-style set: double-check | sharp-two-tone | 21.7407, 10.7191 to 15.5, 18 | 130.6° | it would push the icon out past its own box |
| four-style set: double-check | sharp-duotone | 21.7407, 10.7191 to 15.5, 18 | 130.6° | it would push the icon out past its own box |
| four-style set: double-check | sharp-solid | 21.7407, 10.7191 to 15.5, 18 | 130.6° | it would push the icon out past its own box |
| four-style set: eject | sharp-outline | 4, 16 to 12, 4 | 123.69° | it would move a point 1.62 (the most is 0.75) |
| four-style set: eject | sharp-outline | 12, 4 to 20, 16 | 56.31° | it would move a point 2.00 (the most is 0.75) |
| four-style set: eject | sharp-two-tone | 4, 16 to 12, 4 | 123.69° | it would move a point 1.62 (the most is 0.75) |
| four-style set: eject | sharp-two-tone | 12, 4 to 20, 16 | 56.31° | it would move a point 2.00 (the most is 0.75) |
| four-style set: eject | sharp-duotone | 4, 16 to 12, 4 | 123.69° | it would move a point 1.62 (the most is 0.75) |
| four-style set: eject | sharp-duotone | 12, 4 to 20, 16 | 56.31° | it would move a point 2.00 (the most is 0.75) |
| four-style set: eject | sharp-solid | 4, 16 to 12, 4 | 123.69° | it would move a point 1.62 (the most is 0.75) |
| four-style set: eject | sharp-solid | 12, 4 to 20, 16 | 56.31° | it would move a point 2.00 (the most is 0.75) |
| four-style set: fast-forward | sharp-outline | 2, 6.002 to 10.4583, 12 | 35.34° | it would move a point 1.23 (the most is 0.75) |
| four-style set: fast-forward | sharp-outline | 10.4583, 12 to 2, 17.998 | 144.66° | it would move a point 1.00 (the most is 0.75) |
| four-style set: fast-forward | sharp-outline | 14, 6.002 to 22, 12 | 36.86° | it would move a point 1.00 (the most is 0.75) |
| four-style set: fast-forward | sharp-outline | 22, 12 to 14, 17.998 | 143.14° | it would move a point 0.81 (the most is 0.75) |
| four-style set: fast-forward | sharp-two-tone | 2.5784, 5.1863 to 11.0367, 11.1843 | 35.34° | it would move a point 1.23 (the most is 0.75) |
| four-style set: fast-forward | sharp-two-tone | 11.0367, 12.8157 to 2.5784, 18.8137 | 144.66° | it would move a point 1.00 (the most is 0.75) |
| four-style set: fast-forward | sharp-two-tone | 14.5999, 5.2019 to 22.5999, 11.1999 | 36.86° | it would move a point 1.00 (the most is 0.75) |
| four-style set: fast-forward | sharp-two-tone | 22.5999, 12.8001 to 14.5999, 18.7981 | 143.14° | it would move a point 1.00 (the most is 0.75) |
| four-style set: fast-forward | sharp-two-tone | 2, 6.002 to 10.4583, 12 | 35.34° | it would move a point 1.23 (the most is 0.75) |
| four-style set: fast-forward | sharp-two-tone | 10.4583, 12 to 2, 17.998 | 144.66° | it would move a point 1.00 (the most is 0.75) |
| four-style set: fast-forward | sharp-two-tone | 14, 6.002 to 22, 12 | 36.86° | it would move a point 1.00 (the most is 0.75) |
| four-style set: fast-forward | sharp-two-tone | 22, 12 to 14, 17.998 | 143.14° | it would move a point 0.81 (the most is 0.75) |
| four-style set: fast-forward | sharp-duotone | 2, 6.002 to 10.4583, 12 | 35.34° | it would move a point 1.23 (the most is 0.75) |
| four-style set: fast-forward | sharp-duotone | 10.4583, 12 to 2, 17.998 | 144.66° | it would move a point 1.00 (the most is 0.75) |
| four-style set: fast-forward | sharp-duotone | 14, 6.002 to 22, 12 | 36.86° | it would move a point 1.00 (the most is 0.75) |
| four-style set: fast-forward | sharp-duotone | 22, 12 to 14, 17.998 | 143.14° | it would move a point 0.81 (the most is 0.75) |
| four-style set: fast-forward | sharp-solid | 2.5784, 5.1863 to 11.0367, 11.1843 | 35.34° | it would move a point 0.87 (the most is 0.75) |
| four-style set: fast-forward | sharp-solid | 11.0367, 12.8157 to 2.5784, 18.8137 | 144.66° | it would move a point 0.87 (the most is 0.75) |
| four-style set: fast-forward | sharp-solid | 14.5999, 5.2019 to 22.5999, 11.1999 | 36.86° | it would push the icon out past its own box |
| four-style set: fast-forward | sharp-solid | 22.5999, 12.8001 to 14.5999, 18.7981 | 143.14° | it would push the icon out past its own box |
| four-style set: filter | sharp-outline | 21, 3 to 14, 11.5001 | 129.47° | it would push the icon out past its own box |
| four-style set: filter | sharp-outline | 10, 11.5001 to 3, 3 | 50.53° | it would push the icon out past its own box |
| four-style set: filter | sharp-two-tone | 21.7719, 3.6357 to 15, 11.8589 | 129.47° | it would move a point 0.87 (the most is 0.75) |
| four-style set: filter | sharp-two-tone | 9, 11.8589 to 2.2281, 3.6357 | 50.53° | it would move a point 0.87 (the most is 0.75) |
| four-style set: filter | sharp-duotone | 21, 3 to 14, 11.5001 | 129.47° | it would push the icon out past its own box |
| four-style set: filter | sharp-duotone | 10, 11.5001 to 3, 3 | 50.53° | it would push the icon out past its own box |
| four-style set: filter | sharp-solid | 21.7719, 3.6357 to 15, 11.8589 | 129.47° | it would move a point 0.87 (the most is 0.75) |
| four-style set: filter | sharp-solid | 9, 11.8589 to 2.2281, 3.6357 | 50.53° | it would move a point 0.87 (the most is 0.75) |
| four-style set: home | rounded-outline | 20.2928, 9.4009 to 13.2928, 3.4703 | 40.27° | it would push the icon out past its own box |
| four-style set: home | rounded-outline | 10.7072, 3.4703 to 3.7072, 9.4009 | 139.73° | it would push the icon out past its own box |
| four-style set: home | rounded-two-tone | 13.9395, 2.7073 to 20.9395, 8.6379 | 40.27° | it would push the icon out past its own box |
| four-style set: home | rounded-two-tone | 3.0605, 8.6379 to 10.0605, 2.7073 | 139.73° | it would push the icon out past its own box |
| four-style set: home | rounded-duotone | 13.9395, 2.7071 to 20.9395, 8.6377 | 40.27° | it would push the icon out past its own box |
| four-style set: home | rounded-duotone | 3.0606, 8.6377 to 10.0605, 2.7071 | 139.73° | it would push the icon out past its own box |
| four-style set: home | rounded-solid | 13.9395, 2.7073 to 20.9395, 8.6379 | 40.27° | it would push the icon out past its own box |
| four-style set: home | rounded-solid | 3.0605, 8.6379 to 10.0605, 2.7073 | 139.73° | it would push the icon out past its own box |
| four-style set: home | sharp-outline | 21, 10 to 12, 2.9963 | 37.89° | it would move a point 1.14 (the most is 0.75) |
| four-style set: home | sharp-outline | 12, 2.9963 to 3, 10 | 142.11° | it would move a point 0.81 (the most is 0.75) |
| four-style set: home | sharp-two-tone | 2.3859, 9.2108 to 11.3859, 2.2071 | 142.11° | it would move a point 1.14 (the most is 0.75) |
| four-style set: home | sharp-two-tone | 12.6141, 2.2071 to 21.6141, 9.2108 | 37.89° | it would move a point 1.14 (the most is 0.75) |
| four-style set: home | sharp-two-tone | 21, 10 to 12, 2.9963 | 37.89° | it would move a point 1.14 (the most is 0.75) |
| four-style set: home | sharp-two-tone | 12, 2.9963 to 3, 10 | 142.11° | it would move a point 0.81 (the most is 0.75) |
| four-style set: home | sharp-duotone | 2.39, 9.21 to 11.39, 2.21 | 142.13° | it would push the icon out past its own box |
| four-style set: home | sharp-duotone | 12.61, 2.21 to 21.61, 9.21 | 37.87° | it would push the icon out past its own box |
| four-style set: home | sharp-solid | 12.6135, 2.2048 to 20.9395, 8.6379 | 37.69° | it would move a point 1.07 (the most is 0.75) |
| four-style set: home | sharp-solid | 2.3536, 9.2369 to 11.3881, 2.2069 | 142.11° | it would push the icon out past its own box |
| four-style set: home-check | sharp-outline | 11.07685, 3.91945 to 2, 11 | 142.04° | it would move a point 0.81 (the most is 0.75) |
| four-style set: home-check | sharp-two-tone | 1.3859, 10.2108 to 10.3859, 3.2071 | 142.11° | it would move a point 0.81 (the most is 0.75) |
| four-style set: home-check | sharp-two-tone | 11.07685, 3.91945 to 2, 11 | 142.04° | it would move a point 0.81 (the most is 0.75) |
| four-style set: home-heart | rounded-outline | 20.2928, 9.4009 to 13.2928, 3.4703 | 40.27° | it would push the icon out past its own box |
| four-style set: home-heart | rounded-outline | 10.7072, 3.4703 to 3.7072, 9.4009 | 139.73° | it would push the icon out past its own box |
| four-style set: home-heart | rounded-two-tone | 13.9395, 2.7073 to 20.9395, 8.6379 | 40.27° | it would push the icon out past its own box |
| four-style set: home-heart | rounded-two-tone | 3.0606, 8.6379 to 10.0605, 2.7073 | 139.73° | it would push the icon out past its own box |
| four-style set: home-heart | rounded-two-tone | 20.2928, 9.4009 to 13.2928, 3.4703 | 40.27° | it would push the icon out past its own box |
| four-style set: home-heart | rounded-two-tone | 10.7072, 3.4703 to 3.7072, 9.4009 | 139.73° | it would push the icon out past its own box |
| four-style set: home-heart | rounded-duotone | 13.9395, 2.7073 to 20.9395, 8.6379 | 40.27° | it would push the icon out past its own box |
| four-style set: home-heart | rounded-duotone | 3.0606, 8.6379 to 10.0605, 2.7073 | 139.73° | it would push the icon out past its own box |
| four-style set: home-heart | rounded-solid | 13.9395, 2.7073 to 20.9395, 8.6379 | 40.27° | it would push the icon out past its own box |
| four-style set: home-heart | rounded-solid | 3.0606, 8.6379 to 10.0605, 2.7073 | 139.73° | it would push the icon out past its own box |
| four-style set: home-heart | sharp-outline | 21, 10 to 12, 2.9963 | 37.89° | it would move a point 1.14 (the most is 0.75) |
| four-style set: home-heart | sharp-outline | 12, 2.9963 to 3, 10 | 142.11° | it would move a point 0.81 (the most is 0.75) |
| four-style set: home-heart | sharp-two-tone | 12.6143, 2.2071 to 21.6143, 9.211 | 37.89° | it would push the icon out past its own box |
| four-style set: home-heart | sharp-two-tone | 2.3857, 9.211 to 11.3857, 2.2071 | 142.11° | it would push the icon out past its own box |
| four-style set: home-heart | sharp-two-tone | 21, 10 to 12, 2.9963 | 37.89° | it would move a point 1.14 (the most is 0.75) |
| four-style set: home-heart | sharp-two-tone | 12, 2.9963 to 3, 10 | 142.11° | it would move a point 0.81 (the most is 0.75) |
| four-style set: home-heart | sharp-duotone | 12.6143, 2.2071 to 21.6143, 9.211 | 37.89° | it would push the icon out past its own box |
| four-style set: home-heart | sharp-duotone | 2.3857, 9.211 to 11.3857, 2.2071 | 142.11° | it would push the icon out past its own box |
| four-style set: home-heart | sharp-solid | 12.6143, 2.2071 to 21.6143, 9.211 | 37.89° | it would push the icon out past its own box |
| four-style set: home-heart | sharp-solid | 2.3857, 9.211 to 11.3857, 2.2071 | 142.11° | it would push the icon out past its own box |
| four-style set: home-plus | sharp-outline | 11.07685, 3.91945 to 2, 11 | 142.04° | it would move a point 0.81 (the most is 0.75) |
| four-style set: home-plus | sharp-two-tone | 1.3859, 10.2108 to 10.3859, 3.2071 | 142.11° | it would move a point 0.81 (the most is 0.75) |
| four-style set: home-plus | sharp-two-tone | 11.07685, 3.91945 to 2, 11 | 142.04° | it would move a point 0.81 (the most is 0.75) |
| four-style set: home-simple | rounded-outline | 20.2928, 9.4009 to 13.2928, 3.4703 | 40.27° | it would push the icon out past its own box |
| four-style set: home-simple | rounded-outline | 10.7072, 3.4703 to 3.7072, 9.4009 | 139.73° | it would push the icon out past its own box |
| four-style set: home-simple | rounded-two-tone | 13.9395, 2.7073 to 20.9395, 8.6379 | 40.27° | it would push the icon out past its own box |
| four-style set: home-simple | rounded-two-tone | 3.0606, 8.6379 to 10.0605, 2.7073 | 139.73° | it would push the icon out past its own box |
| four-style set: home-simple | rounded-two-tone | 20.2928, 9.4009 to 13.2928, 3.4703 | 40.27° | it would push the icon out past its own box |
| four-style set: home-simple | rounded-two-tone | 10.7072, 3.4703 to 3.7072, 9.4009 | 139.73° | it would push the icon out past its own box |
| four-style set: home-simple | rounded-duotone | 20.2928, 9.4009 to 13.2928, 3.4703 | 40.27° | it would push the icon out past its own box |
| four-style set: home-simple | rounded-duotone | 10.7072, 3.4703 to 3.7072, 9.4009 | 139.73° | it would push the icon out past its own box |
| four-style set: home-simple | rounded-solid | 13.9395, 2.7073 to 20.9395, 8.6379 | 40.27° | it would push the icon out past its own box |
| four-style set: home-simple | rounded-solid | 3.0606, 8.6379 to 10.0605, 2.7073 | 139.73° | it would push the icon out past its own box |
| four-style set: home-simple | sharp-outline | 21, 10 to 12, 2.9963 | 37.89° | it would move a point 1.14 (the most is 0.75) |
| four-style set: home-simple | sharp-outline | 12, 2.9963 to 3, 10 | 142.11° | it would move a point 0.81 (the most is 0.75) |
| four-style set: home-simple | sharp-two-tone | 12.6143, 2.2071 to 21.6143, 9.211 | 37.89° | it would push the icon out past its own box |
| four-style set: home-simple | sharp-two-tone | 2.3857, 9.211 to 11.3857, 2.2071 | 142.11° | it would push the icon out past its own box |
| four-style set: home-simple | sharp-two-tone | 21, 10 to 12, 2.9963 | 37.89° | it would move a point 1.14 (the most is 0.75) |
| four-style set: home-simple | sharp-two-tone | 12, 2.9963 to 3, 10 | 142.11° | it would move a point 0.81 (the most is 0.75) |
| four-style set: home-simple | sharp-duotone | 21, 10 to 12, 2.9963 | 37.89° | it would move a point 1.14 (the most is 0.75) |
| four-style set: home-simple | sharp-duotone | 12, 2.9963 to 3, 10 | 142.11° | it would move a point 0.81 (the most is 0.75) |
| four-style set: home-simple | sharp-solid | 12.6143, 2.2071 to 21.6143, 9.211 | 37.89° | it would push the icon out past its own box |
| four-style set: home-simple | sharp-solid | 2.3857, 9.211 to 11.3857, 2.2071 | 142.11° | it would push the icon out past its own box |
| four-style set: home-x | sharp-outline | 11.07685, 3.91945 to 2, 11 | 142.04° | it would move a point 0.81 (the most is 0.75) |
| four-style set: home-x | sharp-two-tone | 1.3859, 10.2108 to 10.3859, 3.2071 | 142.11° | it would move a point 0.81 (the most is 0.75) |
| four-style set: home-x | sharp-two-tone | 11.07685, 3.91945 to 2, 11 | 142.04° | it would move a point 0.81 (the most is 0.75) |
| four-style set: home-zap | sharp-outline | 11.07685, 3.91945 to 2, 11 | 142.04° | it would move a point 0.81 (the most is 0.75) |
| four-style set: home-zap | sharp-two-tone | 1.3859, 10.2108 to 10.3859, 3.2071 | 142.11° | it would move a point 0.81 (the most is 0.75) |
| four-style set: home-zap | sharp-two-tone | 11.07685, 3.91945 to 2, 11 | 142.04° | it would move a point 0.81 (the most is 0.75) |
| four-style set: homes | sharp-outline | 7, 13.4473 to 14.443629, 7.556371 | 141.64° | it would move a point 0.89 (the most is 0.75) |
| four-style set: homes | sharp-outline | 3, 6.8909 to 8, 3 | 142.11° | it would move a point 0.89 (the most is 0.75) |
| four-style set: homes | sharp-outline | 8, 3 to 10.956, 5.3003 | 37.89° | it would move a point 0.89 (the most is 0.75) |
| four-style set: homes | sharp-two-tone | 14.6143, 7.2108 to 21.6143, 12.6581 | 37.89° | it would move a point 0.89 (the most is 0.75) |
| four-style set: homes | sharp-two-tone | 6.3857, 12.6581 to 13.3857, 7.2108 | 142.11° | it would move a point 0.89 (the most is 0.75) |
| four-style set: homes | sharp-two-tone | 7, 13.4473 to 14.443629, 7.556371 | 141.64° | it would move a point 0.89 (the most is 0.75) |
| four-style set: homes | sharp-two-tone | 3, 6.8909 to 8, 3 | 142.11° | it would move a point 0.89 (the most is 0.75) |
| four-style set: homes | sharp-two-tone | 8, 3 to 10.956, 5.3003 | 37.89° | it would move a point 0.89 (the most is 0.75) |
| four-style set: homes | sharp-duotone | 3, 6.8909 to 8, 3 | 142.11° | it would push the icon out past its own box |
| four-style set: homes | sharp-duotone | 8, 3 to 10.956, 5.3003 | 37.89° | it would push the icon out past its own box |
| four-style set: homes | sharp-solid | 3, 6.8909 to 8, 3 | 142.11° | it would push the icon out past its own box |
| four-style set: homes | sharp-solid | 8, 3 to 10.956, 5.3003 | 37.89° | it would push the icon out past its own box |
| four-style set: house | rounded-outline | 2, 10.8473 to 10.7072, 3.4703 | 139.73° | it would move a point 0.75 (the most is 0.75) |
| four-style set: house | rounded-outline | 13.2928, 3.4703 to 22, 10.8473 | 40.27° | it would move a point 0.75 (the most is 0.75) |
| four-style set: house | rounded-two-tone | 13.9393, 2.7073 to 22.6463, 10.0842 | 40.27° | it would push the icon out past its own box |
| four-style set: house | rounded-two-tone | 1.3534, 10.0842 to 10.0604, 2.7073 | 139.73° | it would push the icon out past its own box |
| four-style set: house | rounded-two-tone | 2, 10.8473 to 10.7072, 3.4703 | 139.73° | it would move a point 0.75 (the most is 0.75) |
| four-style set: house | rounded-two-tone | 13.2928, 3.4703 to 22, 10.8473 | 40.27° | it would move a point 0.75 (the most is 0.75) |
| four-style set: house | rounded-duotone | 13.9393, 2.7073 to 22.6463, 10.0842 | 40.27° | it would push the icon out past its own box |
| four-style set: house | rounded-duotone | 1.3534, 10.0842 to 10.0604, 2.7073 | 139.73° | it would push the icon out past its own box |
| four-style set: house | rounded-solid | 13.9393, 2.7072 to 22.6463, 10.0842 | 40.27° | it would push the icon out past its own box |
| four-style set: house | rounded-solid | 1.3534, 10.0842 to 10.0604, 2.7072 | 139.73° | it would push the icon out past its own box |
| four-style set: house | sharp-outline | 2, 10.7782 to 12, 2.9963 | 142.11° | it would move a point 1.11 (the most is 0.75) |
| four-style set: house | sharp-outline | 12, 2.9963 to 22, 10.7782 | 37.89° | it would move a point 0.78 (the most is 0.75) |
| four-style set: house | sharp-two-tone | 12.6142, 2.2071 to 23.0874, 10.3765 | 37.96° | it would move a point 1.31 (the most is 0.75) |
| four-style set: house | sharp-two-tone | 0.912575, 10.376525 to 11.3857, 2.2071 | 142.04° | it would move a point 1.31 (the most is 0.75) |
| four-style set: house | sharp-two-tone | 2, 10.7782 to 12, 2.9963 | 142.11° | it would move a point 1.11 (the most is 0.75) |
| four-style set: house | sharp-two-tone | 12, 2.9963 to 22, 10.7782 | 37.89° | it would move a point 0.78 (the most is 0.75) |
| four-style set: house | sharp-duotone | 12.6142, 2.2071 to 23.0874, 10.3765 | 37.96° | it would move a point 1.31 (the most is 0.75) |
| four-style set: house | sharp-duotone | 0.912575, 10.376525 to 11.3857, 2.2071 | 142.04° | it would move a point 1.31 (the most is 0.75) |
| four-style set: house | sharp-solid | 12.6142, 2.2071 to 23.0874, 10.3765 | 37.96° | it would move a point 1.31 (the most is 0.75) |
| four-style set: house | sharp-solid | 0.912575, 10.376525 to 11.3857, 2.2071 | 142.04° | it would move a point 1.31 (the most is 0.75) |
| four-style set: house-cast | rounded-outline | 13.2928, 3.4703 to 22, 10.8473 | 40.27° | it would move a point 0.75 (the most is 0.75) |
| four-style set: house-cast | rounded-two-tone | 13.2928, 3.4703 to 22, 10.8473 | 40.27° | it would move a point 0.75 (the most is 0.75) |
| four-style set: house-cast | rounded-duotone | 13.2928, 3.4703 to 22, 10.8473 | 40.27° | it would move a point 0.75 (the most is 0.75) |
| four-style set: house-cast | rounded-solid | 13.2928, 3.4703 to 22, 10.8473 | 40.27° | it would move a point 0.75 (the most is 0.75) |
| four-style set: house-cast | sharp-outline | 4.0568, 9.1776 to 12, 2.9963 | 142.11° | it would move a point 1.00 (the most is 0.75) |
| four-style set: house-cast | sharp-outline | 12, 2.9963 to 22, 10.7782 | 37.89° | it would move a point 0.78 (the most is 0.75) |
| four-style set: house-cast | sharp-two-tone | 4.0568, 9.1776 to 12, 2.9963 | 142.11° | it would move a point 1.00 (the most is 0.75) |
| four-style set: house-cast | sharp-two-tone | 12, 2.9963 to 22, 10.7782 | 37.89° | it would move a point 0.78 (the most is 0.75) |
| four-style set: house-cast | sharp-duotone | 4.0568, 9.1776 to 12, 2.9963 | 142.11° | it would move a point 1.00 (the most is 0.75) |
| four-style set: house-cast | sharp-duotone | 12, 2.9963 to 22, 10.7782 | 37.89° | it would move a point 0.78 (the most is 0.75) |
| four-style set: house-cast | sharp-solid | 4.0568, 9.1776 to 12, 2.9963 | 142.11° | it would move a point 1.00 (the most is 0.75) |
| four-style set: house-cast | sharp-solid | 12, 2.9963 to 22, 10.7782 | 37.89° | it would move a point 0.78 (the most is 0.75) |
| four-style set: house-check | rounded-outline | 2, 11.8473 to 10.7072, 4.4703 | 139.73° | it would move a point 0.75 (the most is 0.75) |
| four-style set: house-check | rounded-two-tone | 2, 11.8473 to 10.7072, 4.4703 | 139.73° | it would move a point 0.75 (the most is 0.75) |
| four-style set: house-check | sharp-outline | 2, 11.7782 to 12, 3.9963 | 142.11° | it would move a point 0.78 (the most is 0.75) |
| four-style set: house-check | sharp-two-tone | 0.9126, 11.3765 to 11.3857, 3.207 | 142.04° | it would move a point 1.31 (the most is 0.75) |
| four-style set: house-check | sharp-two-tone | 2, 11.7782 to 12, 3.9963 | 142.11° | it would move a point 1.31 (the most is 0.75) |
| four-style set: house-check | sharp-duotone | 0.9126, 11.3765 to 11.3857, 3.207 | 142.04° | it would move a point 1.31 (the most is 0.75) |
| four-style set: house-check | sharp-solid | 0.9126, 11.3765 to 11.3857, 3.207 | 142.04° | it would move a point 1.31 (the most is 0.75) |
| four-style set: house-chimney | rounded-outline | 2, 10.8473 to 10.7072, 3.4703 | 139.73° | it would move a point 0.75 (the most is 0.75) |
| four-style set: house-chimney | rounded-outline | 13.2928, 3.4703 to 22, 10.8473 | 40.27° | it would move a point 0.75 (the most is 0.75) |
| four-style set: house-chimney | rounded-two-tone | 13.9393, 2.7072 to 15.035, 3.635 | 40.26° | it would move a point 0.75 (the most is 0.75) |
| four-style set: house-chimney | rounded-two-tone | 2, 10.8473 to 10.7072, 3.4703 | 139.73° | it would move a point 0.75 (the most is 0.75) |
| four-style set: house-chimney | rounded-two-tone | 13.2928, 3.4703 to 22, 10.8473 | 40.27° | it would move a point 0.75 (the most is 0.75) |
| four-style set: house-chimney | sharp-outline | 2, 10.7782 to 12, 2.9963 | 142.11° | it would move a point 1.11 (the most is 0.75) |
| four-style set: house-chimney | sharp-outline | 12, 2.9963 to 22, 10.7782 | 37.89° | it would move a point 0.78 (the most is 0.75) |
| four-style set: house-chimney | sharp-two-tone | 12.6142, 2.2071 to 15, 4.0626 | 37.87° | it would move a point 1.31 (the most is 0.75) |
| four-style set: house-chimney | sharp-two-tone | 0.912575, 10.376525 to 11.3857, 2.2071 | 142.04° | it would move a point 1.31 (the most is 0.75) |
| four-style set: house-chimney | sharp-two-tone | 2, 10.7782 to 12, 2.9963 | 142.11° | it would move a point 1.11 (the most is 0.75) |
| four-style set: house-chimney | sharp-two-tone | 12, 2.9963 to 22, 10.7782 | 37.89° | it would move a point 0.78 (the most is 0.75) |
| four-style set: house-chimney | sharp-duotone | 12.6142, 2.2071 to 15, 4.0626 | 37.87° | it would move a point 1.31 (the most is 0.75) |
| four-style set: house-chimney | sharp-duotone | 0.912575, 10.376525 to 11.3857, 2.2071 | 142.04° | it would move a point 1.31 (the most is 0.75) |
| four-style set: house-chimney | sharp-solid | 12.6142, 2.2071 to 15, 4.0626 | 37.87° | it would move a point 1.31 (the most is 0.75) |
| four-style set: house-chimney | sharp-solid | 0.912575, 10.376525 to 11.3857, 2.2071 | 142.04° | it would move a point 1.31 (the most is 0.75) |
| four-style set: house-cog | rounded-outline | 2, 10.8473 to 10.7072, 3.4703 | 139.73° | it would move a point 0.75 (the most is 0.75) |
| four-style set: house-cog | rounded-outline | 13.2928, 3.4703 to 22, 10.8473 | 40.27° | it would move a point 0.75 (the most is 0.75) |
| four-style set: house-cog | rounded-two-tone | 13.9393, 2.7073 to 22.6463, 10.0842 | 40.27° | it would push the icon out past its own box |
| four-style set: house-cog | rounded-two-tone | 1.3534, 10.0842 to 10.0604, 2.7073 | 139.73° | it would push the icon out past its own box |
| four-style set: house-cog | rounded-two-tone | 2, 10.8473 to 10.7072, 3.4703 | 139.73° | it would move a point 0.75 (the most is 0.75) |
| four-style set: house-cog | rounded-two-tone | 13.2928, 3.4703 to 22, 10.8473 | 40.27° | it would move a point 0.75 (the most is 0.75) |
| four-style set: house-cog | rounded-duotone | 13.9393, 2.7073 to 22.6463, 10.0842 | 40.27° | it would push the icon out past its own box |
| four-style set: house-cog | rounded-duotone | 1.3534, 10.0842 to 10.0604, 2.7073 | 139.73° | it would push the icon out past its own box |
| four-style set: house-cog | rounded-solid | 13.9393, 2.7072 to 22.6463, 10.0842 | 40.27° | it would push the icon out past its own box |
| four-style set: house-cog | rounded-solid | 1.3534, 10.0842 to 10.0604, 2.7072 | 139.73° | it would push the icon out past its own box |
| four-style set: house-cog | sharp-outline | 2, 10.7782 to 12, 2.9963 | 142.11° | it would move a point 1.11 (the most is 0.75) |
| four-style set: house-cog | sharp-outline | 12, 2.9963 to 22, 10.7782 | 37.89° | it would move a point 0.78 (the most is 0.75) |
| four-style set: house-cog | sharp-two-tone | 12.6142, 2.2071 to 23.0874, 10.3765 | 37.96° | it would move a point 1.31 (the most is 0.75) |
| four-style set: house-cog | sharp-two-tone | 0.912575, 10.376525 to 11.3857, 2.2071 | 142.04° | it would move a point 1.31 (the most is 0.75) |
| four-style set: house-cog | sharp-two-tone | 2, 10.7782 to 12, 2.9963 | 142.11° | it would move a point 1.11 (the most is 0.75) |
| four-style set: house-cog | sharp-two-tone | 12, 2.9963 to 22, 10.7782 | 37.89° | it would move a point 0.78 (the most is 0.75) |
| four-style set: house-cog | sharp-duotone | 12.6142, 2.2071 to 23.0874, 10.3765 | 37.96° | it would move a point 1.31 (the most is 0.75) |
| four-style set: house-cog | sharp-duotone | 0.912575, 10.376525 to 11.3857, 2.2071 | 142.04° | it would move a point 1.31 (the most is 0.75) |
| four-style set: house-cog | sharp-solid | 12.6142, 2.2071 to 23.0874, 10.3765 | 37.96° | it would move a point 1.31 (the most is 0.75) |
| four-style set: house-cog | sharp-solid | 0.912575, 10.376525 to 11.3857, 2.2071 | 142.04° | it would move a point 1.31 (the most is 0.75) |
| four-style set: house-heart | rounded-outline | 2, 10.8473 to 10.7072, 3.4703 | 139.73° | it would move a point 0.75 (the most is 0.75) |
| four-style set: house-heart | rounded-outline | 13.2928, 3.4703 to 22, 10.8473 | 40.27° | it would move a point 0.75 (the most is 0.75) |
| four-style set: house-heart | rounded-two-tone | 13.9393, 2.7073 to 22.6463, 10.0842 | 40.27° | it would push the icon out past its own box |
| four-style set: house-heart | rounded-two-tone | 1.3534, 10.0842 to 10.0604, 2.7073 | 139.73° | it would push the icon out past its own box |
| four-style set: house-heart | rounded-two-tone | 2, 10.8473 to 10.7072, 3.4703 | 139.73° | it would move a point 0.75 (the most is 0.75) |
| four-style set: house-heart | rounded-two-tone | 13.2928, 3.4703 to 22, 10.8473 | 40.27° | it would move a point 0.75 (the most is 0.75) |
| four-style set: house-heart | rounded-duotone | 13.9393, 2.7073 to 22.6463, 10.0842 | 40.27° | it would push the icon out past its own box |
| four-style set: house-heart | rounded-duotone | 1.3534, 10.0842 to 10.0604, 2.7073 | 139.73° | it would push the icon out past its own box |
| four-style set: house-heart | rounded-solid | 13.9393, 2.7072 to 22.6463, 10.0842 | 40.27° | it would push the icon out past its own box |
| four-style set: house-heart | rounded-solid | 1.3534, 10.0842 to 10.0604, 2.7072 | 139.73° | it would push the icon out past its own box |
| four-style set: house-heart | sharp-outline | 2, 10.7782 to 12, 2.9963 | 142.11° | it would move a point 1.11 (the most is 0.75) |
| four-style set: house-heart | sharp-outline | 12, 2.9963 to 22, 10.7782 | 37.89° | it would move a point 0.78 (the most is 0.75) |
| four-style set: house-heart | sharp-two-tone | 12.6142, 2.2071 to 23.0874, 10.3765 | 37.96° | it would move a point 1.31 (the most is 0.75) |
| four-style set: house-heart | sharp-two-tone | 0.912575, 10.376525 to 11.3857, 2.2071 | 142.04° | it would move a point 1.31 (the most is 0.75) |
| four-style set: house-heart | sharp-two-tone | 2, 10.7782 to 12, 2.9963 | 142.11° | it would move a point 1.11 (the most is 0.75) |
| four-style set: house-heart | sharp-two-tone | 12, 2.9963 to 22, 10.7782 | 37.89° | it would move a point 0.78 (the most is 0.75) |
| four-style set: house-heart | sharp-duotone | 12.6142, 2.2071 to 23.0874, 10.3765 | 37.96° | it would move a point 1.31 (the most is 0.75) |
| four-style set: house-heart | sharp-duotone | 0.912575, 10.376525 to 11.3857, 2.2071 | 142.04° | it would move a point 1.31 (the most is 0.75) |
| four-style set: house-heart | sharp-solid | 12.6142, 2.2071 to 23.0874, 10.3765 | 37.96° | it would move a point 1.31 (the most is 0.75) |
| four-style set: house-heart | sharp-solid | 0.912575, 10.376525 to 11.3857, 2.2071 | 142.04° | it would move a point 1.31 (the most is 0.75) |
| four-style set: house-plug | rounded-outline | 2, 10.8473 to 10.7072, 3.4703 | 139.73° | it would move a point 0.75 (the most is 0.75) |
| four-style set: house-plug | rounded-outline | 13.2928, 3.4703 to 22, 10.8473 | 40.27° | it would move a point 0.75 (the most is 0.75) |
| four-style set: house-plug | rounded-two-tone | 13.9393, 2.7073 to 22.6463, 10.0842 | 40.27° | it would push the icon out past its own box |
| four-style set: house-plug | rounded-two-tone | 1.3534, 10.0842 to 10.0604, 2.7073 | 139.73° | it would push the icon out past its own box |
| four-style set: house-plug | rounded-two-tone | 2, 10.8473 to 10.7072, 3.4703 | 139.73° | it would move a point 0.75 (the most is 0.75) |
| four-style set: house-plug | rounded-two-tone | 13.2928, 3.4703 to 22, 10.8473 | 40.27° | it would move a point 0.75 (the most is 0.75) |
| four-style set: house-plug | rounded-duotone | 13.9393, 2.7073 to 22.6463, 10.0842 | 40.27° | it would push the icon out past its own box |
| four-style set: house-plug | rounded-duotone | 1.3534, 10.0842 to 10.0604, 2.7073 | 139.73° | it would push the icon out past its own box |
| four-style set: house-plug | rounded-solid | 13.9393, 2.7072 to 22.6463, 10.0842 | 40.27° | it would push the icon out past its own box |
| four-style set: house-plug | rounded-solid | 1.3534, 10.0842 to 10.0604, 2.7072 | 139.73° | it would push the icon out past its own box |
| four-style set: house-plug | sharp-outline | 2, 10.7782 to 12, 2.9963 | 142.11° | it would move a point 1.11 (the most is 0.75) |
| four-style set: house-plug | sharp-outline | 12, 2.9963 to 22, 10.7782 | 37.89° | it would move a point 0.78 (the most is 0.75) |
| four-style set: house-plug | sharp-two-tone | 12.6142, 2.2071 to 23.0874, 10.3765 | 37.96° | it would move a point 1.31 (the most is 0.75) |
| four-style set: house-plug | sharp-two-tone | 0.912575, 10.376525 to 11.3857, 2.2071 | 142.04° | it would move a point 1.31 (the most is 0.75) |
| four-style set: house-plug | sharp-two-tone | 2, 10.7782 to 12, 2.9963 | 142.11° | it would move a point 1.11 (the most is 0.75) |
| four-style set: house-plug | sharp-two-tone | 12, 2.9963 to 22, 10.7782 | 37.89° | it would move a point 0.78 (the most is 0.75) |
| four-style set: house-plug | sharp-duotone | 12.6142, 2.2071 to 23.0874, 10.3765 | 37.96° | it would move a point 1.31 (the most is 0.75) |
| four-style set: house-plug | sharp-duotone | 0.912575, 10.376525 to 11.3857, 2.2071 | 142.04° | it would move a point 1.31 (the most is 0.75) |
| four-style set: house-plug | sharp-solid | 12.6142, 2.2071 to 23.0874, 10.3765 | 37.96° | it would move a point 1.31 (the most is 0.75) |
| four-style set: house-plug | sharp-solid | 0.912575, 10.376525 to 11.3857, 2.2071 | 142.04° | it would move a point 1.31 (the most is 0.75) |
| four-style set: house-plus | rounded-outline | 2, 11.8473 to 10.7072, 4.4703 | 139.73° | it would move a point 0.75 (the most is 0.75) |
| four-style set: house-plus | rounded-two-tone | 2, 11.8473 to 10.7072, 4.4703 | 139.73° | it would move a point 0.75 (the most is 0.75) |
| four-style set: house-plus | sharp-outline | 2, 11.7782 to 12, 3.9963 | 142.11° | it would move a point 0.78 (the most is 0.75) |
| four-style set: house-plus | sharp-two-tone | 0.9126, 11.3765 to 11.3857, 3.207 | 142.04° | it would move a point 1.31 (the most is 0.75) |
| four-style set: house-plus | sharp-two-tone | 2, 11.7782 to 12, 3.9963 | 142.11° | it would move a point 1.31 (the most is 0.75) |
| four-style set: house-plus | sharp-duotone | 0.9126, 11.3765 to 11.3857, 3.207 | 142.04° | it would move a point 1.31 (the most is 0.75) |
| four-style set: house-plus | sharp-solid | 0.9126, 11.3765 to 11.3857, 3.207 | 142.04° | it would move a point 1.31 (the most is 0.75) |
| four-style set: house-simple | rounded-outline | 2, 10.8473 to 10.7072, 3.4703 | 139.73° | it would move a point 0.75 (the most is 0.75) |
| four-style set: house-simple | rounded-outline | 13.2928, 3.4703 to 22, 10.8473 | 40.27° | it would move a point 0.75 (the most is 0.75) |
| four-style set: house-simple | rounded-two-tone | 13.9393, 2.7073 to 22.6463, 10.0842 | 40.27° | it would push the icon out past its own box |
| four-style set: house-simple | rounded-two-tone | 1.3534, 10.0842 to 10.0604, 2.7073 | 139.73° | it would push the icon out past its own box |
| four-style set: house-simple | rounded-two-tone | 2, 10.8473 to 10.7072, 3.4703 | 139.73° | it would move a point 0.75 (the most is 0.75) |
| four-style set: house-simple | rounded-two-tone | 13.2928, 3.4703 to 22, 10.8473 | 40.27° | it would move a point 0.75 (the most is 0.75) |
| four-style set: house-simple | rounded-duotone | 2, 10.8473 to 10.7072, 3.4703 | 139.73° | it would move a point 0.75 (the most is 0.75) |
| four-style set: house-simple | rounded-duotone | 13.2928, 3.4703 to 22, 10.8473 | 40.27° | it would move a point 0.75 (the most is 0.75) |
| four-style set: house-simple | rounded-solid | 13.9393, 2.7073 to 22.6463, 10.0842 | 40.27° | it would push the icon out past its own box |
| four-style set: house-simple | rounded-solid | 1.3534, 10.0842 to 10.0604, 2.7073 | 139.73° | it would push the icon out past its own box |
| four-style set: house-simple | sharp-outline | 2, 10.7782 to 12, 2.9963 | 142.11° | it would move a point 1.11 (the most is 0.75) |
| four-style set: house-simple | sharp-outline | 12, 2.9963 to 22, 10.7782 | 37.89° | it would move a point 0.78 (the most is 0.75) |
| four-style set: house-simple | sharp-two-tone | 12.6142, 2.2071 to 23.0874, 10.3765 | 37.96° | it would move a point 1.31 (the most is 0.75) |
| four-style set: house-simple | sharp-two-tone | 0.912575, 10.376525 to 11.3857, 2.2071 | 142.04° | it would move a point 1.31 (the most is 0.75) |
| four-style set: house-simple | sharp-two-tone | 2, 10.7782 to 12, 2.9963 | 142.11° | it would move a point 1.11 (the most is 0.75) |
| four-style set: house-simple | sharp-two-tone | 12, 2.9963 to 22, 10.7782 | 37.89° | it would move a point 0.78 (the most is 0.75) |
| four-style set: house-simple | sharp-duotone | 2, 10.7782 to 12, 2.9963 | 142.11° | it would move a point 1.11 (the most is 0.75) |
| four-style set: house-simple | sharp-duotone | 12, 2.9963 to 22, 10.7782 | 37.89° | it would move a point 0.78 (the most is 0.75) |
| four-style set: house-simple | sharp-solid | 12.6142, 2.2071 to 23.0874, 10.3765 | 37.96° | it would move a point 1.31 (the most is 0.75) |
| four-style set: house-simple | sharp-solid | 0.912575, 10.376525 to 11.3857, 2.2071 | 142.04° | it would move a point 1.31 (the most is 0.75) |
| four-style set: house-wifi | rounded-outline | 2, 10.8473 to 10.7072, 3.4703 | 139.73° | it would move a point 0.75 (the most is 0.75) |
| four-style set: house-wifi | rounded-outline | 13.2928, 3.4703 to 22, 10.8473 | 40.27° | it would move a point 0.75 (the most is 0.75) |
| four-style set: house-wifi | rounded-two-tone | 2, 10.8473 to 10.7072, 3.4703 | 139.73° | it would move a point 0.75 (the most is 0.75) |
| four-style set: house-wifi | rounded-two-tone | 13.2928, 3.4703 to 22, 10.8473 | 40.27° | it would move a point 0.75 (the most is 0.75) |
| four-style set: house-wifi | rounded-duotone | 2, 10.8473 to 10.7072, 3.4703 | 139.73° | it would move a point 0.75 (the most is 0.75) |
| four-style set: house-wifi | rounded-duotone | 13.2928, 3.4703 to 22, 10.8473 | 40.27° | it would move a point 0.75 (the most is 0.75) |
| four-style set: house-wifi | rounded-solid | 2, 10.8473 to 10.7072, 3.4703 | 139.73° | it would move a point 0.75 (the most is 0.75) |
| four-style set: house-wifi | rounded-solid | 13.2928, 3.4703 to 22, 10.8473 | 40.27° | it would move a point 0.75 (the most is 0.75) |
| four-style set: house-wifi | sharp-outline | 2, 10.7782 to 12, 2.9963 | 142.11° | it would move a point 1.11 (the most is 0.75) |
| four-style set: house-wifi | sharp-outline | 12, 2.9963 to 22, 10.7782 | 37.89° | it would move a point 0.78 (the most is 0.75) |
| four-style set: house-wifi | sharp-two-tone | 2, 10.7782 to 12, 2.9963 | 142.11° | it would move a point 1.11 (the most is 0.75) |
| four-style set: house-wifi | sharp-two-tone | 12, 2.9963 to 22, 10.7782 | 37.89° | it would move a point 0.78 (the most is 0.75) |
| four-style set: house-wifi | sharp-duotone | 2, 10.7782 to 12, 2.9963 | 142.11° | it would move a point 1.11 (the most is 0.75) |
| four-style set: house-wifi | sharp-duotone | 12, 2.9963 to 22, 10.7782 | 37.89° | it would move a point 0.78 (the most is 0.75) |
| four-style set: house-wifi | sharp-solid | 2, 10.7782 to 12, 2.9963 | 142.11° | it would move a point 1.11 (the most is 0.75) |
| four-style set: house-wifi | sharp-solid | 12, 2.9963 to 22, 10.7782 | 37.89° | it would move a point 0.78 (the most is 0.75) |
| four-style set: house-x | rounded-outline | 2, 11.8473 to 10.7072, 4.4703 | 139.73° | it would move a point 0.75 (the most is 0.75) |
| four-style set: house-x | rounded-two-tone | 2, 11.8473 to 10.7072, 4.4703 | 139.73° | it would move a point 0.75 (the most is 0.75) |
| four-style set: house-x | sharp-outline | 2, 11.7782 to 12, 3.9963 | 142.11° | it would move a point 0.78 (the most is 0.75) |
| four-style set: house-x | sharp-two-tone | 0.9126, 11.3765 to 11.3857, 3.207 | 142.04° | it would move a point 1.31 (the most is 0.75) |
| four-style set: house-x | sharp-two-tone | 2, 11.7782 to 12, 3.9963 | 142.11° | it would move a point 1.31 (the most is 0.75) |
| four-style set: house-x | sharp-duotone | 0.9126, 11.3765 to 11.3857, 3.207 | 142.04° | it would move a point 1.31 (the most is 0.75) |
| four-style set: house-x | sharp-solid | 0.9126, 11.3765 to 11.3857, 3.207 | 142.04° | it would move a point 1.31 (the most is 0.75) |
| four-style set: house-zap | rounded-outline | 2, 11.8473 to 10.7072, 4.4703 | 139.73° | it would move a point 0.75 (the most is 0.75) |
| four-style set: house-zap | rounded-two-tone | 2, 11.8473 to 10.7072, 4.4703 | 139.73° | it would move a point 0.75 (the most is 0.75) |
| four-style set: house-zap | sharp-outline | 2, 11.7782 to 12, 3.9963 | 142.11° | it would move a point 0.78 (the most is 0.75) |
| four-style set: house-zap | sharp-two-tone | 0.9126, 11.3765 to 11.3857, 3.207 | 142.04° | it would move a point 1.31 (the most is 0.75) |
| four-style set: house-zap | sharp-two-tone | 2, 11.7782 to 12, 3.9963 | 142.11° | it would move a point 1.31 (the most is 0.75) |
| four-style set: house-zap | sharp-duotone | 0.9126, 11.3765 to 11.3857, 3.207 | 142.04° | it would move a point 1.31 (the most is 0.75) |
| four-style set: house-zap | sharp-solid | 0.9126, 11.3765 to 11.3857, 3.207 | 142.04° | it would move a point 1.31 (the most is 0.75) |
| four-style set: houses | sharp-outline | 6, 14.2255 to 14.443625, 7.556375 | 141.7° | it would move a point 0.89 (the most is 0.75) |
| four-style set: houses | sharp-outline | 2, 6.8909 to 7, 3 | 142.11° | it would move a point 0.89 (the most is 0.75) |
| four-style set: houses | sharp-outline | 7, 3 to 10.456, 5.6894 | 37.89° | it would move a point 0.89 (the most is 0.75) |
| four-style set: houses | sharp-two-tone | 14.6142, 7.2108 to 23, 13.7362 | 37.89° | it would move a point 1.05 (the most is 0.75) |
| four-style set: houses | sharp-two-tone | 23, 13.7362 to 21.718025, 15.368675 | 128.14° | it would move a point 1.06 (the most is 0.75) |
| four-style set: houses | sharp-two-tone | 6.281906, 15.368706 to 5, 13.7362 | 51.86° | it would move a point 1.06 (the most is 0.75) |
| four-style set: houses | sharp-two-tone | 5, 13.7362 to 13.3857, 7.2108 | 142.11° | it would move a point 1.05 (the most is 0.75) |
| four-style set: houses | sharp-two-tone | 6, 14.2255 to 14.443625, 7.556375 | 141.7° | it would move a point 0.89 (the most is 0.75) |
| four-style set: houses | sharp-two-tone | 2, 6.8909 to 7, 3 | 142.11° | it would move a point 0.89 (the most is 0.75) |
| four-style set: houses | sharp-two-tone | 7, 3 to 10.456, 5.6894 | 37.89° | it would move a point 0.89 (the most is 0.75) |
| four-style set: houses | sharp-duotone | 2, 6.8909 to 7.19165, 2.80835 | 141.82° | it would push the icon out past its own box |
| four-style set: houses | sharp-duotone | 14.6142, 7.2108 to 23, 13.7362 | 37.89° | it would move a point 1.05 (the most is 0.75) |
| four-style set: houses | sharp-duotone | 23, 13.7362 to 21.718025, 15.368675 | 128.14° | it would move a point 1.06 (the most is 0.75) |
| four-style set: houses | sharp-duotone | 6.281906, 15.368706 to 5, 13.7362 | 51.86° | it would move a point 1.06 (the most is 0.75) |
| four-style set: houses | sharp-duotone | 5, 13.7362 to 13.3857, 7.2108 | 142.11° | it would move a point 1.05 (the most is 0.75) |
| four-style set: houses | sharp-solid | 2, 6.8909 to 7.19165, 2.80835 | 141.82° | it would push the icon out past its own box |
| four-style set: houses | sharp-solid | 14.6142, 7.2108 to 23, 13.7362 | 37.89° | it would move a point 1.05 (the most is 0.75) |
| four-style set: houses | sharp-solid | 23, 13.7362 to 21.718025, 15.368675 | 128.14° | it would move a point 1.06 (the most is 0.75) |
| four-style set: houses | sharp-solid | 6.281906, 15.368706 to 5, 13.7362 | 51.86° | it would move a point 1.06 (the most is 0.75) |
| four-style set: houses | sharp-solid | 5, 13.7362 to 13.3857, 7.2108 | 142.11° | it would move a point 1.05 (the most is 0.75) |
| four-style set: indian-rupee | rounded-outline | 6, 11 to 16, 22 | 47.73° | it would push the icon out past its own box |
| four-style set: indian-rupee | rounded-two-tone | 6, 11 to 16, 22 | 47.73° | it would push the icon out past its own box |
| four-style set: indian-rupee | rounded-duotone | 6, 11 to 16, 22 | 47.73° | it would push the icon out past its own box |
| four-style set: indian-rupee | rounded-solid | 6, 11 to 16, 22 | 47.73° | it would push the icon out past its own box |
| four-style set: list-video | rounded-two-tone | 18.1991, 9.4029 to 22.1991, 12.3993 | 36.84° | it would push the icon out past its own box |
| four-style set: list-video | rounded-two-tone | 22.1991, 15.6007 to 18.1991, 18.5971 | 143.16° | it would push the icon out past its own box |
| four-style set: list-video | rounded-duotone | 18.1991, 9.4029 to 22.1991, 12.3993 | 36.84° | it would push the icon out past its own box |
| four-style set: list-video | rounded-duotone | 22.1991, 15.6007 to 18.1991, 18.5971 | 143.16° | it would push the icon out past its own box |
| four-style set: list-video | rounded-solid | 18.1991, 9.4029 to 22.1991, 12.3993 | 36.84° | it would push the icon out past its own box |
| four-style set: list-video | rounded-solid | 22.1991, 15.6007 to 18.1991, 18.5971 | 143.16° | it would push the icon out past its own box |
| four-style set: list-video | sharp-outline | 21.713543, 14.286457 to 16.143229, 18 | 146.31° | it would move a point 0.82 (the most is 0.75) |
| four-style set: list-video | sharp-two-tone | 22.5547, 14.8321 to 16.5547, 18.8321 | 146.31° | it would move a point 0.82 (the most is 0.75) |
| four-style set: list-video | sharp-two-tone | 21.713543, 14.286457 to 16.143229, 18 | 146.31° | it would move a point 0.82 (the most is 0.75) |
| four-style set: list-video | sharp-duotone | 22.5547, 14.8321 to 16.5547, 18.8321 | 146.31° | it would push the icon out past its own box |
| four-style set: list-video | sharp-solid | 22.5547, 14.8321 to 16.5547, 18.8321 | 146.31° | it would push the icon out past its own box |
| four-style set: mail-open | rounded-outline | 10.2563, 2.5588 to 3.2563, 7.5588 | 144.46° | it would move a point 1.02 (the most is 0.75) |
| four-style set: mail-open | rounded-outline | 20.7437, 7.5588 to 13.7437, 2.5588 | 35.54° | it would move a point 1.02 (the most is 0.75) |
| four-style set: mail-open | rounded-outline | 2, 10 to 10.8375, 16.3125 | 35.54° | it would move a point 1.02 (the most is 0.75) |
| four-style set: mail-open | rounded-outline | 13.1625, 16.3125 to 22, 10 | 144.46° | it would move a point 1.02 (the most is 0.75) |
| four-style set: mail-open | rounded-two-tone | 9.675, 1.7451 to 2.675, 6.7451 | 144.46° | it would move a point 1.02 (the most is 0.75) |
| four-style set: mail-open | rounded-two-tone | 21.325, 6.7451 to 14.325, 1.7451 | 35.54° | it would move a point 1.02 (the most is 0.75) |
| four-style set: mail-open | rounded-two-tone | 10.2563, 2.5588 to 3.2563, 7.5588 | 144.46° | it would move a point 1.02 (the most is 0.75) |
| four-style set: mail-open | rounded-two-tone | 20.7437, 7.5588 to 13.7437, 2.5588 | 35.54° | it would move a point 1.02 (the most is 0.75) |
| four-style set: mail-open | rounded-two-tone | 2, 10 to 10.8375, 16.3125 | 35.54° | it would move a point 1.02 (the most is 0.75) |
| four-style set: mail-open | rounded-two-tone | 13.1625, 16.3125 to 22, 10 | 144.46° | it would move a point 1.02 (the most is 0.75) |
| four-style set: mail-open | rounded-duotone | 9.675, 1.7451 to 2.675, 6.7451 | 144.46° | it would move a point 1.43 (the most is 0.75) |
| four-style set: mail-open | rounded-duotone | 21.325, 6.7451 to 14.325, 1.7451 | 35.54° | it would move a point 1.43 (the most is 0.75) |
| four-style set: mail-open | rounded-duotone | 2, 10 to 10.8375, 16.3125 | 35.54° | it would move a point 1.43 (the most is 0.75) |
| four-style set: mail-open | rounded-duotone | 13.1625, 16.3125 to 22, 10 | 144.46° | it would move a point 1.43 (the most is 0.75) |
| four-style set: mail-open | rounded-solid | 2, 10 to 10.8375, 16.3125 | 35.54° | it would move a point 1.02 (the most is 0.75) |
| four-style set: mail-open | rounded-solid | 13.1625, 16.3125 to 22, 10 | 144.46° | it would move a point 1.02 (the most is 0.75) |
| four-style set: mail-open | rounded-solid | 10.2563, 2.5588 to 3.2563, 7.5588 | 144.46° | it would push the icon out past its own box |
| four-style set: mail-open | rounded-solid | 20.7437, 7.5588 to 13.7437, 2.5588 | 35.54° | it would push the icon out past its own box |
| four-style set: mail-open | rounded-solid | 2, 10 to 10.8375, 16.3125 | 35.54° | it would move a point 1.02 (the most is 0.75) |
| four-style set: mail-open | rounded-solid | 13.1625, 16.3125 to 22, 10 | 144.46° | it would move a point 1.02 (the most is 0.75) |
| four-style set: mail-open | sharp-outline | 2, 10 to 12, 17.1428 | 35.54° | it would move a point 1.43 (the most is 0.75) |
| four-style set: mail-open | sharp-outline | 12, 17.1428 to 22, 10 | 144.46° | it would move a point 1.01 (the most is 0.75) |
| four-style set: mail-open | sharp-two-tone | 2, 10 to 12, 17.1428 | 35.54° | it would move a point 1.43 (the most is 0.75) |
| four-style set: mail-open | sharp-two-tone | 12, 17.1428 to 22, 10 | 144.46° | it would move a point 1.01 (the most is 0.75) |
| four-style set: mail-open | sharp-duotone | 2, 10 to 12, 17.1428 | 35.54° | it would move a point 1.43 (the most is 0.75) |
| four-style set: mail-open | sharp-duotone | 12, 17.1428 to 22, 10 | 144.46° | it would move a point 1.01 (the most is 0.75) |
| four-style set: mail-open | sharp-solid | 2, 10 to 12, 17.1428 | 35.54° | it would move a point 1.79 (the most is 0.75) |
| four-style set: mail-open | sharp-solid | 12, 17.1428 to 22, 10 | 144.46° | it would move a point 1.26 (the most is 0.75) |
| four-style set: mail-open | sharp-solid | 2, 10 to 12, 17.1428 | 35.54° | it would move a point 1.79 (the most is 0.75) |
| four-style set: mail-open | sharp-solid | 12, 17.1428 to 22, 10 | 144.46° | it would move a point 1.26 (the most is 0.75) |
| four-style set: money-bag | rounded-outline | 10, 7 to 8.3069, 4.5719 | 55.11° | it would turn a line it was not snapping by 7.8° |
| four-style set: money-bag | rounded-outline | 15.6931, 4.5719 to 14, 7 | 124.89° | it would turn a line it was not snapping by 7.2° |
| four-style set: money-bag | rounded-two-tone | 8.3795, 6.4244 to 7.4867, 5.1439 | 55.11° | it would turn a line it was not snapping by 7.2° |
| four-style set: money-bag | rounded-two-tone | 16.5133, 5.1439 to 15.6205, 6.4244 | 124.89° | it would turn a line it was not snapping by 7.2° |
| four-style set: money-bag | rounded-two-tone | 10, 7 to 8.3069, 4.5719 | 55.11° | it would turn a line it was not snapping by 7.8° |
| four-style set: money-bag | rounded-two-tone | 15.6931, 4.5719 to 14, 7 | 124.89° | it would turn a line it was not snapping by 7.2° |
| four-style set: money-bag | sharp-solid | 8.2133, 6.4767 to 5.7474, 3.6585 | 48.81° | it would make the shape cross itself |
| four-style set: money-bag | sharp-solid | 18.2526, 3.6585 to 15.7867, 6.4767 | 131.19° | it would make the shape cross itself |
| four-style set: money-bag | sharp-solid | 13.5462, 6 to 14.1856, 5.2693 | 131.19° | it would make the shape cross itself |
| four-style set: money-bag | sharp-solid | 9.8144, 5.2693 to 10.4538, 6 | 48.81° | it would make the shape cross itself |
| four-style set: money-bag-check | rounded-outline | 10, 7 to 8.3069, 4.5719 | 55.11° | it would turn a line it was not snapping by 7.8° |
| four-style set: money-bag-check | rounded-outline | 15.6931, 4.5719 to 14, 7 | 124.89° | it would turn a line it was not snapping by 7.2° |
| four-style set: money-bag-check | rounded-two-tone | 8.3795, 6.4244 to 7.4867, 5.1439 | 55.11° | it would turn a line it was not snapping by 7.2° |
| four-style set: money-bag-check | rounded-two-tone | 16.5133, 5.1439 to 15.6205, 6.4244 | 124.89° | it would turn a line it was not snapping by 7.2° |
| four-style set: money-bag-check | rounded-two-tone | 10, 7 to 8.3069, 4.5719 | 55.11° | it would turn a line it was not snapping by 7.8° |
| four-style set: money-bag-check | rounded-two-tone | 15.6931, 4.5719 to 14, 7 | 124.89° | it would turn a line it was not snapping by 7.2° |
| four-style set: money-bag-check | sharp-solid | 8.2133, 6.4767 to 5.7474, 3.6585 | 48.81° | it would make the shape cross itself |
| four-style set: money-bag-check | sharp-solid | 18.2526, 3.6585 to 15.7867, 6.4767 | 131.19° | it would make the shape cross itself |
| four-style set: money-bag-check | sharp-solid | 13.5462, 6 to 14.1856, 5.2693 | 131.19° | it would make the shape cross itself |
| four-style set: money-bag-check | sharp-solid | 9.8144, 5.2693 to 10.4538, 6 | 48.81° | it would make the shape cross itself |
| four-style set: money-bag-dollar-sign | rounded-outline | 10, 7 to 8.3069, 4.5719 | 55.11° | it would turn a line it was not snapping by 7.8° |
| four-style set: money-bag-dollar-sign | rounded-outline | 15.6931, 4.5719 to 14, 7 | 124.89° | it would turn a line it was not snapping by 7.2° |
| four-style set: money-bag-dollar-sign | rounded-two-tone | 8.3795, 6.4244 to 7.4867, 5.1439 | 55.11° | it would turn a line it was not snapping by 7.2° |
| four-style set: money-bag-dollar-sign | rounded-two-tone | 16.5133, 5.1439 to 15.6205, 6.4244 | 124.89° | it would turn a line it was not snapping by 7.2° |
| four-style set: money-bag-dollar-sign | rounded-two-tone | 10, 7 to 8.3069, 4.5719 | 55.11° | it would turn a line it was not snapping by 7.8° |
| four-style set: money-bag-dollar-sign | rounded-two-tone | 15.6931, 4.5719 to 14, 7 | 124.89° | it would turn a line it was not snapping by 7.2° |
| four-style set: money-bag-dollar-sign | sharp-solid | 8.2133, 6.4767 to 5.7474, 3.6585 | 48.81° | it would make the shape cross itself |
| four-style set: money-bag-dollar-sign | sharp-solid | 18.2526, 3.6585 to 15.7867, 6.4767 | 131.19° | it would make the shape cross itself |
| four-style set: money-bag-dollar-sign | sharp-solid | 13.5462, 6 to 14.1856, 5.2693 | 131.19° | it would make the shape cross itself |
| four-style set: money-bag-dollar-sign | sharp-solid | 9.8144, 5.2693 to 10.4538, 6 | 48.81° | it would make the shape cross itself |
| four-style set: money-bag-minus | rounded-outline | 10, 7 to 8.3069, 4.5719 | 55.11° | it would turn a line it was not snapping by 7.8° |
| four-style set: money-bag-minus | rounded-outline | 15.6931, 4.5719 to 14, 7 | 124.89° | it would turn a line it was not snapping by 7.2° |
| four-style set: money-bag-minus | rounded-two-tone | 8.3795, 6.4244 to 7.4867, 5.1439 | 55.11° | it would turn a line it was not snapping by 7.2° |
| four-style set: money-bag-minus | rounded-two-tone | 16.5133, 5.1439 to 15.6205, 6.4244 | 124.89° | it would turn a line it was not snapping by 7.2° |
| four-style set: money-bag-minus | rounded-two-tone | 10, 7 to 8.3069, 4.5719 | 55.11° | it would turn a line it was not snapping by 7.8° |
| four-style set: money-bag-minus | rounded-two-tone | 15.6931, 4.5719 to 14, 7 | 124.89° | it would turn a line it was not snapping by 7.2° |
| four-style set: money-bag-minus | sharp-solid | 8.2133, 6.4767 to 5.7474, 3.6585 | 48.81° | it would make the shape cross itself |
| four-style set: money-bag-minus | sharp-solid | 18.2526, 3.6585 to 15.7867, 6.4767 | 131.19° | it would make the shape cross itself |
| four-style set: money-bag-minus | sharp-solid | 13.5462, 6 to 14.1856, 5.2693 | 131.19° | it would make the shape cross itself |
| four-style set: money-bag-minus | sharp-solid | 9.8144, 5.2693 to 10.4538, 6 | 48.81° | it would make the shape cross itself |
| four-style set: money-bag-plus | rounded-outline | 10, 7 to 8.3069, 4.5719 | 55.11° | it would turn a line it was not snapping by 7.8° |
| four-style set: money-bag-plus | rounded-outline | 15.6931, 4.5719 to 14, 7 | 124.89° | it would turn a line it was not snapping by 7.2° |
| four-style set: money-bag-plus | rounded-two-tone | 8.3795, 6.4244 to 7.4867, 5.1439 | 55.11° | it would turn a line it was not snapping by 7.2° |
| four-style set: money-bag-plus | rounded-two-tone | 16.5133, 5.1439 to 15.6205, 6.4244 | 124.89° | it would turn a line it was not snapping by 7.2° |
| four-style set: money-bag-plus | rounded-two-tone | 10, 7 to 8.3069, 4.5719 | 55.11° | it would turn a line it was not snapping by 7.8° |
| four-style set: money-bag-plus | rounded-two-tone | 15.6931, 4.5719 to 14, 7 | 124.89° | it would turn a line it was not snapping by 7.2° |
| four-style set: money-bag-plus | sharp-solid | 8.2133, 6.4767 to 5.7474, 3.6585 | 48.81° | it would make the shape cross itself |
| four-style set: money-bag-plus | sharp-solid | 18.2526, 3.6585 to 15.7867, 6.4767 | 131.19° | it would make the shape cross itself |
| four-style set: money-bag-plus | sharp-solid | 13.5462, 6 to 14.1856, 5.2693 | 131.19° | it would make the shape cross itself |
| four-style set: money-bag-plus | sharp-solid | 9.8144, 5.2693 to 10.4538, 6 | 48.81° | it would make the shape cross itself |
| four-style set: money-bag-x | rounded-outline | 10, 7 to 8.3069, 4.5719 | 55.11° | it would turn a line it was not snapping by 7.8° |
| four-style set: money-bag-x | rounded-outline | 15.6931, 4.5719 to 14, 7 | 124.89° | it would turn a line it was not snapping by 7.2° |
| four-style set: money-bag-x | rounded-two-tone | 8.3795, 6.4244 to 7.4867, 5.1439 | 55.11° | it would turn a line it was not snapping by 7.2° |
| four-style set: money-bag-x | rounded-two-tone | 16.5133, 5.1439 to 15.6205, 6.4244 | 124.89° | it would turn a line it was not snapping by 7.2° |
| four-style set: money-bag-x | rounded-two-tone | 10, 7 to 8.3069, 4.5719 | 55.11° | it would turn a line it was not snapping by 7.8° |
| four-style set: money-bag-x | rounded-two-tone | 15.6931, 4.5719 to 14, 7 | 124.89° | it would turn a line it was not snapping by 7.2° |
| four-style set: money-bag-x | sharp-solid | 8.2133, 6.4767 to 5.7474, 3.6585 | 48.81° | it would make the shape cross itself |
| four-style set: money-bag-x | sharp-solid | 18.2526, 3.6585 to 15.7867, 6.4767 | 131.19° | it would make the shape cross itself |
| four-style set: money-bag-x | sharp-solid | 13.5462, 6 to 14.1856, 5.2693 | 131.19° | it would make the shape cross itself |
| four-style set: money-bag-x | sharp-solid | 9.8144, 5.2693 to 10.4538, 6 | 48.81° | it would make the shape cross itself |
| four-style set: pig | sharp-outline | 9.7355, 21 to 11.6223, 18.315083 | 125.1° | it would shorten a line by half |
| four-style set: pig | sharp-two-tone | 9.7355, 21 to 11.6223, 18.315083 | 125.1° | it would shorten a line by half |
| four-style set: piggy-bank | rounded-two-tone | 12.6255, 22.3928 to 10.9699, 20.1579 | 53.47° | it would make the shape cross itself |
| four-style set: piggy-bank | rounded-two-tone | 10.9247, 20.1579 to 9.2693, 22.3928 | 126.53° | it would make the shape cross itself |
| four-style set: piggy-bank | rounded-two-tone | 13.429, 21.7976 to 11.6236, 19.3603 | 53.47° | it would make the shape cross itself |
| four-style set: piggy-bank | rounded-two-tone | 10.2711, 19.3603 to 8.4657, 21.7976 | 126.53° | it would make the shape cross itself |
| four-style set: piggy-bank | rounded-duotone | 12.6255, 22.3928 to 10.9699, 20.1579 | 53.47° | it would make the shape cross itself |
| four-style set: piggy-bank | rounded-duotone | 10.9247, 20.1579 to 9.2693, 22.3928 | 126.53° | it would make the shape cross itself |
| four-style set: piggy-bank | rounded-solid | 12.6255, 22.3928 to 10.9699, 20.1579 | 53.47° | it would make the shape cross itself |
| four-style set: piggy-bank | rounded-solid | 10.9247, 20.1579 to 9.2693, 22.3928 | 126.53° | it would make the shape cross itself |
| four-style set: piggy-bank | sharp-two-tone | 12.6255, 22.3928 to 10.9699, 20.1579 | 53.47° | it would make the shape cross itself |
| four-style set: piggy-bank | sharp-two-tone | 10.9247, 20.1579 to 9.2693, 22.3928 | 126.53° | it would make the shape cross itself |
| four-style set: piggy-bank | sharp-two-tone | 2.6043, 8.413 to 4.2236, 9.5869 | 35.94° | it would make the shape cross itself |
| four-style set: piggy-bank | sharp-two-tone | 13.429, 21.7976 to 11.6236, 19.3603 | 53.47° | it would make the shape cross itself |
| four-style set: piggy-bank | sharp-two-tone | 10.2711, 19.3603 to 8.4657, 21.7976 | 126.53° | it would make the shape cross itself |
| four-style set: piggy-bank | sharp-duotone | 12.6255, 22.3928 to 10.9699, 20.1579 | 53.47° | it would make the shape cross itself |
| four-style set: piggy-bank | sharp-duotone | 10.9247, 20.1579 to 9.2693, 22.3928 | 126.53° | it would make the shape cross itself |
| four-style set: piggy-bank | sharp-duotone | 2.6043, 8.413 to 4.2236, 9.5869 | 35.94° | it would make the shape cross itself |
| four-style set: piggy-bank | sharp-solid | 13.0753, 23 to 12.6255, 22.3928 | 53.47° | it would make the shape cross itself |
| four-style set: piggy-bank | sharp-solid | 12.6255, 22.3928 to 10.9699, 20.1579 | 53.47° | it would make the shape cross itself |
| four-style set: piggy-bank | sharp-solid | 10.9247, 20.1579 to 9.2693, 22.3928 | 126.53° | it would make the shape cross itself |
| four-style set: piggy-bank | sharp-solid | 9.2693, 22.3928 to 8.8195, 23 | 126.53° | it would make the shape cross itself |
| four-style set: piggy-bank | sharp-solid | 2.6043, 8.413 to 4.2236, 9.5869 | 35.94° | it would make the shape cross itself |
| four-style set: plane | rounded-outline | 2.3893, 7.9218 to 8.4518, 12.5 | 37.06° | it would move a point 0.84 (the most is 0.75) |
| four-style set: plane | rounded-outline | 12.3777, 6.8957 to 16.7849, 3.6942 | 144° | it would move a point 0.90 (the most is 0.75) |
| four-style set: plane | rounded-outline | 12.3777, 6.8957 to 6, 16 | 125.01° | it would move a point 1.04 (the most is 0.75) |
| four-style set: plane | rounded-outline | 8, 18 to 16.56226, 10.97086 | 140.62° | it would move a point 0.90 (the most is 0.75) |
| four-style set: plane | rounded-two-tone | 12.1491, 5.8258 to 16.1972, 2.8852 | 144° | it would move a point 0.90 (the most is 0.75) |
| four-style set: plane | rounded-two-tone | 10.8909, 17.2845 to 9.011, 18.5067 | 146.97° | it would move a point 0.90 (the most is 0.75) |
| four-style set: plane | rounded-two-tone | 5.469, 15.0151 to 7.0792, 12.7165 | 125.01° | it would move a point 1.04 (the most is 0.75) |
| four-style set: plane | rounded-two-tone | 7.0792, 12.7165 to 1.7866, 8.7199 | 37.06° | it would move a point 0.84 (the most is 0.75) |
| four-style set: plane | rounded-two-tone | 2.3893, 7.9218 to 8.4518, 12.5 | 37.06° | it would move a point 0.84 (the most is 0.75) |
| four-style set: plane | rounded-two-tone | 12.3777, 6.8957 to 16.7849, 3.6942 | 144° | it would move a point 0.90 (the most is 0.75) |
| four-style set: plane | rounded-two-tone | 12.3777, 6.8957 to 6, 16 | 125.01° | it would move a point 1.04 (the most is 0.75) |
| four-style set: plane | rounded-two-tone | 8, 18 to 16.56226, 10.97086 | 140.62° | it would move a point 0.90 (the most is 0.75) |
| four-style set: plane | rounded-duotone | 2.3893, 7.9218 to 8.4518, 12.5 | 37.06° | it would move a point 0.84 (the most is 0.75) |
| four-style set: plane | rounded-duotone | 12.3777, 6.8957 to 16.7849, 3.6942 | 144° | it would move a point 0.90 (the most is 0.75) |
| four-style set: plane | rounded-duotone | 12.3777, 6.8957 to 6, 16 | 125.01° | it would move a point 1.04 (the most is 0.75) |
| four-style set: plane | rounded-duotone | 8, 18 to 16.56226, 10.97086 | 140.62° | it would move a point 0.90 (the most is 0.75) |
| four-style set: plane | sharp-outline | 12.3777, 6.8957 to 16.7849, 3.6942 | 144° | it would move a point 0.90 (the most is 0.75) |
| four-style set: plane | sharp-outline | 12.3777, 6.8957 to 6, 16 | 125.01° | it would move a point 1.04 (the most is 0.75) |
| four-style set: plane | sharp-outline | 8, 18 to 16.56226, 10.97086 | 140.62° | it would move a point 0.90 (the most is 0.75) |
| four-style set: plane | sharp-two-tone | 12.1425, 5.8306 to 16.1972, 2.8852 | 144° | it would move a point 0.90 (the most is 0.75) |
| four-style set: plane | sharp-two-tone | 11.04338, 17.14052 to 8.9161, 18.5746 | 146.01° | it would move a point 0.90 (the most is 0.75) |
| four-style set: plane | sharp-two-tone | 12.3777, 6.8957 to 16.7849, 3.6942 | 144° | it would move a point 0.90 (the most is 0.75) |
| four-style set: plane | sharp-two-tone | 12.3777, 6.8957 to 6, 16 | 125.01° | it would move a point 1.04 (the most is 0.75) |
| four-style set: plane | sharp-two-tone | 8, 18 to 16.56226, 10.97086 | 140.62° | it would move a point 0.90 (the most is 0.75) |
| four-style set: plane | sharp-duotone | 12.3777, 6.8957 to 16.7849, 3.6942 | 144° | it would move a point 0.90 (the most is 0.75) |
| four-style set: plane | sharp-duotone | 12.3777, 6.8957 to 6, 16 | 125.01° | it would move a point 1.04 (the most is 0.75) |
| four-style set: plane | sharp-duotone | 8, 18 to 16.56226, 10.97086 | 140.62° | it would move a point 0.90 (the most is 0.75) |
| four-style set: play | sharp-outline | 6, 4 to 18, 12 | 33.69° | it would move a point 2.00 (the most is 0.75) |
| four-style set: play | sharp-outline | 18, 12 to 6, 20 | 146.31° | it would move a point 1.62 (the most is 0.75) |
| four-style set: play | sharp-two-tone | 6.5547, 3.1679 to 18.5547, 11.1679 | 33.69° | it would move a point 2.00 (the most is 0.75) |
| four-style set: play | sharp-two-tone | 18.5547, 12.8321 to 6.5547, 20.8321 | 146.31° | it would move a point 2.00 (the most is 0.75) |
| four-style set: play | sharp-two-tone | 6, 4 to 18, 12 | 33.69° | it would move a point 2.00 (the most is 0.75) |
| four-style set: play | sharp-two-tone | 18, 12 to 6, 20 | 146.31° | it would move a point 1.62 (the most is 0.75) |
| four-style set: play | sharp-duotone | 6, 4 to 18, 12 | 33.69° | it would move a point 2.00 (the most is 0.75) |
| four-style set: play | sharp-duotone | 18, 12 to 6, 20 | 146.31° | it would move a point 1.62 (the most is 0.75) |
| four-style set: play | sharp-solid | 6.5547, 3.1679 to 18.5547, 11.1679 | 33.69° | it would move a point 1.41 (the most is 0.75) |
| four-style set: play | sharp-solid | 18.5547, 12.8321 to 6.5547, 20.8321 | 146.31° | it would move a point 1.41 (the most is 0.75) |
| four-style set: play-off | sharp-outline | 14.4, 14.4 to 6, 20 | 146.31° | it would move a point 1.13 (the most is 0.75) |
| four-style set: play-off | sharp-two-tone | 15.1211, 15.1211 to 6.5547, 20.8321 | 146.31° | it would move a point 1.62 (the most is 0.75) |
| four-style set: play-off | sharp-two-tone | 7.365, 3.7082 to 18.5547, 11.1679 | 33.69° | it would move a point 1.76 (the most is 0.75) |
| four-style set: play-off | sharp-two-tone | 18.5547, 12.8321 to 17.3152, 13.6584 | 146.31° | it would move a point 1.77 (the most is 0.75) |
| four-style set: play-off | sharp-two-tone | 14.4, 14.4 to 6, 20 | 146.31° | it would move a point 1.62 (the most is 0.75) |
| four-style set: play-off | sharp-duotone | 15.1211, 15.1211 to 6.5547, 20.8321 | 146.31° | it would move a point 1.62 (the most is 0.75) |
| four-style set: play-off | sharp-duotone | 7.365, 3.7082 to 18.5547, 11.1679 | 33.69° | it would move a point 1.76 (the most is 0.75) |
| four-style set: play-off | sharp-duotone | 18.5547, 12.8321 to 17.3152, 13.6584 | 146.31° | it would move a point 1.77 (the most is 0.75) |
| four-style set: play-off | sharp-solid | 15.1211, 15.1211 to 6.5547, 20.8321 | 146.31° | it would move a point 1.62 (the most is 0.75) |
| four-style set: play-off | sharp-solid | 7.365, 3.7082 to 18.5547, 11.1679 | 33.69° | it would move a point 1.76 (the most is 0.75) |
| four-style set: play-off | sharp-solid | 18.5547, 12.8321 to 17.3152, 13.6584 | 146.31° | it would move a point 1.77 (the most is 0.75) |
| four-style set: regex | sharp-outline | 12.6, 11.3 to 21.4, 4.7 | 143.13° | it would move a point 0.78 (the most is 0.75) |
| four-style set: regex | sharp-outline | 12.6, 4.7 to 21.4, 11.3 | 36.87° | it would move a point 0.78 (the most is 0.75) |
| four-style set: regex | sharp-two-tone | 12.6, 11.3 to 21.4, 4.7 | 143.13° | it would move a point 0.78 (the most is 0.75) |
| four-style set: regex | sharp-two-tone | 12.6, 4.7 to 21.4, 11.3 | 36.87° | it would move a point 0.78 (the most is 0.75) |
| four-style set: regex | sharp-duotone | 12.6, 11.3 to 21.4, 4.7 | 143.13° | it would move a point 0.78 (the most is 0.75) |
| four-style set: regex | sharp-duotone | 12.6, 4.7 to 21.4, 11.3 | 36.87° | it would move a point 0.78 (the most is 0.75) |
| four-style set: regex | sharp-solid | 12.6, 11.3 to 21.4, 4.7 | 143.13° | it would move a point 0.78 (the most is 0.75) |
| four-style set: regex | sharp-solid | 12.6, 4.7 to 21.4, 11.3 | 36.87° | it would move a point 0.78 (the most is 0.75) |
| four-style set: rewind | sharp-outline | 22, 17.998 to 13.5417, 12 | 35.34° | it would move a point 1.00 (the most is 0.75) |
| four-style set: rewind | sharp-outline | 13.5417, 12 to 22, 6.002 | 144.66° | it would move a point 1.23 (the most is 0.75) |
| four-style set: rewind | sharp-outline | 10, 17.998 to 2, 12 | 36.86° | it would move a point 1.00 (the most is 0.75) |
| four-style set: rewind | sharp-outline | 2, 12 to 10, 6.002 | 143.14° | it would move a point 0.81 (the most is 0.75) |
| four-style set: rewind | sharp-two-tone | 21.4216, 18.8137 to 12.9633, 12.8157 | 35.34° | it would move a point 1.00 (the most is 0.75) |
| four-style set: rewind | sharp-two-tone | 12.9633, 11.1843 to 21.4216, 5.1863 | 144.66° | it would move a point 1.23 (the most is 0.75) |
| four-style set: rewind | sharp-two-tone | 9.4001, 18.7981 to 1.4001, 12.8001 | 36.86° | it would move a point 1.00 (the most is 0.75) |
| four-style set: rewind | sharp-two-tone | 1.4001, 11.1999 to 9.4001, 5.2019 | 143.14° | it would move a point 1.00 (the most is 0.75) |
| four-style set: rewind | sharp-two-tone | 22, 17.998 to 13.5417, 12 | 35.34° | it would move a point 1.00 (the most is 0.75) |
| four-style set: rewind | sharp-two-tone | 13.5417, 12 to 22, 6.002 | 144.66° | it would move a point 1.23 (the most is 0.75) |
| four-style set: rewind | sharp-two-tone | 10, 17.998 to 2, 12 | 36.86° | it would move a point 1.00 (the most is 0.75) |
| four-style set: rewind | sharp-two-tone | 2, 12 to 10, 6.002 | 143.14° | it would move a point 0.81 (the most is 0.75) |
| four-style set: rewind | sharp-duotone | 22, 17.998 to 13.5417, 12 | 35.34° | it would move a point 1.00 (the most is 0.75) |
| four-style set: rewind | sharp-duotone | 13.5417, 12 to 22, 6.002 | 144.66° | it would move a point 1.23 (the most is 0.75) |
| four-style set: rewind | sharp-duotone | 10, 17.998 to 2, 12 | 36.86° | it would move a point 1.00 (the most is 0.75) |
| four-style set: rewind | sharp-duotone | 2, 12 to 10, 6.002 | 143.14° | it would move a point 0.81 (the most is 0.75) |
| four-style set: rewind | sharp-solid | 21.4216, 18.8137 to 12.9633, 12.8157 | 35.34° | it would move a point 0.87 (the most is 0.75) |
| four-style set: rewind | sharp-solid | 12.9633, 11.1843 to 21.4216, 5.1863 | 144.66° | it would move a point 0.87 (the most is 0.75) |
| four-style set: rewind | sharp-solid | 9.4001, 18.7981 to 1.4001, 12.8001 | 36.86° | it would push the icon out past its own box |
| four-style set: rewind | sharp-solid | 1.4001, 11.1999 to 9.4001, 5.2019 | 143.14° | it would push the icon out past its own box |
| four-style set: rocket | rounded-outline | 10.4731, 17.1897 to 16.7303, 12.7638 | 144.73° | it would move a point 1.19 (the most is 0.75) |
| four-style set: rocket | rounded-outline | 6.8103, 13.5269 to 11.2362, 7.2697 | 125.27° | it would move a point 1.01 (the most is 0.75) |
| four-style set: rocket | rounded-two-tone | 10.4731, 17.1897 to 16.7303, 12.7638 | 144.73° | it would move a point 1.19 (the most is 0.75) |
| four-style set: rocket | rounded-two-tone | 6.8103, 13.5269 to 11.2362, 7.2697 | 125.27° | it would move a point 1.01 (the most is 0.75) |
| four-style set: rocket | rounded-solid | 10.4731, 17.1897 to 16.7303, 12.7638 | 144.73° | it would move a point 1.19 (the most is 0.75) |
| four-style set: rocket | rounded-solid | 11.2362, 7.2697 to 6.8103, 13.5269 | 125.27° | it would move a point 1.01 (the most is 0.75) |
| four-style set: rocket | rounded-solid | 10.4731, 17.1897 to 16.7303, 12.7638 | 144.73° | it would move a point 1.19 (the most is 0.75) |
| four-style set: rocket | rounded-solid | 6.8103, 13.5269 to 11.2362, 7.2697 | 125.27° | it would move a point 1.01 (the most is 0.75) |
| four-style set: rocket | sharp-outline | 10.4731, 17.1897 to 16.7303, 12.7638 | 144.73° | it would move a point 1.05 (the most is 0.75) |
| four-style set: rocket | sharp-outline | 6.8103, 13.5269 to 11.2362, 7.2697 | 125.27° | it would move a point 1.00 (the most is 0.75) |
| four-style set: rocket | sharp-two-tone | 10.4731, 17.1897 to 16.7303, 12.7638 | 144.73° | it would move a point 1.05 (the most is 0.75) |
| four-style set: rocket | sharp-two-tone | 6.8103, 13.5269 to 11.2362, 7.2697 | 125.27° | it would move a point 1.00 (the most is 0.75) |
| four-style set: rocket | sharp-solid | 10.4731, 17.1897 to 16.7303, 12.7638 | 144.73° | it would move a point 1.05 (the most is 0.75) |
| four-style set: rocket | sharp-solid | 11.2362, 7.2697 to 6.8103, 13.5269 | 125.27° | it would move a point 1.00 (the most is 0.75) |
| four-style set: rocket | sharp-solid | 10.4731, 17.1897 to 16.7303, 12.7638 | 144.73° | it would move a point 1.05 (the most is 0.75) |
| four-style set: rocket | sharp-solid | 6.8103, 13.5269 to 11.2362, 7.2697 | 125.27° | it would move a point 1.00 (the most is 0.75) |
| four-style set: rocket-fast | rounded-outline | 10.4731, 17.1897 to 16.7303, 12.7638 | 144.73° | it would move a point 1.19 (the most is 0.75) |
| four-style set: rocket-fast | rounded-outline | 6.8103, 13.5269 to 11.2362, 7.2697 | 125.27° | it would move a point 1.01 (the most is 0.75) |
| four-style set: rocket-fast | rounded-two-tone | 10.4731, 17.1897 to 16.7303, 12.7638 | 144.73° | it would move a point 1.19 (the most is 0.75) |
| four-style set: rocket-fast | rounded-two-tone | 6.8103, 13.5269 to 11.2362, 7.2697 | 125.27° | it would move a point 1.01 (the most is 0.75) |
| four-style set: rocket-fast | rounded-solid | 10.4731, 17.1897 to 16.7303, 12.7638 | 144.73° | it would move a point 1.19 (the most is 0.75) |
| four-style set: rocket-fast | rounded-solid | 11.2362, 7.2697 to 6.8103, 13.5269 | 125.27° | it would move a point 1.01 (the most is 0.75) |
| four-style set: rocket-fast | rounded-solid | 10.4731, 17.1897 to 16.7303, 12.7638 | 144.73° | it would move a point 1.19 (the most is 0.75) |
| four-style set: rocket-fast | rounded-solid | 6.8103, 13.5269 to 11.2362, 7.2697 | 125.27° | it would move a point 1.01 (the most is 0.75) |
| four-style set: rocket-fast | sharp-outline | 10.4731, 17.1897 to 16.7303, 12.7638 | 144.73° | it would move a point 1.05 (the most is 0.75) |
| four-style set: rocket-fast | sharp-outline | 6.8103, 13.5269 to 11.2362, 7.2697 | 125.27° | it would move a point 1.00 (the most is 0.75) |
| four-style set: rocket-fast | sharp-two-tone | 10.4731, 17.1897 to 16.7303, 12.7638 | 144.73° | it would move a point 1.05 (the most is 0.75) |
| four-style set: rocket-fast | sharp-two-tone | 6.8103, 13.5269 to 11.2362, 7.2697 | 125.27° | it would move a point 1.00 (the most is 0.75) |
| four-style set: rocket-fast | sharp-solid | 10.4731, 17.1897 to 16.7303, 12.7638 | 144.73° | it would move a point 1.05 (the most is 0.75) |
| four-style set: rocket-fast | sharp-solid | 11.2362, 7.2697 to 6.8103, 13.5269 | 125.27° | it would move a point 1.00 (the most is 0.75) |
| four-style set: rocket-fast | sharp-solid | 10.4731, 17.1897 to 16.7303, 12.7638 | 144.73° | it would move a point 1.05 (the most is 0.75) |
| four-style set: rocket-fast | sharp-solid | 6.8103, 13.5269 to 11.2362, 7.2697 | 125.27° | it would move a point 1.00 (the most is 0.75) |
| four-style set: scissors | rounded-outline | 8.1213, 15.8787 to 17, 3 | 124.58° | it would move a point 1.41 (the most is 0.75) |
| four-style set: scissors | rounded-outline | 9.5708, 6.729 to 7, 3 | 55.42° | it would move a point 1.41 (the most is 0.75) |
| four-style set: scissors | rounded-two-tone | 8.1213, 15.8787 to 17, 3 | 124.58° | it would move a point 1.41 (the most is 0.75) |
| four-style set: scissors | rounded-two-tone | 9.5708, 6.729 to 7, 3 | 55.42° | it would move a point 1.41 (the most is 0.75) |
| four-style set: scissors | rounded-duotone | 8.1213, 15.8787 to 17, 3 | 124.58° | it would move a point 1.41 (the most is 0.75) |
| four-style set: scissors | rounded-duotone | 9.5708, 6.729 to 7, 3 | 55.42° | it would move a point 1.41 (the most is 0.75) |
| four-style set: scissors | rounded-solid | 8.1213, 15.8787 to 17, 3 | 124.58° | it would move a point 1.41 (the most is 0.75) |
| four-style set: scissors | rounded-solid | 9.5708, 6.729 to 7, 3 | 55.42° | it would move a point 1.41 (the most is 0.75) |
| four-style set: scissors | sharp-outline | 8.1213, 15.8787 to 17.2981, 2.5676 | 124.58° | it would move a point 1.46 (the most is 0.75) |
| four-style set: scissors | sharp-outline | 9.8689, 7.1614 to 6.7019, 2.5676 | 55.42° | it would move a point 1.46 (the most is 0.75) |
| four-style set: scissors | sharp-two-tone | 8.1213, 15.8787 to 17.2981, 2.5676 | 124.58° | it would move a point 1.46 (the most is 0.75) |
| four-style set: scissors | sharp-two-tone | 9.8689, 7.1614 to 6.7019, 2.5676 | 55.42° | it would move a point 1.46 (the most is 0.75) |
| four-style set: scissors | sharp-duotone | 8.1213, 15.8787 to 17.2981, 2.5676 | 124.58° | it would move a point 1.46 (the most is 0.75) |
| four-style set: scissors | sharp-duotone | 9.8689, 7.1614 to 6.7019, 2.5676 | 55.42° | it would move a point 1.46 (the most is 0.75) |
| four-style set: scissors | sharp-solid | 8.1213, 15.8787 to 17.2981, 2.5676 | 124.58° | it would move a point 1.46 (the most is 0.75) |
| four-style set: scissors | sharp-solid | 9.8689, 7.1614 to 6.7019, 2.5676 | 55.42° | it would move a point 1.46 (the most is 0.75) |
| four-style set: scissors-horizontal | rounded-outline | 8.1213, 8.1213 to 21, 17 | 34.58° | it would move a point 1.41 (the most is 0.75) |
| four-style set: scissors-horizontal | rounded-outline | 17.271, 9.5708 to 21, 7 | 145.42° | it would move a point 1.41 (the most is 0.75) |
| four-style set: scissors-horizontal | rounded-two-tone | 8.1213, 8.1213 to 21, 17 | 34.58° | it would move a point 1.41 (the most is 0.75) |
| four-style set: scissors-horizontal | rounded-two-tone | 17.271, 9.5708 to 21, 7 | 145.42° | it would move a point 1.41 (the most is 0.75) |
| four-style set: scissors-horizontal | rounded-duotone | 8.1213, 8.1213 to 21, 17 | 34.58° | it would move a point 1.41 (the most is 0.75) |
| four-style set: scissors-horizontal | rounded-duotone | 17.271, 9.5708 to 21, 7 | 145.42° | it would move a point 1.41 (the most is 0.75) |
| four-style set: scissors-horizontal | rounded-solid | 8.1213, 8.1213 to 21, 17 | 34.58° | it would move a point 1.41 (the most is 0.75) |
| four-style set: scissors-horizontal | rounded-solid | 17.271, 9.5708 to 21, 7 | 145.42° | it would move a point 1.41 (the most is 0.75) |
| four-style set: scissors-horizontal | sharp-outline | 8.1213, 8.1213 to 21.4324, 17.2981 | 34.58° | it would move a point 1.46 (the most is 0.75) |
| four-style set: scissors-horizontal | sharp-outline | 16.8386, 9.8689 to 21.4324, 6.7019 | 145.42° | it would move a point 1.46 (the most is 0.75) |
| four-style set: scissors-horizontal | sharp-two-tone | 8.1213, 8.1213 to 21.4324, 17.2981 | 34.58° | it would move a point 1.46 (the most is 0.75) |
| four-style set: scissors-horizontal | sharp-two-tone | 16.8386, 9.8689 to 21.4324, 6.7019 | 145.42° | it would move a point 1.46 (the most is 0.75) |
| four-style set: scissors-horizontal | sharp-duotone | 8.1213, 8.1213 to 21.4324, 17.2981 | 34.58° | it would move a point 1.46 (the most is 0.75) |
| four-style set: scissors-horizontal | sharp-duotone | 16.8386, 9.8689 to 21.4324, 6.7019 | 145.42° | it would move a point 1.46 (the most is 0.75) |
| four-style set: scissors-horizontal | sharp-solid | 8.1213, 8.1213 to 21.4324, 17.2981 | 34.58° | it would move a point 1.46 (the most is 0.75) |
| four-style set: scissors-horizontal | sharp-solid | 16.8386, 9.8689 to 21.4324, 6.7019 | 145.42° | it would move a point 1.46 (the most is 0.75) |
| four-style set: send | rounded-outline | 14.5098, 21.5637 to 9.9303, 14.8559 | 55.68° | it would move a point 0.75 (the most is 0.75) |
| four-style set: send | rounded-outline | 9.1441, 14.0697 to 2.4363, 9.4902 | 34.32° | it would move a point 0.75 (the most is 0.75) |
| four-style set: send | rounded-two-tone | 13.6839, 22.1275 to 9.1044, 15.4197 | 55.68° | it would move a point 0.75 (the most is 0.75) |
| four-style set: send | rounded-two-tone | 8.5803, 14.8956 to 1.8725, 10.3161 | 34.32° | it would move a point 0.75 (the most is 0.75) |
| four-style set: send | rounded-two-tone | 14.5098, 21.5637 to 9.9303, 14.8559 | 55.68° | it would move a point 0.75 (the most is 0.75) |
| four-style set: send | rounded-two-tone | 9.1441, 14.0697 to 2.4363, 9.4902 | 34.32° | it would move a point 0.75 (the most is 0.75) |
| four-style set: send | rounded-duotone | 13.6839, 22.1275 to 9.1044, 15.4197 | 55.68° | it would move a point 0.75 (the most is 0.75) |
| four-style set: send | rounded-duotone | 8.5803, 14.8956 to 1.8725, 10.3161 | 34.32° | it would move a point 0.75 (the most is 0.75) |
| four-style set: send | rounded-duotone | 13.6839, 22.1275 to 9.1044, 15.4197 | 55.68° | it would move a point 0.75 (the most is 0.75) |
| four-style set: send | rounded-solid | 13.6839, 22.1275 to 9.1044, 15.4197 | 55.68° | it would move a point 1.50 (the most is 0.75) |
| four-style set: send | rounded-solid | 8.5803, 14.8956 to 1.8725, 10.3161 | 34.32° | it would move a point 1.50 (the most is 0.75) |
| four-style set: send | rounded-solid | 15.8057, 8.1943 to 7.6311, 14.2476 | 143.48° | it would move a point 1.50 (the most is 0.75) |
| four-style set: send | rounded-solid | 7.6311, 14.2476 to 8.5803, 14.8956 | 34.32° | it would move a point 1.57 (the most is 0.75) |
| four-style set: send | rounded-solid | 9.1044, 15.4197 to 9.7524, 16.3689 | 55.68° | it would move a point 1.57 (the most is 0.75) |
| four-style set: send | rounded-solid | 9.7524, 16.3689 to 15.8057, 8.1943 | 126.52° | it would shorten a line by half |
| four-style set: send | sharp-outline | 16.0826, 22 to 10.369, 13.631 | 55.68° | it would move a point 0.94 (the most is 0.75) |
| four-style set: send | sharp-outline | 10.369, 13.631 to 2, 7.9174 | 34.32° | it would move a point 1.25 (the most is 0.75) |
| four-style set: send | sharp-two-tone | 15.2567, 22.5638 to 9.6495, 14.3505 | 55.68° | it would move a point 1.47 (the most is 0.75) |
| four-style set: send | sharp-two-tone | 9.6495, 14.3505 to 1.4362, 8.7433 | 34.32° | it would move a point 1.64 (the most is 0.75) |
| four-style set: send | sharp-two-tone | 16.0826, 22 to 10.369, 13.631 | 55.68° | it would move a point 0.94 (the most is 0.75) |
| four-style set: send | sharp-two-tone | 10.369, 13.631 to 2, 7.9174 | 34.32° | it would move a point 1.25 (the most is 0.75) |
| four-style set: send | sharp-duotone | 15.2567, 22.5638 to 9.6495, 14.3505 | 55.68° | it would move a point 1.47 (the most is 0.75) |
| four-style set: send | sharp-duotone | 9.6495, 14.3505 to 1.4362, 8.7433 | 34.32° | it would move a point 1.64 (the most is 0.75) |
| four-style set: send | sharp-duotone | 15.2567, 22.5638 to 9.6495, 14.3505 | 55.68° | it would move a point 1.47 (the most is 0.75) |
| four-style set: send | sharp-solid | 15.2567, 22.5638 to 9.6495, 14.3505 | 55.68° | it would move a point 1.50 (the most is 0.75) |
| four-style set: send | sharp-solid | 9.6495, 14.3505 to 1.4362, 8.7433 | 34.32° | it would move a point 1.64 (the most is 0.75) |
| four-style set: send | sharp-solid | 16.1845, 7.8155 to 8.3888, 13.4899 | 143.95° | it would move a point 1.50 (the most is 0.75) |
| four-style set: send | sharp-solid | 8.3888, 13.4899 to 9.6495, 14.3505 | 34.32° | the lines around it hold it off its diagonal |
| four-style set: send | sharp-solid | 9.6495, 14.3505 to 10.5101, 15.6112 | 55.68° | the lines around it hold it off its diagonal |
| four-style set: send | sharp-solid | 10.5101, 15.6112 to 16.1845, 7.8155 | 126.05° | it would turn a line it was not snapping by 10.0° |
| four-style set: send-fast | rounded-solid | 14.8815, 18.08 to 12.1063, 14.0151 | 55.68° | it would move a point 1.67 (the most is 0.75) |
| four-style set: send-fast | rounded-solid | 12.1063, 14.0151 to 16.9826, 7.0174 | 124.87° | it would move a point 0.75 (the most is 0.75) |
| four-style set: send-fast | rounded-solid | 16.9826, 7.0174 to 9.9849, 11.8937 | 145.13° | it would move a point 1.50 (the most is 0.75) |
| four-style set: send-fast | rounded-solid | 9.9849, 11.8937 to 5.92, 9.1185 | 34.32° | it would move a point 1.67 (the most is 0.75) |
| four-style set: send-fast | sharp-outline | 17.2802, 17.9523 to 12.193425, 11.806575 | 50.39° | it would move a point 1.00 (the most is 0.75) |
| four-style set: send-fast | sharp-two-tone | 16.4543, 18.5162 to 12.0034, 11.9966 | 55.68° | it would move a point 1.30 (the most is 0.75) |
| four-style set: send-fast | sharp-two-tone | 12.0034, 11.9966 to 5.4838, 7.5457 | 34.32° | it would move a point 1.17 (the most is 0.75) |
| four-style set: send-fast | sharp-two-tone | 17.2802, 17.9523 to 12.193425, 11.806575 | 50.39° | it would move a point 1.00 (the most is 0.75) |
| four-style set: send-fast | sharp-duotone | 16.4543, 18.5162 to 12.0034, 11.9966 | 55.68° | it would move a point 1.30 (the most is 0.75) |
| four-style set: send-fast | sharp-duotone | 12.0034, 11.9966 to 5.4838, 7.5457 | 34.32° | it would move a point 1.17 (the most is 0.75) |
| four-style set: send-fast | sharp-duotone | 16.4543, 18.5162 to 12.0034, 11.9966 | 55.68° | it would move a point 1.30 (the most is 0.75) |
| four-style set: send-fast | sharp-solid | 16.4543, 18.5162 to 12.864, 13.2573 | 55.68° | it would move a point 0.94 (the most is 0.75) |
| four-style set: send-fast | sharp-solid | 12.864, 13.2573 to 17.3615, 6.6385 | 124.2° | it would move a point 1.77 (the most is 0.75) |
| four-style set: send-fast | sharp-solid | 17.3615, 6.6385 to 10.7427, 11.136 | 145.8° | it would move a point 1.21 (the most is 0.75) |
| four-style set: send-fast | sharp-solid | 10.7427, 11.136 to 5.4838, 7.5457 | 34.32° | it would move a point 0.94 (the most is 0.75) |
| four-style set: send-sparkles | rounded-outline | 2.4363, 9.4902 to 9.1441, 14.0697 | 34.32° | it would move a point 0.75 (the most is 0.75) |
| four-style set: send-sparkles | rounded-outline | 9.9303, 14.8559 to 10.7374, 16.0381 | 55.68° | it would move a point 0.75 (the most is 0.75) |
| four-style set: send-sparkles | rounded-two-tone | 2.4363, 9.4902 to 9.1441, 14.0697 | 34.32° | it would move a point 0.75 (the most is 0.75) |
| four-style set: send-sparkles | rounded-two-tone | 9.9303, 14.8559 to 10.7374, 16.0381 | 55.68° | it would move a point 0.75 (the most is 0.75) |
| four-style set: send-sparkles | rounded-duotone | 2.4363, 9.4902 to 9.1441, 14.0697 | 34.32° | it would move a point 0.75 (the most is 0.75) |
| four-style set: send-sparkles | rounded-duotone | 9.9303, 14.8559 to 10.7374, 16.0381 | 55.68° | it would move a point 0.75 (the most is 0.75) |
| four-style set: send-sparkles | rounded-solid | 2.4363, 9.4902 to 9.1441, 14.0697 | 34.32° | it would move a point 0.75 (the most is 0.75) |
| four-style set: send-sparkles | rounded-solid | 9.9303, 14.8559 to 10.7374, 16.0381 | 55.68° | it would move a point 0.75 (the most is 0.75) |
| four-style set: send-sparkles | sharp-outline | 11.6014, 15.4362 to 10.369, 13.631 | 55.68° | it would move a point 1.12 (the most is 0.75) |
| four-style set: send-sparkles | sharp-outline | 10.369, 13.631 to 2, 7.9174 | 34.32° | it would move a point 0.94 (the most is 0.75) |
| four-style set: send-sparkles | sharp-two-tone | 11.6014, 15.4362 to 10.369, 13.631 | 55.68° | it would move a point 1.12 (the most is 0.75) |
| four-style set: send-sparkles | sharp-two-tone | 10.369, 13.631 to 2, 7.9174 | 34.32° | it would move a point 0.94 (the most is 0.75) |
| four-style set: send-sparkles | sharp-duotone | 11.6014, 15.4362 to 10.369, 13.631 | 55.68° | it would move a point 1.12 (the most is 0.75) |
| four-style set: send-sparkles | sharp-duotone | 10.369, 13.631 to 2, 7.9174 | 34.32° | it would move a point 0.94 (the most is 0.75) |
| four-style set: send-sparkles | sharp-solid | 11.6014, 15.4362 to 10.369, 13.631 | 55.68° | it would move a point 1.12 (the most is 0.75) |
| four-style set: send-sparkles | sharp-solid | 10.369, 13.631 to 2, 7.9174 | 34.32° | it would move a point 0.94 (the most is 0.75) |
| four-style set: shapes-2 | sharp-outline | 12.0009, 3 to 16.7343, 9.998 | 55.93° | it would move a point 1.13 (the most is 0.75) |
| four-style set: shapes-2 | sharp-outline | 7.2674, 9.998 to 12.0009, 3 | 124.07° | it would move a point 0.91 (the most is 0.75) |
| four-style set: shapes-2 | sharp-two-tone | 12.8292, 2.4397 to 17.5626, 9.4377 | 55.93° | it would move a point 1.13 (the most is 0.75) |
| four-style set: shapes-2 | sharp-two-tone | 6.4391, 9.4377 to 11.1726, 2.4397 | 124.07° | it would move a point 0.91 (the most is 0.75) |
| four-style set: shapes-2 | sharp-two-tone | 12.0009, 3 to 16.7343, 9.998 | 55.93° | it would move a point 1.13 (the most is 0.75) |
| four-style set: shapes-2 | sharp-two-tone | 7.2674, 9.998 to 12.0009, 3 | 124.07° | it would move a point 0.91 (the most is 0.75) |
| four-style set: shapes-2 | sharp-duotone | 12.8292, 2.4397 to 17.5626, 9.4377 | 55.93° | it would move a point 0.80 (the most is 0.75) |
| four-style set: shapes-2 | sharp-duotone | 6.4391, 9.4377 to 11.1726, 2.4397 | 124.07° | it would move a point 0.80 (the most is 0.75) |
| four-style set: shapes-2 | sharp-solid | 12.8292, 2.4397 to 17.5626, 9.4377 | 55.93° | it would move a point 0.80 (the most is 0.75) |
| four-style set: shapes-2 | sharp-solid | 6.4391, 9.4377 to 11.1726, 2.4397 | 124.07° | it would move a point 0.80 (the most is 0.75) |
| four-style set: share-2 | sharp-outline | 12.5, 18.9999 to 20.9999, 12 | 140.53° | it would move a point 0.94 (the most is 0.75) |
| four-style set: share-2 | sharp-outline | 20.9999, 12 to 12.5, 5.0001 | 39.47° | it would push the icon out past its own box |
| four-style set: share-2 | sharp-two-tone | 13.1357, 19.7718 to 21.6356, 12.7719 | 140.53° | it would move a point 0.94 (the most is 0.75) |
| four-style set: share-2 | sharp-two-tone | 21.6356, 11.2281 to 13.1357, 4.2282 | 39.47° | it would move a point 0.94 (the most is 0.75) |
| four-style set: share-2 | sharp-two-tone | 12.5, 18.9999 to 20.53115, 12.46875 | 140.88° | it would move a point 0.94 (the most is 0.75) |
| four-style set: share-2 | sharp-duotone | 12.5, 18.9999 to 20.9999, 12 | 140.53° | it would move a point 0.94 (the most is 0.75) |
| four-style set: share-2 | sharp-duotone | 20.9999, 12 to 12.5, 5.0001 | 39.47° | it would push the icon out past its own box |
| four-style set: skip-back | sharp-outline | 19, 19 to 8.5108, 12 | 33.72° | it would move a point 1.74 (the most is 0.75) |
| four-style set: skip-back | sharp-outline | 8.5108, 12 to 19, 5 | 146.28° | it would move a point 1.41 (the most is 0.75) |
| four-style set: skip-back | sharp-two-tone | 18.4449, 19.8318 to 7.9557, 12.8318 | 33.72° | it would move a point 1.74 (the most is 0.75) |
| four-style set: skip-back | sharp-two-tone | 7.9557, 11.1682 to 18.4449, 4.1682 | 146.28° | it would move a point 1.74 (the most is 0.75) |
| four-style set: skip-back | sharp-two-tone | 19, 19 to 8.5108, 12 | 33.72° | it would move a point 1.74 (the most is 0.75) |
| four-style set: skip-back | sharp-two-tone | 8.5108, 12 to 19, 5 | 146.28° | it would move a point 1.41 (the most is 0.75) |
| four-style set: skip-back | sharp-duotone | 18.4449, 19.8318 to 7.9557, 12.8318 | 33.72° | it would move a point 1.23 (the most is 0.75) |
| four-style set: skip-back | sharp-duotone | 7.9557, 11.1682 to 18.4449, 4.1682 | 146.28° | it would move a point 1.23 (the most is 0.75) |
| four-style set: skip-back | sharp-solid | 18.4449, 19.8318 to 7.9557, 12.8318 | 33.72° | it would move a point 1.23 (the most is 0.75) |
| four-style set: skip-back | sharp-solid | 7.9557, 11.1682 to 18.4449, 4.1682 | 146.28° | it would move a point 1.23 (the most is 0.75) |
| four-style set: skip-forward | sharp-outline | 5, 5 to 15.4892, 12 | 33.72° | it would move a point 1.74 (the most is 0.75) |
| four-style set: skip-forward | sharp-outline | 15.4892, 12 to 5, 19 | 146.28° | it would move a point 1.41 (the most is 0.75) |
| four-style set: skip-forward | sharp-two-tone | 5.5551, 4.1682 to 16.0443, 11.1682 | 33.72° | it would move a point 1.74 (the most is 0.75) |
| four-style set: skip-forward | sharp-two-tone | 16.0443, 12.8318 to 5.5551, 19.8318 | 146.28° | it would move a point 1.74 (the most is 0.75) |
| four-style set: skip-forward | sharp-two-tone | 5, 5 to 15.4892, 12 | 33.72° | it would move a point 1.74 (the most is 0.75) |
| four-style set: skip-forward | sharp-two-tone | 15.4892, 12 to 5, 19 | 146.28° | it would move a point 1.41 (the most is 0.75) |
| four-style set: skip-forward | sharp-duotone | 5.5551, 4.1682 to 16.0443, 11.1682 | 33.72° | it would move a point 1.23 (the most is 0.75) |
| four-style set: skip-forward | sharp-duotone | 16.0443, 12.8318 to 5.5551, 19.8318 | 146.28° | it would move a point 1.23 (the most is 0.75) |
| four-style set: skip-forward | sharp-solid | 5.5551, 4.1682 to 16.0443, 11.1682 | 33.72° | it would move a point 1.23 (the most is 0.75) |
| four-style set: skip-forward | sharp-solid | 16.0443, 12.8318 to 5.5551, 19.8318 | 146.28° | it would move a point 1.23 (the most is 0.75) |
| four-style set: square-terminal-asterisk | sharp-outline | 6.5547, 12.2968 to 13.4453, 7.7032 | 146.31° | it would move a point 0.81 (the most is 0.75) |
| four-style set: square-terminal-asterisk | sharp-outline | 6.5547, 7.7032 to 13.4453, 12.2968 | 33.69° | it would move a point 0.81 (the most is 0.75) |
| four-style set: square-terminal-asterisk | sharp-two-tone | 6.5547, 12.2968 to 13.4453, 7.7032 | 146.31° | it would move a point 0.81 (the most is 0.75) |
| four-style set: square-terminal-asterisk | sharp-two-tone | 6.5547, 7.7032 to 13.4453, 12.2968 | 33.69° | it would move a point 0.81 (the most is 0.75) |
| four-style set: square-terminal-asterisk | sharp-duotone | 6.5547, 12.2968 to 13.4453, 7.7032 | 146.31° | it would move a point 0.81 (the most is 0.75) |
| four-style set: square-terminal-asterisk | sharp-duotone | 6.5547, 7.7032 to 13.4453, 12.2968 | 33.69° | it would move a point 0.81 (the most is 0.75) |
| four-style set: swatch-book | rounded-outline | 10.0642, 19.5712 to 17.7776, 10.3786 | 130° | it would move a point 0.84 (the most is 0.75) |
| four-style set: swatch-book | rounded-two-tone | 10.0642, 19.5712 to 17.7776, 10.3786 | 130° | it would move a point 0.84 (the most is 0.75) |
| four-style set: swatch-book | rounded-duotone | 10.0642, 19.5712 to 17.7776, 10.3786 | 130° | it would move a point 0.84 (the most is 0.75) |
| four-style set: swatch-book | rounded-solid | 10.0642, 19.5712 to 17.7776, 10.3786 | 130° | it would move a point 0.84 (the most is 0.75) |
| four-style set: tag-horizontal-end | sharp-outline | 14.8284, 4 to 22.236686, 12.236686 | 48.03° | it would push the icon out past its own box |
| four-style set: tag-horizontal-end-percent | sharp-outline | 14.8284, 4 to 22.236686, 12.236686 | 48.03° | it would push the icon out past its own box |
| four-style set: tag-horizontal-start | sharp-outline | 9.1716, 4 to 1.763314, 12.236686 | 131.97° | it would push the icon out past its own box |
| four-style set: tag-horizontal-start-percent | sharp-outline | 9.1716, 4 to 1.763314, 12.236686 | 131.97° | it would push the icon out past its own box |
| four-style set: tag-horizontal-start-sparkles | sharp-outline | 9.1716, 4 to 1.763314, 12.236686 | 131.97° | it would push the icon out past its own box |
| four-style set: tag-horizontal-start-sparkles | sharp-two-tone | 9.1716, 4 to 1.763314, 12.236686 | 131.97° | it would push the icon out past its own box |
| four-style set: tag-horizontal-start-sparkles | sharp-duotone | 9.1716, 4 to 1.763314, 12.236686 | 131.97° | it would push the icon out past its own box |
| four-style set: tag-horizontal-start-sparkles | sharp-solid | 9.1716, 4 to 1.763314, 12.236686 | 131.97° | it would push the icon out past its own box |
| four-style set: terminal | rounded-outline | 4, 5 to 10.5571, 10.6204 | 40.6° | it would push the icon out past its own box |
| four-style set: terminal | rounded-two-tone | 4, 5 to 10.5571, 10.6204 | 40.6° | it would push the icon out past its own box |
| four-style set: terminal | rounded-duotone | 4, 5 to 10.5571, 10.6204 | 40.6° | it would push the icon out past its own box |
| four-style set: terminal | rounded-solid | 4, 5 to 10.5571, 10.6204 | 40.6° | it would push the icon out past its own box |
| four-style set: terminal | sharp-outline | 3.7191, 4.7593 to 10.7376, 10.7375 | 40.42° | it would push the icon out past its own box |
| four-style set: terminal | sharp-two-tone | 3.7191, 4.7593 to 10.7376, 10.7375 | 40.42° | it would push the icon out past its own box |
| four-style set: terminal | sharp-duotone | 3.7191, 4.7593 to 10.7376, 10.7375 | 40.42° | it would push the icon out past its own box |
| four-style set: terminal | sharp-solid | 3.7191, 4.7593 to 10.7376, 10.7375 | 40.42° | it would push the icon out past its own box |
| four-style set: terminal-asterisk | sharp-outline | 3.6, 13.3 to 12.4, 6.7 | 143.13° | it would move a point 0.78 (the most is 0.75) |
| four-style set: terminal-asterisk | sharp-outline | 3.6, 6.7 to 12.4, 13.3 | 36.87° | it would move a point 0.78 (the most is 0.75) |
| four-style set: terminal-asterisk | sharp-two-tone | 3.6, 13.3 to 12.4, 6.7 | 143.13° | it would move a point 0.78 (the most is 0.75) |
| four-style set: terminal-asterisk | sharp-two-tone | 3.6, 6.7 to 12.4, 13.3 | 36.87° | it would move a point 0.78 (the most is 0.75) |
| four-style set: terminal-asterisk | sharp-duotone | 3.6, 13.3 to 12.4, 6.7 | 143.13° | it would move a point 0.78 (the most is 0.75) |
| four-style set: terminal-asterisk | sharp-duotone | 3.6, 6.7 to 12.4, 13.3 | 36.87° | it would move a point 0.78 (the most is 0.75) |
| four-style set: terminal-asterisk | sharp-solid | 3.6, 13.3 to 12.4, 6.7 | 143.13° | it would move a point 0.78 (the most is 0.75) |
| four-style set: terminal-asterisk | sharp-solid | 3.6, 6.7 to 12.4, 13.3 | 36.87° | it would move a point 0.78 (the most is 0.75) |
| four-style set: terminal-plus | rounded-outline | 2, 5 to 8.5571, 10.6204 | 40.6° | it would push the icon out past its own box |
| four-style set: terminal-plus | rounded-two-tone | 2, 5 to 8.5571, 10.6204 | 40.6° | it would push the icon out past its own box |
| four-style set: terminal-plus | rounded-duotone | 2, 5 to 8.5571, 10.6204 | 40.6° | it would push the icon out past its own box |
| four-style set: terminal-plus | rounded-solid | 2, 5 to 8.5571, 10.6204 | 40.6° | it would push the icon out past its own box |
| four-style set: test-tube-diagonal | rounded-outline | 14.9719, 3.0913 to 18.324, 5.2739 | 33.07° | it would move a point 1.72 (the most is 0.75) |
| four-style set: test-tube-diagonal | rounded-outline | 18.6163, 6.6576 to 9.514, 20.6369 | 123.07° | it would move a point 1.72 (the most is 0.75) |
| four-style set: test-tube-diagonal | rounded-outline | 4.486, 17.3631 to 13.5883, 3.3837 | 123.07° | it would move a point 1.72 (the most is 0.75) |
| four-style set: test-tube-diagonal | rounded-outline | 13.2959, 2 to 20, 6.3652 | 33.07° | it would move a point 1.72 (the most is 0.75) |
| four-style set: test-tube-diagonal | rounded-two-tone | 19.4544, 7.2032 to 10.3521, 21.1826 | 123.07° | it would move a point 1.72 (the most is 0.75) |
| four-style set: test-tube-diagonal | rounded-two-tone | 3.6479, 16.8174 to 12.7502, 2.838 | 123.07° | it would move a point 1.72 (the most is 0.75) |
| four-style set: test-tube-diagonal | rounded-two-tone | 14.9719, 3.0913 to 18.324, 5.2739 | 33.07° | it would move a point 1.72 (the most is 0.75) |
| four-style set: test-tube-diagonal | rounded-two-tone | 18.6163, 6.6576 to 9.514, 20.6369 | 123.07° | it would move a point 1.72 (the most is 0.75) |
| four-style set: test-tube-diagonal | rounded-two-tone | 4.486, 17.3631 to 13.5883, 3.3837 | 123.07° | it would move a point 1.72 (the most is 0.75) |
| four-style set: test-tube-diagonal | rounded-two-tone | 13.2959, 2 to 20, 6.3652 | 33.07° | it would move a point 1.72 (the most is 0.75) |
| four-style set: test-tube-diagonal | rounded-duotone | 15.5176, 2.2533 to 18.8696, 4.4359 | 33.07° | it would move a point 0.94 (the most is 0.75) |
| four-style set: test-tube-diagonal | rounded-duotone | 19.4544, 7.2032 to 10.3521, 21.1826 | 123.07° | it would move a point 1.80 (the most is 0.75) |
| four-style set: test-tube-diagonal | rounded-duotone | 3.6479, 16.8174 to 12.7502, 2.838 | 123.07° | it would move a point 1.80 (the most is 0.75) |
| four-style set: test-tube-diagonal | rounded-duotone | 16.331, 12 to 10.3521, 21.1826 | 123.07° | it would move a point 1.83 (the most is 0.75) |
| four-style set: test-tube-diagonal | rounded-duotone | 3.6479, 16.8174 to 6.7847, 12 | 123.07° | it would move a point 0.94 (the most is 0.75) |
| four-style set: test-tube-diagonal | rounded-duotone | 13.2959, 2 to 20, 6.3652 | 33.07° | it would move a point 0.94 (the most is 0.75) |
| four-style set: test-tube-diagonal | rounded-solid | 19.4544, 7.2032 to 10.3521, 21.1826 | 123.07° | it would move a point 1.72 (the most is 0.75) |
| four-style set: test-tube-diagonal | rounded-solid | 3.6479, 16.8174 to 12.7502, 2.838 | 123.07° | it would move a point 1.72 (the most is 0.75) |
| four-style set: test-tube-diagonal | rounded-solid | 14.71865, 3.63695 to 9.1713, 12 | 123.56° | it would move a point 1.72 (the most is 0.75) |
| four-style set: test-tube-diagonal | rounded-solid | 13.2959, 2 to 20, 6.3652 | 33.07° | it would move a point 0.83 (the most is 0.75) |
| four-style set: test-tube-diagonal | sharp-outline | 14.1339, 2.5456 to 19.162, 5.8195 | 33.07° | it would move a point 2.99 (the most is 0.75) |
| four-style set: test-tube-diagonal | sharp-outline | 19.162, 5.8195 to 9.514, 20.6369 | 123.07° | it would move a point 2.92 (the most is 0.75) |
| four-style set: test-tube-diagonal | sharp-outline | 4.486, 17.3631 to 14.1339, 2.5456 | 123.07° | it would move a point 2.99 (the most is 0.75) |
| four-style set: test-tube-diagonal | sharp-outline | 13.0471, 1.838 to 20.4544, 6.661 | 33.07° | it would move a point 2.99 (the most is 0.75) |
| four-style set: test-tube-diagonal | sharp-two-tone | 14.6796, 1.7076 to 19.7076, 4.9815 | 33.07° | it would push the icon out past its own box |
| four-style set: test-tube-diagonal | sharp-two-tone | 20, 6.3652 to 10.3521, 21.1826 | 123.07° | it would move a point 2.99 (the most is 0.75) |
| four-style set: test-tube-diagonal | sharp-two-tone | 3.6479, 16.8174 to 13.2959, 2 | 123.07° | it would move a point 2.92 (the most is 0.75) |
| four-style set: test-tube-diagonal | sharp-two-tone | 14.1339, 2.5456 to 19.162, 5.8195 | 33.07° | it would move a point 2.99 (the most is 0.75) |
| four-style set: test-tube-diagonal | sharp-two-tone | 19.162, 5.8195 to 9.514, 20.6369 | 123.07° | it would move a point 2.92 (the most is 0.75) |
| four-style set: test-tube-diagonal | sharp-two-tone | 4.486, 17.3631 to 14.1339, 2.5456 | 123.07° | it would move a point 2.99 (the most is 0.75) |
| four-style set: test-tube-diagonal | sharp-two-tone | 13.0471, 1.838 to 20.4544, 6.661 | 33.07° | it would move a point 2.99 (the most is 0.75) |
| four-style set: test-tube-diagonal | sharp-duotone | 14.6796, 1.7076 to 19.7076, 4.9815 | 33.07° | it would move a point 0.94 (the most is 0.75) |
| four-style set: test-tube-diagonal | sharp-duotone | 20, 6.3652 to 10.3521, 21.1826 | 123.07° | it would move a point 1.92 (the most is 0.75) |
| four-style set: test-tube-diagonal | sharp-duotone | 3.6479, 16.8174 to 13.2959, 2 | 123.07° | it would move a point 1.92 (the most is 0.75) |
| four-style set: test-tube-diagonal | sharp-duotone | 16.331, 12 to 10.3521, 21.1826 | 123.07° | it would move a point 1.95 (the most is 0.75) |
| four-style set: test-tube-diagonal | sharp-duotone | 3.6479, 16.8174 to 6.7847, 12 | 123.07° | it would move a point 0.94 (the most is 0.75) |
| four-style set: test-tube-diagonal | sharp-duotone | 13.0471, 1.838 to 20.4544, 6.661 | 33.07° | it would move a point 1.92 (the most is 0.75) |
| four-style set: test-tube-diagonal | sharp-solid | 14.6796, 1.7076 to 19.7076, 4.9815 | 33.07° | it would push the icon out past its own box |
| four-style set: test-tube-diagonal | sharp-solid | 20, 6.3652 to 10.3521, 21.1826 | 123.07° | it would move a point 1.83 (the most is 0.75) |
| four-style set: test-tube-diagonal | sharp-solid | 3.6479, 16.8174 to 13.2959, 2 | 123.07° | it would move a point 1.83 (the most is 0.75) |
| four-style set: test-tube-diagonal | sharp-solid | 14.4263, 3.9293 to 9.1713, 12 | 123.07° | it would move a point 1.83 (the most is 0.75) |
| four-style set: test-tube-diagonal | sharp-solid | 13.9445, 12 to 17.7783, 6.1119 | 123.07° | it would move a point 1.83 (the most is 0.75) |
| four-style set: test-tube-diagonal | sharp-solid | 17.7783, 6.1119 to 14.4263, 3.9293 | 33.07° | it would push the icon out past its own box |
| four-style set: test-tube-diagonal | sharp-solid | 13.0471, 1.838 to 20.4544, 6.661 | 33.07° | it would move a point 1.83 (the most is 0.75) |
| four-style set: volume | rounded-two-tone | 5.4777, 8 to 8.3585, 3.8612 | 124.84° | it would move a point 0.75 (the most is 0.75) |
| four-style set: volume | rounded-two-tone | 8.3585, 20.1388 to 5.4777, 16 | 55.16° | it would move a point 0.75 (the most is 0.75) |
| four-style set: volume | rounded-duotone | 5.4777, 8 to 8.3585, 3.8612 | 124.84° | it would move a point 0.75 (the most is 0.75) |
| four-style set: volume | rounded-duotone | 8.3585, 20.1388 to 5.4777, 16 | 55.16° | it would move a point 0.75 (the most is 0.75) |
| four-style set: volume | rounded-solid | 5.4777, 8 to 8.3585, 3.8612 | 124.84° | it would move a point 0.75 (the most is 0.75) |
| four-style set: volume | rounded-solid | 8.3585, 20.1388 to 5.4777, 16 | 55.16° | it would move a point 0.75 (the most is 0.75) |
| four-style set: volume-low | rounded-two-tone | 5.4777, 8 to 8.3585, 3.8612 | 124.84° | it would move a point 0.75 (the most is 0.75) |
| four-style set: volume-low | rounded-two-tone | 8.3585, 20.1388 to 5.4777, 16 | 55.16° | it would move a point 0.75 (the most is 0.75) |
| four-style set: volume-low | rounded-duotone | 5.4777, 8 to 8.3585, 3.8612 | 124.84° | it would move a point 0.75 (the most is 0.75) |
| four-style set: volume-low | rounded-duotone | 8.3585, 20.1388 to 5.4777, 16 | 55.16° | it would move a point 0.75 (the most is 0.75) |
| four-style set: volume-low | rounded-solid | 5.4777, 8 to 8.3585, 3.8612 | 124.84° | it would move a point 0.75 (the most is 0.75) |
| four-style set: volume-low | rounded-solid | 8.3585, 20.1388 to 5.4777, 16 | 55.16° | it would move a point 0.75 (the most is 0.75) |
| four-style set: volume-minus | rounded-two-tone | 5.4777, 8 to 8.3585, 3.8612 | 124.84° | it would move a point 0.75 (the most is 0.75) |
| four-style set: volume-minus | rounded-two-tone | 8.3585, 20.1388 to 5.4777, 16 | 55.16° | it would move a point 0.75 (the most is 0.75) |
| four-style set: volume-minus | rounded-duotone | 5.4777, 8 to 8.3585, 3.8612 | 124.84° | it would move a point 0.75 (the most is 0.75) |
| four-style set: volume-minus | rounded-duotone | 8.3585, 20.1388 to 5.4777, 16 | 55.16° | it would move a point 0.75 (the most is 0.75) |
| four-style set: volume-minus | rounded-solid | 5.4777, 8 to 8.3585, 3.8612 | 124.84° | it would move a point 0.75 (the most is 0.75) |
| four-style set: volume-minus | rounded-solid | 8.3585, 20.1388 to 5.4777, 16 | 55.16° | it would move a point 0.75 (the most is 0.75) |
| four-style set: volume-off | rounded-two-tone | 8.3585, 20.1388 to 5.4777, 16 | 55.16° | it would move a point 0.75 (the most is 0.75) |
| four-style set: volume-off | rounded-two-tone | 5.4777, 8 to 6.5128, 6.5128 | 124.84° | it would move a point 0.75 (the most is 0.75) |
| four-style set: volume-off | rounded-duotone | 8.3585, 20.1388 to 5.4777, 16 | 55.16° | it would move a point 0.75 (the most is 0.75) |
| four-style set: volume-off | rounded-duotone | 5.4777, 8 to 6.5128, 6.5128 | 124.84° | it would move a point 0.75 (the most is 0.75) |
| four-style set: volume-off | rounded-solid | 8.3585, 20.1388 to 5.4777, 16 | 55.16° | it would move a point 0.75 (the most is 0.75) |
| four-style set: volume-off | rounded-solid | 5.4777, 8 to 6.5128, 6.5128 | 124.84° | it would move a point 0.75 (the most is 0.75) |
| four-style set: volume-plus | rounded-two-tone | 5.4777, 8 to 8.3585, 3.8612 | 124.84° | it would move a point 0.75 (the most is 0.75) |
| four-style set: volume-plus | rounded-two-tone | 8.3585, 20.1388 to 5.4777, 16 | 55.16° | it would move a point 0.75 (the most is 0.75) |
| four-style set: volume-plus | rounded-duotone | 5.4777, 8 to 8.3585, 3.8612 | 124.84° | it would move a point 0.75 (the most is 0.75) |
| four-style set: volume-plus | rounded-duotone | 8.3585, 20.1388 to 5.4777, 16 | 55.16° | it would move a point 0.75 (the most is 0.75) |
| four-style set: volume-plus | rounded-solid | 5.4777, 8 to 8.3585, 3.8612 | 124.84° | it would move a point 0.75 (the most is 0.75) |
| four-style set: volume-plus | rounded-solid | 8.3585, 20.1388 to 5.4777, 16 | 55.16° | it would move a point 0.75 (the most is 0.75) |
| four-style set: volume-x | rounded-two-tone | 5.4777, 8 to 8.3585, 3.8612 | 124.84° | it would move a point 0.75 (the most is 0.75) |
| four-style set: volume-x | rounded-two-tone | 8.3585, 20.1388 to 5.4777, 16 | 55.16° | it would move a point 0.75 (the most is 0.75) |
| four-style set: volume-x | rounded-duotone | 5.4777, 8 to 8.3585, 3.8612 | 124.84° | it would move a point 0.75 (the most is 0.75) |
| four-style set: volume-x | rounded-duotone | 8.3585, 20.1388 to 5.4777, 16 | 55.16° | it would move a point 0.75 (the most is 0.75) |
| four-style set: volume-x | rounded-solid | 5.4777, 8 to 8.3585, 3.8612 | 124.84° | it would move a point 0.75 (the most is 0.75) |
| four-style set: volume-x | rounded-solid | 8.3585, 20.1388 to 5.4777, 16 | 55.16° | it would move a point 0.75 (the most is 0.75) |

## Changed

| Icon | Drawings (lines snapped, furthest a point moved) |
| --- | --- |
| app glyph: back | line (2, 0.11) |
| app glyph: check | line (1, 0.071) |
| app glyph: del | line (4, 0.177) |
| app glyph: home-filled | line (4, 0.491); solid (2, 0.477) |
| app glyph: key | solid (1, 0.177) |
| app glyph: receipt | line (3, 0.227) |
| app glyph: receive-filled | line (3, 0.011); solid (2, 0.007) |
| app glyph: settings-filled | line (8, 0.168); solid (3, 0.22) |
| app glyph: shield | solid (2, 0.079) |
| app glyph: star | line (2, 0.035); solid (2, 0.068) |
| app glyph: step-done | line (1, 0.187); solid (1, 0.187) |
| app glyph: tv | line (2, 0.3) |
| core set: accessibility | line (1, 0.403) |
| core set: airplay | line (2, 0.5) |
| core set: alarm-clock | line (2, 0.028) |
| core set: alarm-clock-check | line (2, 0.028) |
| core set: alarm-clock-minus | line (2, 0.028) |
| core set: alarm-clock-off | line (1, 0.025) |
| core set: alarm-clock-plus | line (2, 0.028) |
| core set: award | line (2, 0.318) |
| core set: bike | line (2, 0.537) |
| core set: bomb | line (3, 0.008) |
| core set: book-bookmark | line (2, 0.156) |
| core set: book-heart | line (2, 0.081) |
| core set: book-image | line (2, 0.015) |
| core set: book-search | line (1, 0) |
| core set: bottle-wine | line (2, 0.071) |
| core set: bow-arrow | line (2, 0.004) |
| core set: cake-slice | line (2, 0.559) |
| core set: calendar-heart | line (2, 0.081) |
| core set: calendar-sync | line (2, 0.045) |
| core set: can-soda | line (4, 0.528) |
| core set: candy-off | line (2, 0.006) |
| core set: carton | line (3, 0.144) |
| core set: carton-off | line (3, 0.108) |
| core set: cctv | line (1, 0.534) |
| core set: cctv-off | line (1, 0.005) |
| core set: chart-network | line (1, 0.315) |
| core set: chart-scatter | line (1, 0.354) |
| core set: chess-knight | line (1, 0.145) |
| core set: chess-queen | line (2, 0.49) |
| core set: church | line (1, 0.354) |
| core set: circle-star | line (2, 0.004) |
| core set: citrus | line (1, 0.004) |
| core set: clapperboard | line (2, 0.331) |
| core set: clipboard-pen-line | line (1, 0.004) |
| core set: cloud-sync | line (2, 0.045) |
| core set: crown | line (2, 0.216) |
| core set: delete | line (2, 0.209) |
| core set: diamond | line (2, 0.004) |
| core set: diamond-minus | line (2, 0.004) |
| core set: diamond-percent | line (2, 0.004) |
| core set: diamond-plus | line (2, 0.004) |
| core set: dices | line (1, 0.028) |
| core set: dumbbell | line (4, 0.004) |
| core set: eject | line (2, 0.145) |
| core set: engine | line (2, 0.106) |
| core set: eraser | line (3, 0.006) |
| core set: ev-charger | line (3, 0.471) |
| core set: eye-closed | line (2, 0.115) |
| core set: feather | line (1, 0.007) |
| core set: file | line (1, 0.004) |
| core set: file-axis-3d | line (1, 0.004) |
| core set: file-braces | line (1, 0.004) |
| core set: file-chart-column | line (1, 0.004) |
| core set: file-chart-column-increasing | line (1, 0.004) |
| core set: file-chart-line | line (1, 0.004) |
| core set: file-chart-pie | line (1, 0.004) |
| core set: file-check | line (1, 0.004) |
| core set: file-code | line (5, 0.25) |
| core set: file-cog | line (1, 0.004) |
| core set: file-diff | line (1, 0.004) |
| core set: file-down | line (1, 0.004) |
| core set: file-exclamation-point | line (1, 0.004) |
| core set: file-heart | line (2, 0.081) |
| core set: file-image | line (1, 0.004) |
| core set: file-minus | line (1, 0.004) |
| core set: file-pen | line (1, 0.004) |
| core set: file-pen-line | line (2, 0.006) |
| core set: file-play | line (1, 0.004) |
| core set: file-plus | line (1, 0.004) |
| core set: file-question-mark | line (1, 0.004) |
| core set: file-scan | line (1, 0.004) |
| core set: file-search | line (1, 0.004) |
| core set: file-signal | line (1, 0.004) |
| core set: file-sliders | line (1, 0.004) |
| core set: file-spreadsheet | line (1, 0.004) |
| core set: file-terminal | line (1, 0.004) |
| core set: file-text | line (1, 0.004) |
| core set: file-type | line (1, 0.004) |
| core set: file-up | line (1, 0.004) |
| core set: file-user | line (1, 0.004) |
| core set: file-volume | line (2, 0.092) |
| core set: file-x | line (1, 0.004) |
| core set: flashlight | line (2, 0.071) |
| core set: flashlight-off | line (2, 0.071) |
| core set: folder | line (1, 0.138) |
| core set: folder-archive | line (1, 0.138) |
| core set: folder-bookmark | line (3, 0.156) |
| core set: folder-check | line (1, 0.138) |
| core set: folder-clock | line (1, 0.138) |
| core set: folder-closed | line (1, 0.138) |
| core set: folder-code | line (5, 0.25) |
| core set: folder-dot | line (1, 0.134) |
| core set: folder-down | line (1, 0.138) |
| core set: folder-git | line (1, 0.138) |
| core set: folder-git-2 | line (1, 0.138) |
| core set: folder-heart | line (3, 0.138) |
| core set: folder-input | line (1, 0.138) |
| core set: folder-kanban | line (1, 0.134) |
| core set: folder-key | line (1, 0.138) |
| core set: folder-lock | line (1, 0.138) |
| core set: folder-minus | line (1, 0.138) |
| core set: folder-open | line (1, 0.138) |
| core set: folder-open-dot | line (1, 0.134) |
| core set: folder-output | line (1, 0.138) |
| core set: folder-pen | line (1, 0.141) |
| core set: folder-plus | line (1, 0.138) |
| core set: folder-root | line (1, 0.134) |
| core set: folder-search | line (1, 0.138) |
| core set: folder-search-2 | line (1, 0.138) |
| core set: folder-symlink | line (1, 0.138) |
| core set: folder-sync | line (3, 0.138) |
| core set: folder-tree | line (1, 0.106) |
| core set: folder-up | line (1, 0.138) |
| core set: folder-x | line (1, 0.138) |
| core set: folders | line (1, 0.071) |
| core set: fuel | line (1, 0.107) |
| core set: funnel | line (2, 0.272) |
| core set: funnel-plus | line (2, 0.272) |
| core set: funnel-x | line (1, 0.272) |
| core set: gem | line (2, 0.354) |
| core set: germ | line (1, 0.122) |
| core set: germ-off | line (1, 0.214) |
| core set: ghost | line (1, 0.004) |
| core set: ham | line (2, 0.006) |
| core set: hamburger | line (1, 0.682) |
| core set: hand-coins | line (4, 0.189) |
| core set: hand-heart | line (5, 0.204) |
| core set: hand-helping | line (4, 0.189) |
| core set: hand-platter | line (3, 0.251) |
| core set: heart | line (2, 0.085) |
| core set: heart-crack | line (2, 0.085) |
| core set: heart-handshake | line (3, 0.085) |
| core set: heart-minus | line (2, 0.085) |
| core set: heart-off | line (2, 0.085) |
| core set: heart-plus | line (2, 0.085) |
| core set: heart-pulse | line (2, 0.085) |
| core set: heart-x | line (1, 0.085) |
| core set: highlighter | line (2, 0.011) |
| core set: house | line (2, 0.354) |
| core set: house-cog | line (2, 0.354) |
| core set: house-heart | line (4, 0.354) |
| core set: house-plug | line (2, 0.354) |
| core set: house-plus | line (2, 0.354) |
| core set: house-wifi | line (2, 0.354) |
| core set: houses | line (4, 0.258) |
| core set: image-down | line (1, 0.007) |
| core set: image-up | line (1, 0.007) |
| core set: images | line (2, 0.005) |
| core set: inbox | line (2, 0.404) |
| core set: indian-rupee | line (1, 0.221) |
| core set: japanese-yen | line (2, 0.25) |
| core set: key | line (2, 0.004) |
| core set: lamp-desk | line (1, 0.006) |
| core set: lasso-select | line (1, 0.632) |
| core set: link | line (1, 0.006) |
| core set: mail-pen | line (1, 0.004) |
| core set: map-pin-house | line (2, 0.354) |
| core set: map-pin-pen | line (1, 0.004) |
| core set: medal | line (2, 0.191) |
| core set: message-circle-heart | line (2, 0.064) |
| core set: message-square-heart | line (2, 0.123) |
| core set: mic-vocal | line (1, 0.004) |
| core set: milk | line (2, 0.113) |
| core set: milk-off | line (1, 0.113) |
| core set: mouse-pointer-click | line (2, 0.035) |
| core set: nepali-rupee | line (1, 0.202) |
| core set: notebook-pen | line (1, 0.004) |
| core set: origami | line (4, 0.427) |
| core set: paintbrush | line (2, 0.004) |
| core set: paperclip | line (4, 0.113) |
| core set: pen | line (2, 0.004) |
| core set: pen-line | line (2, 0.004) |
| core set: pen-off | line (3, 0.013) |
| core set: pencil | line (2, 0.004) |
| core set: pencil-line | line (2, 0.004) |
| core set: pencil-off | line (3, 0.013) |
| core set: pencil-ruler | line (4, 0.004) |
| core set: pencil-sparkles | line (1, 0.004) |
| core set: pizza | line (1, 0.06) |
| core set: plane | line (4, 0.471) |
| core set: plane-takeoff | line (1, 0.361) |
| core set: playing-card | line (4, 0.364) |
| core set: playing-cards | line (4, 0.364) |
| core set: plug-zap | line (2, 0.004) |
| core set: pointer-off | line (1, 0.018) |
| core set: rat | line (1, 0.276) |
| core set: receipt-indian-rupee | line (1, 0.455) |
| core set: rectangle-goggles | line (2, 0.187) |
| core set: redo | line (1, 0.17) |
| core set: redo-dot | line (1, 0.17) |
| core set: ribbon | line (2, 0.457) |
| core set: ruler | line (2, 0.007) |
| core set: sailboat | line (1, 0.354) |
| core set: save-pen | line (1, 0.004) |
| core set: scan-heart | line (2, 0.064) |
| core set: search-code | line (4, 0.25) |
| core set: shield-ban | line (1, 0.678) |
| core set: shopping-bag | line (2, 0.237) |
| core set: smartphone-charging | line (2, 0.628) |
| core set: snowflake | line (4, 0.25) |
| core set: spade | line (2, 0.085) |
| core set: sport-shoe | line (2, 0.427) |
| core set: square-bookmark | line (2, 0.156) |
| core set: square-dashed-bottom-code | line (4, 0.25) |
| core set: square-pen | line (2, 0.004) |
| core set: square-star | line (1, 0.004) |
| core set: star | line (2, 0.039) |
| core set: star-check | line (2, 0.044) |
| core set: star-half | line (1, 0.039) |
| core set: star-minus | line (2, 0.039) |
| core set: star-off | line (2, 0.05) |
| core set: star-plus | line (2, 0.082) |
| core set: star-x | line (2, 0.039) |
| core set: stone | line (2, 0.707) |
| core set: sun-snow | line (2, 0.25) |
| core set: swatch-book | line (2, 0.039) |
| core set: thermometer-snowflake | line (2, 0.25) |
| core set: tickets-plane | line (1, 0.283) |
| core set: timer-reset | line (1, 0.189) |
| core set: tool-case | line (3, 0.264) |
| core set: toothbrush | line (1, 0.006) |
| core set: toothbrush-sparkles | line (2, 0.006) |
| core set: train-front | line (2, 0.354) |
| core set: train-front-tunnel | line (2, 0.354) |
| core set: tram-front | line (2, 0.354) |
| core set: tree-palm | line (1, 0.004) |
| core set: tree-pine | line (6, 0.267) |
| core set: trees | line (4, 0.222) |
| core set: truck | line (1, 0.308) |
| core set: truck-electric | line (3, 0.308) |
| core set: undo | line (1, 0.17) |
| core set: undo-dot | line (1, 0.17) |
| core set: unlink | line (2, 0.006) |
| core set: unplug | line (4, 0.004) |
| core set: usb | line (1, 0.021) |
| core set: user-pen | line (1, 0.004) |
| core set: user-round-pen | line (1, 0.004) |
| core set: user-star | line (1, 0.004) |
| core set: utensils-crossed | line (3, 0.035) |
| core set: van | line (1, 0.004) |
| core set: wallet-cards | line (2, 0.053) |
| core set: wallpaper | line (2, 0.011) |
| core set: wand-sparkles | line (2, 0.004) |
| core set: wheat | line (24, 0.008) |
| core set: wheat-off | line (8, 0.008) |
| core set: wifi-pen | line (1, 0.004) |
| core set: wifi-sync | line (2, 0.051) |
| core set: wrench-off | line (1, 0.005) |
| core set: zodiac-aquarius | line (8, 0.368) |
| four-style set: airplay | rounded-outline (2, 0.471); rounded-two-tone (4, 0.471); rounded-duotone (2, 0.471); rounded-solid (2, 0.471); sharp-duotone (2, 0.707); sharp-solid (2, 0.707) |
| four-style set: alarm-clock-check | rounded-outline (1, 0.022); rounded-two-tone (1, 0.022); rounded-duotone (1, 0.022); rounded-solid (2, 0.022); sharp-outline (1, 0.025); sharp-two-tone (1, 0.025); sharp-duotone (1, 0.025); sharp-solid (3, 0.043) |
| four-style set: app-window-terminal | rounded-outline (2, 0.247); rounded-two-tone (2, 0.247); rounded-duotone (2, 0.247); rounded-solid (4, 0.299); sharp-outline (2, 0.275); sharp-two-tone (2, 0.275); sharp-duotone (2, 0.275); sharp-solid (6, 0.32) |
| four-style set: arrow-down | rounded-outline (2, 0.065); rounded-two-tone (2, 0.065); rounded-duotone (2, 0.065); rounded-solid (2, 0.065); sharp-outline (2, 0.064); sharp-two-tone (2, 0.064); sharp-duotone (2, 0.064); sharp-solid (2, 0.064) |
| four-style set: arrow-down-dashed-panel | rounded-outline (2, 0.264); rounded-two-tone (2, 0.264); rounded-duotone (2, 0.264); rounded-solid (2, 0.264); sharp-outline (2, 0.263); sharp-two-tone (2, 0.137); sharp-duotone (2, 0.137); sharp-solid (2, 0.263) |
| four-style set: arrow-down-up-2 | rounded-outline (4, 0.046); rounded-two-tone (4, 0.046); rounded-duotone (4, 0.046); rounded-solid (4, 0.046); sharp-outline (4, 0.044); sharp-two-tone (4, 0.044); sharp-duotone (4, 0.044); sharp-solid (4, 0.044) |
| four-style set: arrow-in-down-dashed-panel | rounded-outline (2, 0.264); rounded-two-tone (2, 0.264); rounded-duotone (2, 0.264); rounded-solid (2, 0.264); sharp-outline (2, 0.263); sharp-two-tone (2, 0.137); sharp-duotone (2, 0.137); sharp-solid (2, 0.263) |
| four-style set: arrow-in-left-dashed-panel | rounded-outline (2, 0.264); rounded-two-tone (2, 0.264); rounded-duotone (2, 0.264); rounded-solid (2, 0.264); sharp-outline (2, 0.263); sharp-two-tone (2, 0.137); sharp-duotone (2, 0.137); sharp-solid (2, 0.263) |
| four-style set: arrow-in-right-dashed-panel | rounded-outline (2, 0.264); rounded-two-tone (2, 0.264); rounded-duotone (2, 0.264); rounded-solid (2, 0.264); sharp-outline (2, 0.263); sharp-two-tone (2, 0.137); sharp-duotone (2, 0.137); sharp-solid (2, 0.263) |
| four-style set: arrow-in-up-dashed-panel | rounded-outline (2, 0.264); rounded-two-tone (2, 0.264); rounded-duotone (2, 0.264); rounded-solid (2, 0.264); sharp-outline (2, 0.263); sharp-two-tone (2, 0.137); sharp-duotone (2, 0.137); sharp-solid (2, 0.263) |
| four-style set: arrow-left | rounded-outline (2, 0.065); rounded-two-tone (2, 0.065); rounded-duotone (2, 0.065); rounded-solid (2, 0.065); sharp-outline (2, 0.064); sharp-two-tone (2, 0.064); sharp-duotone (2, 0.064); sharp-solid (2, 0.064) |
| four-style set: arrow-left-dashed-panel | rounded-outline (2, 0.264); rounded-two-tone (2, 0.264); rounded-duotone (2, 0.264); rounded-solid (2, 0.264); sharp-outline (2, 0.263); sharp-two-tone (2, 0.137); sharp-duotone (2, 0.137); sharp-solid (2, 0.263) |
| four-style set: arrow-left-right-2 | rounded-outline (4, 0.046); rounded-two-tone (4, 0.046); rounded-duotone (4, 0.046); rounded-solid (4, 0.046); sharp-outline (4, 0.044); sharp-two-tone (4, 0.044); sharp-duotone (4, 0.044); sharp-solid (4, 0.044) |
| four-style set: arrow-right | rounded-outline (2, 0.065); rounded-two-tone (2, 0.065); rounded-duotone (2, 0.065); rounded-solid (2, 0.065); sharp-outline (2, 0.064); sharp-two-tone (2, 0.064); sharp-duotone (2, 0.064); sharp-solid (2, 0.064) |
| four-style set: arrow-right-dashed-panel | rounded-outline (2, 0.264); rounded-two-tone (2, 0.264); rounded-duotone (2, 0.264); rounded-solid (2, 0.264); sharp-outline (2, 0.263); sharp-two-tone (2, 0.137); sharp-duotone (2, 0.137); sharp-solid (2, 0.263) |
| four-style set: arrow-right-left-2 | rounded-outline (4, 0.046); rounded-two-tone (4, 0.046); rounded-duotone (4, 0.046); rounded-solid (4, 0.046); sharp-outline (4, 0.044); sharp-two-tone (4, 0.044); sharp-duotone (4, 0.044); sharp-solid (4, 0.044) |
| four-style set: arrow-right-to-line | rounded-outline (2, 0.065); rounded-two-tone (2, 0.065); rounded-duotone (2, 0.065); rounded-solid (2, 0.065); sharp-outline (2, 0.064); sharp-two-tone (2, 0.064); sharp-duotone (2, 0.064); sharp-solid (2, 0.064) |
| four-style set: arrow-u-turn-left | rounded-outline (1, 0.68); rounded-two-tone (1, 0.68); rounded-duotone (1, 0.68); rounded-solid (1, 0.68) |
| four-style set: arrow-u-turn-right | rounded-outline (1, 0.68); rounded-two-tone (1, 0.68); rounded-duotone (1, 0.68); rounded-solid (1, 0.68); sharp-outline (1, 0.38); sharp-two-tone (1, 0.38); sharp-duotone (1, 0.38); sharp-solid (1, 0.38) |
| four-style set: arrow-up | rounded-outline (2, 0.065); rounded-two-tone (2, 0.065); rounded-duotone (2, 0.065); rounded-solid (2, 0.065); sharp-outline (2, 0.064); sharp-two-tone (2, 0.064); sharp-duotone (2, 0.064); sharp-solid (2, 0.064) |
| four-style set: arrow-up-dashed-panel | rounded-outline (2, 0.264); rounded-two-tone (2, 0.264); rounded-duotone (2, 0.264); rounded-solid (2, 0.264); sharp-outline (2, 0.263); sharp-two-tone (2, 0.137); sharp-duotone (2, 0.137); sharp-solid (2, 0.263) |
| four-style set: arrow-up-down-2 | rounded-outline (4, 0.046); rounded-two-tone (4, 0.046); rounded-duotone (4, 0.046); rounded-solid (4, 0.046); sharp-outline (4, 0.044); sharp-two-tone (4, 0.044); sharp-duotone (4, 0.044); sharp-solid (4, 0.044) |
| four-style set: badge-check | rounded-outline (2, 0.264); rounded-two-tone (2, 0.264); rounded-duotone (2, 0.264); rounded-solid (4, 0.385); sharp-outline (2, 0.281); sharp-two-tone (2, 0.281); sharp-duotone (2, 0.281); sharp-solid (6, 0.449) |
| four-style set: banknote-2-check | rounded-outline (1, 0.024); rounded-two-tone (1, 0.024); rounded-duotone (1, 0.024); rounded-solid (1, 0.024); sharp-outline (1, 0.027); sharp-two-tone (1, 0.027); sharp-duotone (1, 0.027); sharp-solid (1, 0.027) |
| four-style set: banknote-check | rounded-outline (1, 0.024); rounded-two-tone (1, 0.024); rounded-duotone (1, 0.024); rounded-solid (1, 0.024); sharp-outline (1, 0.027); sharp-two-tone (1, 0.027); sharp-duotone (1, 0.027); sharp-solid (1, 0.027) |
| four-style set: baseball | sharp-duotone (2, 0.105); sharp-solid (2, 0.105) |
| four-style set: basketball | sharp-duotone (4, 0.095) |
| four-style set: battery-charging | rounded-outline (2, 0.471); rounded-two-tone (2, 0.471); rounded-duotone (2, 0.471); rounded-solid (2, 0.471); sharp-outline (2, 0.519); sharp-two-tone (2, 0.519); sharp-duotone (2, 0.519); sharp-solid (2, 0.519) |
| four-style set: bell-off | rounded-two-tone (1, 0.007); rounded-duotone (1, 0.007); rounded-solid (1, 0.007); sharp-two-tone (1, 0.044); sharp-duotone (1, 0.044); sharp-solid (1, 0.044) |
| four-style set: bike | rounded-outline (1, 0.556); rounded-two-tone (1, 0.556); rounded-duotone (1, 0.556); rounded-solid (1, 0.556); sharp-outline (1, 0.603); sharp-two-tone (1, 0.603); sharp-duotone (1, 0.603); sharp-solid (1, 0.603) |
| four-style set: bike-fast | rounded-outline (1, 0.556); rounded-two-tone (1, 0.556); rounded-duotone (1, 0.556); rounded-solid (1, 0.556); sharp-outline (1, 0.603); sharp-two-tone (1, 0.603); sharp-duotone (1, 0.603); sharp-solid (1, 0.603) |
| four-style set: bird | rounded-outline (2, 0.239); rounded-two-tone (3, 0.382); rounded-duotone (2, 0.382); rounded-solid (2, 0.382); sharp-outline (2, 0.239); sharp-two-tone (3, 0.239); sharp-duotone (2, 0.239); sharp-solid (2, 0.239) |
| four-style set: bot-droplet | rounded-outline (2, 0.566); rounded-two-tone (4, 0.566); rounded-duotone (2, 0.566); rounded-solid (2, 0.566); sharp-outline (2, 0.195); sharp-two-tone (4, 0.22); sharp-duotone (2, 0.22); sharp-solid (2, 0.22) |
| four-style set: bot-star | rounded-outline (2, 0.058); rounded-two-tone (4, 0.093); rounded-duotone (2, 0.093); rounded-solid (2, 0.093); sharp-outline (2, 0.101); sharp-two-tone (4, 0.101); sharp-duotone (2, 0.093); sharp-solid (2, 0.093) |
| four-style set: bracket-arrow-down | rounded-outline (2, 0.302); rounded-two-tone (2, 0.302); rounded-duotone (2, 0.302); rounded-solid (2, 0.302); sharp-outline (2, 0.174); sharp-two-tone (2, 0.174); sharp-duotone (2, 0.174); sharp-solid (2, 0.174) |
| four-style set: bracket-arrow-left | rounded-outline (2, 0.302); rounded-two-tone (2, 0.302); rounded-duotone (2, 0.302); rounded-solid (2, 0.302); sharp-outline (2, 0.174); sharp-two-tone (2, 0.174); sharp-duotone (2, 0.174); sharp-solid (2, 0.174) |
| four-style set: bracket-arrow-right | rounded-outline (2, 0.302); rounded-two-tone (2, 0.302); rounded-duotone (2, 0.302); rounded-solid (2, 0.302); sharp-outline (2, 0.174); sharp-two-tone (2, 0.174); sharp-duotone (2, 0.174); sharp-solid (2, 0.174) |
| four-style set: bracket-arrow-up | rounded-outline (2, 0.302); rounded-two-tone (2, 0.302); rounded-duotone (2, 0.302); rounded-solid (2, 0.302); sharp-outline (2, 0.174); sharp-two-tone (2, 0.174); sharp-duotone (2, 0.174); sharp-solid (2, 0.174) |
| four-style set: brain | sharp-solid (2, 0.017) |
| four-style set: brain-circuit | sharp-solid (1, 0.017) |
| four-style set: broadcast | sharp-outline (6, 0.139); sharp-two-tone (6, 0.139); sharp-duotone (6, 0.139); sharp-solid (6, 0.139) |
| four-style set: camera | rounded-outline (2, 0.24); rounded-two-tone (4, 0.24); rounded-duotone (2, 0.18); rounded-solid (2, 0.18); sharp-outline (2, 0.202); sharp-two-tone (4, 0.24); sharp-duotone (2, 0.24); sharp-solid (2, 0.24) |
| four-style set: camera-off | rounded-outline (1, 0.24); rounded-two-tone (1, 0.18); rounded-duotone (1, 0.18); rounded-solid (1, 0.18); sharp-outline (1, 0.186); sharp-two-tone (2, 0.24); sharp-duotone (2, 0.24); sharp-solid (2, 0.24) |
| four-style set: camera-sparkles | rounded-outline (2, 0.24); rounded-two-tone (2, 0.24); rounded-duotone (2, 0.24); rounded-solid (2, 0.24); sharp-outline (2, 0.202); sharp-two-tone (2, 0.202); sharp-duotone (2, 0.202); sharp-solid (2, 0.202) |
| four-style set: captions | sharp-outline (4, 0.113); sharp-two-tone (4, 0.113); sharp-duotone (4, 0.113); sharp-solid (8, 0.181) |
| four-style set: captions-off | sharp-outline (1, 0.113); sharp-two-tone (1, 0.113); sharp-duotone (4, 0.181); sharp-solid (4, 0.181) |
| four-style set: captions-sparkles | sharp-outline (4, 0.113); sharp-two-tone (4, 0.113); sharp-duotone (4, 0.113); sharp-solid (4, 0.113) |
| four-style set: car | sharp-two-tone (1, 0.364); sharp-duotone (1, 0.364); sharp-solid (2, 0.364) |
| four-style set: cctv | rounded-outline (1, 0.142); rounded-two-tone (2, 0.142); rounded-duotone (1, 0.089); rounded-solid (1, 0.142); sharp-outline (1, 0.139); sharp-two-tone (2, 0.142); sharp-duotone (1, 0.139); sharp-solid (1, 0.139) |
| four-style set: chart-line-down | rounded-outline (3, 0.24); rounded-two-tone (3, 0.24); rounded-duotone (3, 0.24); rounded-solid (3, 0.24); sharp-outline (3, 0.401); sharp-two-tone (3, 0.401); sharp-duotone (3, 0.401); sharp-solid (3, 0.401) |
| four-style set: chart-line-up | rounded-outline (3, 0.24); rounded-two-tone (3, 0.24); rounded-duotone (3, 0.24); rounded-solid (3, 0.24); sharp-outline (3, 0.401); sharp-two-tone (3, 0.401); sharp-duotone (3, 0.401); sharp-solid (3, 0.401) |
| four-style set: check | rounded-outline (2, 0.264); rounded-two-tone (2, 0.264); rounded-duotone (2, 0.264); rounded-solid (2, 0.264); sharp-outline (2, 0.273); sharp-two-tone (2, 0.273); sharp-duotone (2, 0.273); sharp-solid (2, 0.273) |
| four-style set: circle-arrow-down | rounded-outline (2, 0.055); rounded-two-tone (2, 0.055); rounded-duotone (2, 0.055); rounded-solid (4, 0.037); sharp-outline (2, 0.057); sharp-two-tone (2, 0.057); sharp-duotone (2, 0.057); sharp-solid (6, 0.067) |
| four-style set: circle-arrow-left | rounded-outline (2, 0.055); rounded-two-tone (2, 0.055); rounded-duotone (2, 0.055); rounded-solid (4, 0.037); sharp-outline (2, 0.057); sharp-two-tone (2, 0.057); sharp-duotone (2, 0.057); sharp-solid (6, 0.067) |
| four-style set: circle-arrow-right | rounded-outline (2, 0.055); rounded-two-tone (2, 0.055); rounded-duotone (2, 0.055); rounded-solid (4, 0.037); sharp-outline (2, 0.057); sharp-two-tone (2, 0.057); sharp-duotone (2, 0.057); sharp-solid (6, 0.067) |
| four-style set: circle-arrow-u-turn-left | rounded-outline (2, 0.04); rounded-two-tone (2, 0.04); rounded-duotone (2, 0.04); rounded-solid (4, 0.025); sharp-outline (2, 0.073); sharp-two-tone (2, 0.073); sharp-duotone (2, 0.073); sharp-solid (6, 0.051) |
| four-style set: circle-arrow-u-turn-right | rounded-outline (2, 0.04); rounded-two-tone (2, 0.04); rounded-duotone (2, 0.04); rounded-solid (4, 0.025); sharp-outline (2, 0.073); sharp-two-tone (2, 0.073); sharp-duotone (2, 0.073); sharp-solid (6, 0.051) |
| four-style set: circle-arrow-up | rounded-outline (2, 0.055); rounded-two-tone (2, 0.055); rounded-duotone (2, 0.055); rounded-solid (4, 0.055); sharp-outline (2, 0.057); sharp-two-tone (2, 0.057); sharp-duotone (2, 0.057); sharp-solid (6, 0.04) |
| four-style set: circle-check | rounded-outline (2, 0.264); rounded-two-tone (2, 0.264); rounded-duotone (2, 0.264); rounded-solid (4, 0.385); sharp-outline (2, 0.281); sharp-two-tone (2, 0.281); sharp-duotone (2, 0.281); sharp-solid (6, 0.449) |
| four-style set: circle-chevrons-up | sharp-solid (4, 0.006) |
| four-style set: circle-dashed | sharp-outline (8, 0.125); sharp-two-tone (8, 0.125); sharp-duotone (8, 0.125); sharp-solid (8, 0.125) |
| four-style set: circle-dashed-check | rounded-outline (2, 0.264); rounded-two-tone (2, 0.264); rounded-duotone (2, 0.264); rounded-solid (2, 0.264); sharp-outline (10, 0.281); sharp-two-tone (10, 0.281); sharp-duotone (10, 0.281); sharp-solid (10, 0.281) |
| four-style set: circle-dashed-full | sharp-outline (8, 0.125); sharp-two-tone (8, 0.125); sharp-duotone (8, 0.125); sharp-solid (8, 0.125) |
| four-style set: circle-dashed-half | sharp-outline (8, 0.125); sharp-two-tone (8, 0.125); sharp-duotone (8, 0.125); sharp-solid (8, 0.125) |
| four-style set: circle-dashed-plus | sharp-outline (8, 0.125); sharp-two-tone (8, 0.125); sharp-duotone (8, 0.125); sharp-solid (8, 0.125) |
| four-style set: circle-dashed-quarter | sharp-outline (8, 0.125); sharp-two-tone (8, 0.125); sharp-duotone (8, 0.125); sharp-solid (8, 0.125) |
| four-style set: circle-dashed-three-quarter | sharp-outline (8, 0.125); sharp-two-tone (8, 0.125); sharp-duotone (8, 0.125); sharp-solid (8, 0.125) |
| four-style set: circle-euro | sharp-solid (2, 0.141) |
| four-style set: circle-indian-rupee | rounded-outline (1, 0.339); rounded-two-tone (1, 0.339); rounded-duotone (1, 0.339); rounded-solid (2, 0.271); sharp-outline (1, 0.339); sharp-two-tone (1, 0.339); sharp-duotone (1, 0.339); sharp-solid (3, 0.46) |
| four-style set: circle-japanese-yen | rounded-outline (2, 0.25); rounded-two-tone (2, 0.25); rounded-duotone (2, 0.25); rounded-solid (4, 0.314); sharp-outline (2, 0.25); sharp-two-tone (2, 0.25); sharp-duotone (2, 0.25); sharp-solid (6, 0.214) |
| four-style set: circle-navigation | sharp-outline (2, 0.113); sharp-two-tone (2, 0.113); sharp-duotone (2, 0.113); sharp-solid (2, 0.113) |
| four-style set: circle-progress-arrow-up | rounded-outline (2, 0.055); rounded-two-tone (2, 0.055); rounded-duotone (2, 0.055); rounded-solid (2, 0.055); sharp-outline (6, 0.125); sharp-two-tone (6, 0.125); sharp-duotone (6, 0.125); sharp-solid (6, 0.125) |
| four-style set: circle-progress-check | rounded-outline (2, 0.264); rounded-two-tone (2, 0.264); rounded-duotone (2, 0.264); rounded-solid (2, 0.264); sharp-outline (6, 0.281); sharp-two-tone (6, 0.281); sharp-duotone (6, 0.281); sharp-solid (6, 0.281) |
| four-style set: circle-progress-half | sharp-outline (4, 0.125); sharp-two-tone (4, 0.125); sharp-duotone (4, 0.125); sharp-solid (4, 0.125) |
| four-style set: circle-progress-pause | sharp-outline (4, 0.125); sharp-two-tone (4, 0.125); sharp-duotone (4, 0.125); sharp-solid (4, 0.125) |
| four-style set: circle-progress-play | sharp-outline (4, 0.125); sharp-two-tone (4, 0.125); sharp-duotone (4, 0.125); sharp-solid (4, 0.125) |
| four-style set: circle-progress-plus | sharp-outline (4, 0.125); sharp-two-tone (4, 0.125); sharp-duotone (4, 0.125); sharp-solid (4, 0.125) |
| four-style set: circle-progress-quarter | sharp-outline (6, 0.125); sharp-two-tone (6, 0.125); sharp-duotone (6, 0.125); sharp-solid (6, 0.125) |
| four-style set: circle-progress-stop | sharp-outline (4, 0.125); sharp-two-tone (4, 0.125); sharp-duotone (4, 0.125); sharp-solid (4, 0.125) |
| four-style set: circle-progress-three-quarter | sharp-outline (2, 0.125); sharp-two-tone (2, 0.125); sharp-duotone (2, 0.125); sharp-solid (2, 0.125) |
| four-style set: circle-progress-x | sharp-outline (4, 0.125); sharp-two-tone (4, 0.125); sharp-duotone (4, 0.125); sharp-solid (4, 0.125) |
| four-style set: circle-radical | rounded-outline (1, 0.172); rounded-two-tone (1, 0.172); rounded-duotone (1, 0.172); rounded-solid (1, 0.172); sharp-outline (1, 0.218); sharp-two-tone (1, 0.218); sharp-duotone (1, 0.218); sharp-solid (1, 0.218) |
| four-style set: circle-trending-down | sharp-solid (1, 0.003) |
| four-style set: circle-trending-up | sharp-solid (2, 0.006) |
| four-style set: circles-dashed | sharp-outline (6, 0.082); sharp-two-tone (6, 0.082); sharp-duotone (6, 0.082); sharp-solid (6, 0.082) |
| four-style set: clipboard-code | rounded-outline (4, 0.5); rounded-two-tone (4, 0.5); rounded-duotone (4, 0.5); rounded-solid (8, 0.652); sharp-outline (4, 0.574); sharp-two-tone (4, 0.574); sharp-duotone (4, 0.574); sharp-solid (12, 0.679) |
| four-style set: clipboard-terminal | rounded-outline (2, 0.247); rounded-two-tone (2, 0.247); rounded-duotone (2, 0.247); rounded-solid (4, 0.299); sharp-outline (2, 0.275); sharp-two-tone (2, 0.275); sharp-duotone (2, 0.275); sharp-solid (6, 0.32) |
| four-style set: cloud-off | sharp-two-tone (1, 0.02); sharp-duotone (1, 0.02); sharp-solid (1, 0.02) |
| four-style set: cloud-sun | sharp-outline (1, 0.097); sharp-two-tone (1, 0.097); sharp-duotone (1, 0.097); sharp-solid (1, 0.097) |
| four-style set: cloud-terminal | rounded-outline (2, 0.247); rounded-two-tone (2, 0.247); rounded-duotone (2, 0.247); rounded-solid (2, 0.247); sharp-outline (2, 0.25); sharp-two-tone (2, 0.25); sharp-duotone (2, 0.25); sharp-solid (2, 0.25) |
| four-style set: code | rounded-outline (1, 0.354); rounded-two-tone (1, 0.354); rounded-duotone (1, 0.354); rounded-solid (1, 0.354) |
| four-style set: code-xml | rounded-outline (1, 0.354); rounded-two-tone (1, 0.354); rounded-duotone (1, 0.354); rounded-solid (1, 0.354) |
| four-style set: crown | rounded-outline (2, 0.147); rounded-two-tone (4, 0.235); rounded-duotone (2, 0.235); rounded-solid (2, 0.235); sharp-outline (2, 0.177); sharp-two-tone (4, 0.238); sharp-duotone (2, 0.238); sharp-solid (2, 0.238) |
| four-style set: cursor-click | rounded-outline (2, 0.002); rounded-two-tone (2, 0.002); rounded-duotone (2, 0.002); rounded-solid (2, 0.002); sharp-outline (2, 0.003); sharp-two-tone (2, 0.003); sharp-duotone (2, 0.003); sharp-solid (2, 0.003) |
| four-style set: cursor-off | sharp-two-tone (1, 0.004); sharp-duotone (1, 0.004); sharp-solid (1, 0.004) |
| four-style set: delete | rounded-outline (2, 0.189); rounded-two-tone (4, 0.189); rounded-duotone (2, 0.189); rounded-solid (2, 0.189); sharp-two-tone (4, 0.571); sharp-duotone (2, 0.354); sharp-solid (2, 0.354) |
| four-style set: double-check | rounded-outline (3, 0.354); rounded-two-tone (3, 0.354); rounded-duotone (3, 0.354); rounded-solid (3, 0.354); sharp-outline (2, 0.273); sharp-two-tone (2, 0.273); sharp-duotone (2, 0.273); sharp-solid (2, 0.273) |
| four-style set: droplet | rounded-outline (2, 0.566); rounded-two-tone (4, 0.566); rounded-duotone (2, 0.566); rounded-solid (2, 0.566); sharp-outline (2, 0.493); sharp-two-tone (4, 0.563); sharp-duotone (2, 0.493); sharp-solid (2, 0.563) |
| four-style set: droplet-off | rounded-outline (3, 0.566); rounded-two-tone (3, 0.566); rounded-duotone (3, 0.566); rounded-solid (3, 0.566); sharp-outline (3, 0.353); sharp-two-tone (3, 0.353); sharp-duotone (3, 0.414); sharp-solid (3, 0.414) |
| four-style set: droplets | rounded-outline (3, 0.38); rounded-two-tone (7, 0.38); rounded-duotone (4, 0.38); rounded-solid (4, 0.38); sharp-outline (4, 0.116); sharp-two-tone (10, 0.138); sharp-duotone (6, 0.138); sharp-solid (6, 0.138) |
| four-style set: earth | rounded-outline (1, 0.405); rounded-two-tone (1, 0.405); rounded-duotone (1, 0.332); rounded-solid (1, 0.167); sharp-outline (1, 0.279); sharp-two-tone (1, 0.279); sharp-duotone (1, 0.352); sharp-solid (1, 0.186) |
| four-style set: eject | rounded-outline (2, 0.563); rounded-two-tone (2, 0.563); rounded-duotone (2, 0.563); rounded-solid (2, 0.563) |
| four-style set: eye-off | sharp-solid (1, 0.12) |
| four-style set: fast-forward | rounded-outline (4, 0.105); rounded-two-tone (8, 0.105); rounded-duotone (4, 0.105); rounded-solid (4, 0.105) |
| four-style set: file-code | rounded-outline (4, 0.5); rounded-two-tone (4, 0.5); rounded-duotone (4, 0.5); rounded-solid (8, 0.652); sharp-outline (4, 0.574); sharp-two-tone (4, 0.574); sharp-duotone (4, 0.574); sharp-solid (12, 0.679) |
| four-style set: file-off | sharp-solid (1, 0.058) |
| four-style set: file-terminal | rounded-outline (2, 0.247); rounded-two-tone (2, 0.247); rounded-duotone (2, 0.247); rounded-solid (4, 0.299); sharp-outline (2, 0.275); sharp-two-tone (2, 0.275); sharp-duotone (2, 0.275); sharp-solid (6, 0.32) |
| four-style set: filter | rounded-outline (3, 0.177); rounded-two-tone (6, 0.177); rounded-duotone (3, 0.177); rounded-solid (3, 0.177); sharp-two-tone (2, 0.606) |
| four-style set: fingerprint-pattern | sharp-outline (2, 0.098); sharp-two-tone (2, 0.098); sharp-duotone (2, 0.098); sharp-solid (2, 0.098) |
| four-style set: flip-horizontal | sharp-outline (4, 0.5); sharp-two-tone (8, 0.5); sharp-duotone (4, 0.354); sharp-solid (4, 0.354) |
| four-style set: flip-vertical | sharp-outline (4, 0.5); sharp-two-tone (8, 0.5); sharp-duotone (4, 0.354); sharp-solid (4, 0.354) |
| four-style set: git-arrow-right | sharp-outline (2, 0.121); sharp-two-tone (2, 0.121); sharp-duotone (2, 0.121); sharp-solid (2, 0.121) |
| four-style set: git-pull-request-arrow | sharp-solid (2, 0.121) |
| four-style set: globe-check | rounded-outline (1, 0.024); rounded-two-tone (1, 0.024); rounded-duotone (1, 0.024); rounded-solid (1, 0.024); sharp-outline (1, 0.027); sharp-two-tone (1, 0.027); sharp-duotone (1, 0.027); sharp-solid (1, 0.027) |
| four-style set: globe-off | rounded-solid (1, 0.001); sharp-solid (1, 0.001) |
| four-style set: grid-circles-check | rounded-outline (2, 0.132); rounded-two-tone (2, 0.132); rounded-duotone (2, 0.132); rounded-solid (2, 0.132); sharp-outline (2, 0.141); sharp-two-tone (2, 0.141); sharp-duotone (2, 0.141); sharp-solid (2, 0.141) |
| four-style set: grid-squares-check | rounded-outline (2, 0.132); rounded-two-tone (2, 0.132); rounded-duotone (2, 0.132); rounded-solid (2, 0.132); sharp-outline (2, 0.141); sharp-two-tone (2, 0.141); sharp-duotone (2, 0.141); sharp-solid (2, 0.141) |
| four-style set: hammer | rounded-outline (6, 0.102); rounded-two-tone (10, 0.102); rounded-duotone (6, 0.102); rounded-solid (6, 0.102); sharp-outline (6, 0.243); sharp-two-tone (12, 0.267); sharp-duotone (7, 0.24); sharp-solid (7, 0.24) |
| four-style set: hand-coins | rounded-duotone (1, 0); sharp-duotone (1, 0) |
| four-style set: hand-heart | rounded-duotone (1, 0); sharp-duotone (1, 0) |
| four-style set: hand-open | rounded-outline (2, 0.324); rounded-two-tone (4, 0.325); rounded-duotone (2, 0.325); rounded-solid (2, 0.325); sharp-outline (2, 0.324); sharp-two-tone (4, 0.325); sharp-duotone (2, 0.325); sharp-solid (2, 0.325) |
| four-style set: hand-pointer | rounded-outline (1, 0.024); rounded-two-tone (1, 0.024); sharp-outline (1, 0.024); sharp-two-tone (1, 0.024) |
| four-style set: hand-pointer-down | rounded-outline (1, 0.024); rounded-two-tone (1, 0.024); sharp-outline (1, 0.024); sharp-two-tone (1, 0.024) |
| four-style set: hand-pointer-left | rounded-outline (1, 0.024); rounded-two-tone (1, 0.024); sharp-outline (1, 0.024); sharp-two-tone (1, 0.024) |
| four-style set: hand-pointer-right | rounded-outline (1, 0.024); rounded-two-tone (1, 0.024); sharp-outline (1, 0.024); sharp-two-tone (1, 0.024) |
| four-style set: hand-pointer-sparkles | rounded-outline (1, 0.024); rounded-two-tone (1, 0.024); rounded-duotone (1, 0.024); rounded-solid (1, 0.024); sharp-outline (1, 0.024); sharp-two-tone (1, 0.024); sharp-duotone (1, 0.024); sharp-solid (1, 0.024) |
| four-style set: hat-glasses | sharp-outline (2, 0.286); sharp-two-tone (4, 0.286); sharp-duotone (2, 0.28); sharp-solid (2, 0.28) |
| four-style set: headset-off | sharp-duotone (1, 0.176) |
| four-style set: heart-off | sharp-outline (1, 0.104); sharp-two-tone (2, 0.154); sharp-duotone (2, 0.154); sharp-solid (2, 0.154) |
| four-style set: heart-plus | sharp-two-tone (1, 0.095); sharp-duotone (1, 0.095); sharp-solid (1, 0.095) |
| four-style set: home | rounded-two-tone (2, 0.378) |
| four-style set: home-check | rounded-outline (2, 0.378); rounded-two-tone (3, 0.378); rounded-duotone (2, 0.378); rounded-solid (2, 0.378); sharp-outline (2, 0.109); sharp-two-tone (3, 0.172); sharp-duotone (3, 0.707); sharp-solid (3, 0.709) |
| four-style set: home-plus | rounded-outline (1, 0.378); rounded-two-tone (2, 0.378); rounded-duotone (1, 0.378); rounded-solid (1, 0.378); sharp-outline (1, 0.109); sharp-two-tone (2, 0.172); sharp-duotone (2, 0.707); sharp-solid (2, 0.709) |
| four-style set: home-x | rounded-outline (1, 0.378); rounded-two-tone (2, 0.378); rounded-duotone (1, 0.378); rounded-solid (1, 0.378); sharp-outline (1, 0.109); sharp-two-tone (2, 0.172); sharp-duotone (2, 0.707); sharp-solid (2, 0.709) |
| four-style set: home-zap | rounded-outline (1, 0.378); rounded-two-tone (2, 0.378); rounded-duotone (1, 0.378); rounded-solid (1, 0.378); sharp-outline (1, 0.109); sharp-two-tone (2, 0.172); sharp-duotone (2, 0.707); sharp-solid (2, 0.709) |
| four-style set: homes | rounded-outline (4, 0.27); rounded-two-tone (6, 0.27); rounded-duotone (4, 0.27); rounded-solid (4, 0.27); sharp-outline (1, 0.627); sharp-two-tone (1, 0.627); sharp-duotone (2, 0.549); sharp-solid (2, 0.549) |
| four-style set: hourglass | rounded-outline (4, 0.622); rounded-two-tone (8, 0.622); rounded-duotone (4, 0.581); rounded-solid (6, 0.619); sharp-outline (4, 0.745); sharp-two-tone (8, 0.745); sharp-duotone (4, 0.677); sharp-solid (6, 0.677) |
| four-style set: hourglass-end | rounded-outline (4, 0.622); rounded-two-tone (8, 0.622); rounded-duotone (4, 0.581); rounded-solid (8, 0.619); sharp-outline (4, 0.745); sharp-two-tone (8, 0.745); sharp-duotone (4, 0.677); sharp-solid (8, 0.677) |
| four-style set: hourglass-half | rounded-outline (4, 0.622); rounded-two-tone (8, 0.622); rounded-duotone (6, 0.581); rounded-solid (6, 0.581); sharp-outline (4, 0.745); sharp-two-tone (8, 0.745); sharp-duotone (6, 0.677); sharp-solid (6, 0.677) |
| four-style set: hourglass-start | rounded-outline (4, 0.622); rounded-two-tone (8, 0.622); rounded-duotone (6, 0.581); rounded-solid (6, 0.619); sharp-outline (4, 0.745); sharp-two-tone (8, 0.745); sharp-duotone (6, 0.677); sharp-solid (6, 0.677) |
| four-style set: house | sharp-two-tone (4, 0.145); sharp-duotone (4, 0.145); sharp-solid (4, 0.145) |
| four-style set: house-cast | rounded-outline (1, 0.581); rounded-two-tone (1, 0.581); rounded-duotone (1, 0.581); rounded-solid (1, 0.581) |
| four-style set: house-check | rounded-outline (1, 0.024); rounded-two-tone (2, 0.47); rounded-duotone (2, 0.47); rounded-solid (2, 0.47); sharp-outline (1, 0.027); sharp-two-tone (3, 0.145); sharp-duotone (3, 0.145); sharp-solid (3, 0.145) |
| four-style set: house-chimney | rounded-two-tone (2, 0.47); rounded-duotone (3, 0.47); rounded-solid (3, 0.47); sharp-two-tone (5, 0.232); sharp-duotone (5, 0.232); sharp-solid (5, 0.232) |
| four-style set: house-cog | sharp-two-tone (4, 0.145); sharp-duotone (4, 0.145); sharp-solid (8, 0.145) |
| four-style set: house-heart | sharp-two-tone (4, 0.145); sharp-duotone (4, 0.145); sharp-solid (4, 0.145) |
| four-style set: house-plug | sharp-two-tone (4, 0.145); sharp-duotone (4, 0.145); sharp-solid (4, 0.145) |
| four-style set: house-plus | rounded-two-tone (1, 0.47); rounded-duotone (1, 0.47); rounded-solid (1, 0.47); sharp-two-tone (2, 0.145); sharp-duotone (2, 0.145); sharp-solid (2, 0.145) |
| four-style set: house-simple | sharp-two-tone (4, 0.145); sharp-solid (4, 0.145) |
| four-style set: house-x | rounded-two-tone (1, 0.47); rounded-duotone (1, 0.47); rounded-solid (1, 0.47); sharp-two-tone (2, 0.145); sharp-duotone (2, 0.145); sharp-solid (2, 0.145) |
| four-style set: house-zap | rounded-two-tone (1, 0.47); rounded-duotone (1, 0.47); rounded-solid (1, 0.47); sharp-two-tone (2, 0.145); sharp-duotone (2, 0.145); sharp-solid (2, 0.145) |
| four-style set: houses | rounded-outline (4, 0.58); rounded-two-tone (6, 0.58); rounded-duotone (4, 0.362); rounded-solid (4, 0.362); sharp-outline (1, 0.627); sharp-two-tone (3, 0.627); sharp-duotone (3, 0.271); sharp-solid (3, 0.271) |
| four-style set: humidity | rounded-outline (2, 0.283); rounded-two-tone (4, 0.283); rounded-duotone (2, 0.283); rounded-solid (2, 0.283); sharp-outline (3, 0.282); sharp-two-tone (5, 0.282); sharp-duotone (3, 0.124); sharp-solid (3, 0.124) |
| four-style set: image | rounded-outline (1, 0.17); rounded-two-tone (1, 0.17); rounded-duotone (1, 0.17); rounded-solid (1, 0.17); sharp-outline (1, 0.354); sharp-two-tone (1, 0.354); sharp-duotone (1, 0.354); sharp-solid (1, 0.468) |
| four-style set: image-arrow-down | rounded-outline (1, 0.17); rounded-two-tone (1, 0.17); rounded-duotone (1, 0.17); rounded-solid (1, 0.17); sharp-outline (1, 0.354); sharp-two-tone (1, 0.354); sharp-duotone (1, 0.354); sharp-solid (1, 0.468) |
| four-style set: image-arrow-left | rounded-outline (1, 0.17); rounded-two-tone (1, 0.17); rounded-duotone (1, 0.17); rounded-solid (1, 0.17); sharp-outline (1, 0.354); sharp-two-tone (1, 0.354); sharp-duotone (1, 0.354); sharp-solid (1, 0.468) |
| four-style set: image-arrow-right | rounded-outline (1, 0.17); rounded-two-tone (1, 0.17); rounded-duotone (1, 0.17); rounded-solid (1, 0.17); sharp-outline (1, 0.354); sharp-two-tone (1, 0.354); sharp-duotone (1, 0.354); sharp-solid (1, 0.468) |
| four-style set: image-arrow-up | rounded-outline (1, 0.17); rounded-two-tone (1, 0.17); rounded-duotone (1, 0.17); rounded-solid (1, 0.17); sharp-outline (1, 0.354); sharp-two-tone (1, 0.354); sharp-duotone (1, 0.354); sharp-solid (1, 0.468) |
| four-style set: image-check | rounded-outline (1, 0.17); rounded-two-tone (1, 0.17); rounded-duotone (1, 0.17); rounded-solid (1, 0.17); sharp-outline (1, 0.354); sharp-two-tone (1, 0.354); sharp-duotone (1, 0.354); sharp-solid (1, 0.468) |
| four-style set: image-minus | rounded-outline (1, 0.17); rounded-two-tone (1, 0.17); rounded-duotone (1, 0.17); rounded-solid (1, 0.17); sharp-outline (1, 0.354); sharp-two-tone (1, 0.354); sharp-duotone (1, 0.354); sharp-solid (1, 0.468) |
| four-style set: image-off | rounded-outline (1, 0.095); rounded-two-tone (1, 0.095); rounded-duotone (1, 0.095); rounded-solid (1, 0.095); sharp-outline (1, 0.152); sharp-two-tone (1, 0.152); sharp-duotone (1, 0.152); sharp-solid (1, 0.152) |
| four-style set: image-plus | rounded-outline (1, 0.17); rounded-two-tone (1, 0.17); rounded-duotone (1, 0.17); rounded-solid (1, 0.17); sharp-outline (1, 0.354); sharp-two-tone (1, 0.354); sharp-duotone (1, 0.354); sharp-solid (1, 0.468) |
| four-style set: image-sparkles | rounded-outline (1, 0.17); rounded-two-tone (1, 0.17); rounded-duotone (1, 0.17); rounded-solid (1, 0.17); sharp-outline (1, 0.354); sharp-two-tone (1, 0.354); sharp-duotone (1, 0.354); sharp-solid (1, 0.354) |
| four-style set: image-x | rounded-outline (1, 0.17); rounded-two-tone (1, 0.17); rounded-duotone (1, 0.17); rounded-solid (1, 0.17); sharp-outline (1, 0.354); sharp-two-tone (1, 0.354); sharp-duotone (1, 0.354); sharp-solid (1, 0.468) |
| four-style set: inbox | rounded-outline (2, 0.442); rounded-two-tone (2, 0.442); rounded-duotone (2, 0.404); rounded-solid (4, 0.442); sharp-outline (2, 0.404); sharp-two-tone (2, 0.404); sharp-duotone (2, 0.404); sharp-solid (4, 0.404) |
| four-style set: inbox-sparkles | rounded-outline (2, 0.442); rounded-two-tone (2, 0.442); rounded-duotone (2, 0.442); rounded-solid (2, 0.442); sharp-outline (2, 0.404); sharp-two-tone (2, 0.404); sharp-duotone (2, 0.404); sharp-solid (2, 0.404) |
| four-style set: indian-rupee | sharp-outline (1, 0.442); sharp-two-tone (1, 0.442); sharp-duotone (1, 0.442); sharp-solid (1, 0.442) |
| four-style set: infinity | rounded-outline (2, 0.249); rounded-two-tone (2, 0.249); rounded-duotone (2, 0.249); rounded-solid (2, 0.249); sharp-outline (2, 0.249); sharp-two-tone (2, 0.249); sharp-duotone (2, 0.249); sharp-solid (2, 0.249) |
| four-style set: japanese-yen | rounded-outline (2, 0.5); rounded-two-tone (2, 0.5); rounded-duotone (2, 0.5); rounded-solid (2, 0.5); sharp-outline (2, 0.5); sharp-two-tone (2, 0.5); sharp-duotone (2, 0.5); sharp-solid (2, 0.5) |
| four-style set: link-2-off | sharp-outline (1, 0.074); sharp-two-tone (1, 0.074); sharp-duotone (1, 0.074); sharp-solid (1, 0.074) |
| four-style set: list-video | rounded-outline (2, 0.354); rounded-two-tone (2, 0.354); sharp-outline (1, 0.405); sharp-two-tone (2, 0.405); sharp-duotone (1, 0.354); sharp-solid (1, 0.354) |
| four-style set: log-in | rounded-outline (2, 0.302); rounded-two-tone (2, 0.302); rounded-duotone (2, 0.302); rounded-solid (2, 0.302); sharp-outline (2, 0.174); sharp-two-tone (2, 0.174); sharp-duotone (2, 0.174); sharp-solid (2, 0.174) |
| four-style set: log-out | rounded-outline (2, 0.302); rounded-two-tone (2, 0.302); rounded-duotone (2, 0.302); rounded-solid (2, 0.302); sharp-outline (2, 0.174); sharp-two-tone (2, 0.174); sharp-duotone (2, 0.174); sharp-solid (2, 0.174) |
| four-style set: lungs | rounded-outline (2, 0.719); rounded-two-tone (2, 0.719); rounded-duotone (2, 0.719); rounded-solid (2, 0.719); sharp-outline (2, 0.719); sharp-two-tone (2, 0.719); sharp-duotone (2, 0.719); sharp-solid (4, 0.719) |
| four-style set: map-pin | rounded-outline (2, 0.563); rounded-two-tone (4, 0.563); rounded-duotone (2, 0.249); rounded-solid (2, 0.249); sharp-outline (2, 0.563); sharp-two-tone (4, 0.563); sharp-duotone (2, 0.249); sharp-solid (2, 0.249) |
| four-style set: map-pin-check | rounded-outline (1, 0.398); rounded-two-tone (2, 0.398); rounded-duotone (1, 0.249); rounded-solid (1, 0.249); sharp-outline (1, 0.415); sharp-two-tone (3, 0.42); sharp-duotone (2, 0.42); sharp-solid (2, 0.42) |
| four-style set: map-pin-heart | rounded-outline (2, 0.563); rounded-two-tone (4, 0.563); rounded-duotone (2, 0.249); rounded-solid (2, 0.249); sharp-outline (2, 0.563); sharp-two-tone (4, 0.563); sharp-duotone (2, 0.249); sharp-solid (2, 0.249) |
| four-style set: map-pin-minus | rounded-outline (1, 0.398); rounded-two-tone (2, 0.398); rounded-duotone (1, 0.249); rounded-solid (1, 0.249); sharp-outline (1, 0.415); sharp-two-tone (3, 0.42); sharp-duotone (2, 0.42); sharp-solid (2, 0.42) |
| four-style set: map-pin-off | rounded-outline (2, 0.444); rounded-two-tone (4, 0.444); rounded-duotone (2, 0.315); rounded-solid (2, 0.313); sharp-outline (2, 0.444); sharp-two-tone (4, 0.444); sharp-duotone (2, 0.315); sharp-solid (2, 0.313) |
| four-style set: map-pin-plus | rounded-outline (1, 0.398); rounded-two-tone (2, 0.398); rounded-duotone (1, 0.249); rounded-solid (1, 0.249); sharp-outline (1, 0.415); sharp-two-tone (3, 0.42); sharp-duotone (2, 0.42); sharp-solid (2, 0.42) |
| four-style set: map-pin-search | rounded-outline (1, 0.398); rounded-two-tone (2, 0.398); rounded-duotone (1, 0.249); rounded-solid (1, 0.249); sharp-outline (1, 0.415); sharp-two-tone (3, 0.42); sharp-duotone (2, 0.42); sharp-solid (2, 0.42) |
| four-style set: map-pin-x | rounded-outline (1, 0.398); rounded-two-tone (2, 0.398); rounded-duotone (1, 0.249); rounded-solid (1, 0.249); sharp-outline (1, 0.415); sharp-two-tone (3, 0.42); sharp-duotone (2, 0.42); sharp-solid (2, 0.42) |
| four-style set: message-off | rounded-two-tone (1, 0.004); rounded-duotone (1, 0.004); rounded-solid (1, 0.004); sharp-outline (1, 0.172); sharp-two-tone (1, 0.08); sharp-duotone (1, 0.08); sharp-solid (1, 0.08) |
| four-style set: milestone | sharp-outline (2, 0.571); sharp-two-tone (4, 0.571); sharp-duotone (2, 0.354); sharp-solid (2, 0.354) |
| four-style set: money-bag | rounded-duotone (4, 0.265); rounded-solid (4, 0.214); sharp-outline (2, 0.177); sharp-two-tone (4, 0.177); sharp-duotone (4, 0.201) |
| four-style set: money-bag-check | rounded-duotone (4, 0.265); rounded-solid (4, 0.214); sharp-outline (2, 0.177); sharp-two-tone (4, 0.177); sharp-duotone (4, 0.201) |
| four-style set: money-bag-dollar-sign | rounded-duotone (4, 0.265); rounded-solid (4, 0.214); sharp-outline (2, 0.177); sharp-two-tone (4, 0.177); sharp-duotone (4, 0.201) |
| four-style set: money-bag-minus | rounded-duotone (4, 0.265); rounded-solid (4, 0.214); sharp-outline (2, 0.177); sharp-two-tone (4, 0.177); sharp-duotone (4, 0.201) |
| four-style set: money-bag-plus | rounded-duotone (4, 0.265); rounded-solid (4, 0.214); sharp-outline (2, 0.177); sharp-two-tone (4, 0.177); sharp-duotone (4, 0.201) |
| four-style set: money-bag-x | rounded-duotone (4, 0.265); rounded-solid (4, 0.214); sharp-outline (2, 0.177); sharp-two-tone (4, 0.177); sharp-duotone (4, 0.201) |
| four-style set: phone | sharp-outline (2, 0.266); sharp-two-tone (4, 0.266); sharp-duotone (2, 0.266); sharp-solid (2, 0.111) |
| four-style set: phone-call | sharp-outline (2, 0.266); sharp-two-tone (4, 0.266); sharp-duotone (2, 0.111); sharp-solid (2, 0.111) |
| four-style set: phone-forwarded | sharp-outline (2, 0.266); sharp-two-tone (4, 0.266); sharp-duotone (2, 0.111); sharp-solid (2, 0.111) |
| four-style set: phone-incoming | sharp-outline (2, 0.266); sharp-two-tone (4, 0.266); sharp-duotone (2, 0.111); sharp-solid (2, 0.111) |
| four-style set: phone-missed | sharp-outline (2, 0.266); sharp-two-tone (4, 0.266); sharp-duotone (2, 0.111); sharp-solid (2, 0.111) |
| four-style set: phone-off | sharp-outline (2, 0.266); sharp-two-tone (3, 0.266); sharp-duotone (2, 0.111); sharp-solid (2, 0.111) |
| four-style set: phone-outgoing | sharp-outline (2, 0.266); sharp-two-tone (4, 0.266); sharp-duotone (2, 0.111); sharp-solid (2, 0.111) |
| four-style set: phone-sparkles | sharp-outline (2, 0.266); sharp-two-tone (2, 0.266); sharp-duotone (2, 0.266); sharp-solid (2, 0.266) |
| four-style set: pig | rounded-outline (2, 0.285); rounded-two-tone (4, 0.562); rounded-duotone (2, 0.562); rounded-solid (2, 0.562); sharp-outline (1, 0.357); sharp-two-tone (2, 0.439); sharp-duotone (2, 0.622); sharp-solid (2, 0.389) |
| four-style set: piggy-bank | rounded-outline (2, 0.223); sharp-outline (2, 0.223) |
| four-style set: pin | sharp-outline (4, 0.147); sharp-two-tone (8, 0.147); sharp-duotone (4, 0.141); sharp-solid (4, 0.141) |
| four-style set: pin-off | sharp-outline (4, 0.147); sharp-two-tone (6, 0.147); sharp-duotone (4, 0.141); sharp-solid (4, 0.141) |
| four-style set: plane | rounded-outline (5, 0.677); rounded-two-tone (10, 0.677); rounded-duotone (5, 0.677); rounded-solid (8, 0.733); sharp-outline (6, 0.568); sharp-two-tone (12, 0.579); sharp-duotone (6, 0.568); sharp-solid (9, 0.633) |
| four-style set: plane-takeoff | rounded-outline (2, 0.114); rounded-two-tone (4, 0.162); rounded-duotone (2, 0.162); rounded-solid (2, 0.162); sharp-outline (3, 0.14); sharp-two-tone (6, 0.183); sharp-duotone (3, 0.183); sharp-solid (3, 0.183) |
| four-style set: play | rounded-outline (2, 0.563); rounded-two-tone (4, 0.563); rounded-duotone (2, 0.563); rounded-solid (2, 0.563) |
| four-style set: play-off | rounded-outline (2, 0.613); rounded-two-tone (3, 0.622); rounded-duotone (2, 0.622); rounded-solid (2, 0.622); sharp-outline (1, 0.338) |
| four-style set: podium-1 | rounded-outline (1, 0.04); rounded-two-tone (1, 0.04); rounded-duotone (1, 0.04); rounded-solid (1, 0.04); sharp-outline (1, 0.05); sharp-two-tone (1, 0.05); sharp-duotone (1, 0.05); sharp-solid (1, 0.05) |
| four-style set: podium-3 | rounded-outline (1, 0.202); rounded-two-tone (1, 0.202); rounded-duotone (1, 0.202); rounded-solid (1, 0.202); sharp-outline (1, 0.202); sharp-two-tone (1, 0.202); sharp-duotone (1, 0.202); sharp-solid (1, 0.202) |
| four-style set: power | sharp-outline (2, 0.028); sharp-two-tone (2, 0.028); sharp-duotone (2, 0.028); sharp-solid (2, 0.028) |
| four-style set: power-off | sharp-outline (1, 0.028); sharp-two-tone (1, 0.028); sharp-duotone (1, 0.028); sharp-solid (1, 0.028) |
| four-style set: radical | rounded-outline (1, 0.38); rounded-two-tone (1, 0.38); rounded-duotone (1, 0.38); rounded-solid (1, 0.38); sharp-outline (1, 0.406); sharp-two-tone (1, 0.406); sharp-duotone (1, 0.406); sharp-solid (1, 0.406) |
| four-style set: regex | rounded-outline (2, 0.707); rounded-two-tone (2, 0.707); rounded-duotone (2, 0.707); rounded-solid (2, 0.707) |
| four-style set: repeat-1 | rounded-outline (1, 0.202); rounded-two-tone (1, 0.202); rounded-duotone (1, 0.202); rounded-solid (1, 0.202); sharp-outline (1, 0.262); sharp-two-tone (1, 0.262); sharp-duotone (1, 0.262); sharp-solid (1, 0.262) |
| four-style set: rewind | rounded-outline (4, 0.105); rounded-two-tone (8, 0.105); rounded-duotone (4, 0.105); rounded-solid (4, 0.105) |
| four-style set: rocket | rounded-duotone (2, 0.647); sharp-duotone (2, 0.647) |
| four-style set: rocket-fast | rounded-duotone (2, 0.647); sharp-duotone (2, 0.647) |
| four-style set: scissors | rounded-outline (1, 0.618); rounded-two-tone (1, 0.618); rounded-duotone (1, 0.618); rounded-solid (1, 0.618); sharp-outline (1, 0.618); sharp-two-tone (1, 0.618); sharp-duotone (1, 0.618); sharp-solid (1, 0.618) |
| four-style set: scissors-horizontal | rounded-outline (1, 0.618); rounded-two-tone (1, 0.618); rounded-duotone (1, 0.618); rounded-solid (1, 0.618); sharp-outline (1, 0.618); sharp-two-tone (1, 0.618); sharp-duotone (1, 0.618); sharp-solid (1, 0.618) |
| four-style set: search-2-check | rounded-outline (1, 0.017); rounded-two-tone (1, 0.017); rounded-duotone (1, 0.017); rounded-solid (2, 0.017); sharp-outline (1, 0.02); sharp-two-tone (1, 0.02); sharp-duotone (1, 0.02); sharp-solid (3, 0.034) |
| four-style set: search-check | rounded-outline (1, 0.017); rounded-two-tone (1, 0.017); rounded-duotone (1, 0.017); rounded-solid (2, 0.017); sharp-outline (1, 0.02); sharp-two-tone (1, 0.02); sharp-duotone (1, 0.02); sharp-solid (3, 0.034) |
| four-style set: send-clock | rounded-outline (1, 0.586); rounded-two-tone (1, 0.586); rounded-duotone (1, 0.586); rounded-solid (1, 0.586); sharp-outline (1, 0.464); sharp-two-tone (1, 0.464); sharp-duotone (1, 0.464); sharp-solid (1, 0.464) |
| four-style set: send-fast | rounded-outline (2, 0.562); rounded-two-tone (4, 0.562); rounded-duotone (3, 0.562); sharp-outline (1, 0.749); sharp-two-tone (1, 0.749) |
| four-style set: settings | rounded-outline (2, 0); rounded-two-tone (5, 0); rounded-duotone (3, 0); rounded-solid (3, 0); sharp-outline (4, 0.001); sharp-two-tone (8, 0.001); sharp-duotone (4, 0); sharp-solid (4, 0) |
| four-style set: settings-dot | rounded-outline (1, 0); rounded-two-tone (4, 0); rounded-duotone (3, 0); rounded-solid (3, 0); sharp-outline (2, 0.001); sharp-two-tone (4, 0.001); sharp-duotone (2, 0); sharp-solid (2, 0) |
| four-style set: share-2 | rounded-outline (2, 0.426); rounded-two-tone (4, 0.426); rounded-duotone (2, 0.426); rounded-solid (2, 0.426); sharp-two-tone (1, 0.663); sharp-solid (2, 0.53) |
| four-style set: shield | sharp-outline (2, 0.228); sharp-two-tone (4, 0.228); sharp-duotone (2, 0.228); sharp-solid (2, 0.144) |
| four-style set: shield-alert | sharp-outline (2, 0.228); sharp-two-tone (4, 0.228); sharp-duotone (2, 0.144); sharp-solid (2, 0.144) |
| four-style set: shield-check | rounded-outline (2, 0.264); rounded-two-tone (2, 0.264); rounded-duotone (2, 0.264); rounded-solid (4, 0.352); sharp-outline (4, 0.281); sharp-two-tone (6, 0.281); sharp-duotone (4, 0.281); sharp-solid (8, 0.402) |
| four-style set: shield-heart | sharp-outline (2, 0.228); sharp-two-tone (4, 0.228); sharp-duotone (2, 0.144); sharp-solid (2, 0.144) |
| four-style set: shield-key | sharp-outline (2, 0.228); sharp-two-tone (4, 0.228); sharp-duotone (2, 0.144); sharp-solid (2, 0.144) |
| four-style set: shield-lock | sharp-outline (2, 0.228); sharp-two-tone (4, 0.228); sharp-duotone (2, 0.144); sharp-solid (2, 0.144) |
| four-style set: shield-minus | sharp-outline (2, 0.228); sharp-two-tone (4, 0.228); sharp-duotone (2, 0.144); sharp-solid (2, 0.144) |
| four-style set: shield-off | sharp-outline (1, 0.228); sharp-two-tone (2, 0.228); sharp-duotone (1, 0.144); sharp-solid (1, 0.144) |
| four-style set: shield-plus | sharp-outline (2, 0.228); sharp-two-tone (4, 0.228); sharp-duotone (2, 0.144); sharp-solid (2, 0.144) |
| four-style set: shield-question | sharp-outline (2, 0.228); sharp-two-tone (4, 0.228); sharp-duotone (2, 0.144); sharp-solid (2, 0.144) |
| four-style set: shield-sparkles | sharp-outline (2, 0.228); sharp-two-tone (2, 0.228); sharp-duotone (2, 0.228); sharp-solid (2, 0.228) |
| four-style set: shield-terminal | rounded-outline (2, 0.2); rounded-two-tone (2, 0.2); rounded-duotone (2, 0.2); rounded-solid (4, 0.232); sharp-outline (4, 0.233); sharp-two-tone (6, 0.233); sharp-duotone (4, 0.233); sharp-solid (8, 0.275) |
| four-style set: shield-user | sharp-outline (2, 0.228); sharp-two-tone (4, 0.228); sharp-duotone (2, 0.144); sharp-solid (2, 0.144) |
| four-style set: shield-x | sharp-outline (2, 0.228); sharp-two-tone (4, 0.228); sharp-duotone (2, 0.144); sharp-solid (2, 0.144) |
| four-style set: ship | rounded-outline (1, 0.019); rounded-two-tone (2, 0.019); rounded-duotone (1, 0.012); rounded-solid (1, 0.012); sharp-outline (1, 0.019); sharp-two-tone (2, 0.019); sharp-duotone (1, 0.012); sharp-solid (1, 0.012) |
| four-style set: shopping-bag | rounded-outline (2, 0.224); rounded-two-tone (4, 0.224); rounded-duotone (2, 0.224); rounded-solid (4, 0.224); sharp-outline (2, 0.404); sharp-two-tone (4, 0.404); sharp-duotone (2, 0.354); sharp-solid (4, 0.354) |
| four-style set: skip-back | rounded-outline (2, 0.21); rounded-two-tone (4, 0.21); rounded-duotone (2, 0.21); rounded-solid (2, 0.21) |
| four-style set: skip-forward | rounded-outline (2, 0.21); rounded-two-tone (4, 0.21); rounded-duotone (2, 0.21); rounded-solid (2, 0.21) |
| four-style set: smartphone-check | rounded-outline (1, 0.024); rounded-two-tone (1, 0.024); rounded-duotone (1, 0.024); rounded-solid (1, 0.024); sharp-outline (1, 0.027); sharp-two-tone (1, 0.027); sharp-duotone (1, 0.027); sharp-solid (1, 0.027) |
| four-style set: soccer-ball | rounded-outline (4, 0.41); rounded-two-tone (4, 0.41); rounded-duotone (4, 0.41); rounded-solid (8, 0.489); sharp-outline (4, 0.65); sharp-two-tone (4, 0.65); sharp-duotone (8, 0.65); sharp-solid (8, 0.489) |
| four-style set: square-arrow-down | rounded-outline (2, 0.055); rounded-two-tone (2, 0.055); rounded-duotone (2, 0.055); rounded-solid (4, 0.037); sharp-outline (2, 0.057); sharp-two-tone (2, 0.057); sharp-duotone (2, 0.057); sharp-solid (6, 0.067) |
| four-style set: square-arrow-left | rounded-outline (2, 0.055); rounded-two-tone (2, 0.055); rounded-duotone (2, 0.055); rounded-solid (4, 0.037); sharp-outline (2, 0.057); sharp-two-tone (2, 0.057); sharp-duotone (2, 0.057); sharp-solid (6, 0.067) |
| four-style set: square-arrow-right | rounded-outline (2, 0.055); rounded-two-tone (2, 0.055); rounded-duotone (2, 0.055); rounded-solid (4, 0.037); sharp-outline (2, 0.057); sharp-two-tone (2, 0.057); sharp-duotone (2, 0.057); sharp-solid (6, 0.067) |
| four-style set: square-arrow-u-turn-left | rounded-outline (2, 0.04); rounded-two-tone (2, 0.04); rounded-duotone (2, 0.04); rounded-solid (4, 0.025); sharp-outline (2, 0.073); sharp-two-tone (2, 0.073); sharp-duotone (2, 0.073); sharp-solid (6, 0.051) |
| four-style set: square-arrow-u-turn-right | rounded-outline (2, 0.04); rounded-two-tone (2, 0.04); rounded-duotone (2, 0.04); rounded-solid (4, 0.025); sharp-outline (2, 0.073); sharp-two-tone (2, 0.073); sharp-duotone (2, 0.073); sharp-solid (6, 0.051) |
| four-style set: square-arrow-up | rounded-outline (2, 0.055); rounded-two-tone (2, 0.055); rounded-duotone (2, 0.055); rounded-solid (4, 0.055); sharp-outline (2, 0.057); sharp-two-tone (2, 0.057); sharp-duotone (2, 0.057); sharp-solid (6, 0.04) |
| four-style set: square-check | rounded-outline (2, 0.264); rounded-two-tone (2, 0.264); rounded-duotone (2, 0.264); rounded-solid (4, 0.35); sharp-outline (2, 0.281); sharp-two-tone (2, 0.281); sharp-duotone (2, 0.281); sharp-solid (6, 0.403) |
| four-style set: square-chevrons-up | sharp-solid (4, 0.006) |
| four-style set: square-radical | rounded-outline (1, 0.172); rounded-two-tone (1, 0.172); rounded-duotone (1, 0.172); rounded-solid (1, 0.172); sharp-outline (1, 0.218); sharp-two-tone (1, 0.218); sharp-duotone (1, 0.218); sharp-solid (1, 0.218) |
| four-style set: square-terminal-asterisk | rounded-outline (2, 0.707); rounded-two-tone (2, 0.707); rounded-duotone (2, 0.707); rounded-solid (8, 0.467); sharp-solid (12, 0.366) |
| four-style set: square-trending-down | sharp-solid (1, 0.003) |
| four-style set: square-trending-up | sharp-solid (2, 0.006) |
| four-style set: star | rounded-outline (2, 0.247); rounded-two-tone (4, 0.376); rounded-duotone (2, 0.247); rounded-solid (2, 0.376); sharp-outline (2, 0.415); sharp-two-tone (4, 0.415); sharp-duotone (2, 0.415); sharp-solid (2, 0.376) |
| four-style set: star-off | rounded-outline (2, 0.265); rounded-two-tone (3, 0.376); rounded-duotone (2, 0.376); rounded-solid (2, 0.376); sharp-outline (2, 0.415); sharp-two-tone (3, 0.415); sharp-duotone (2, 0.376); sharp-solid (2, 0.376) |
| four-style set: star-shooting | rounded-outline (2, 0.166); rounded-two-tone (4, 0.246); rounded-duotone (2, 0.246); rounded-solid (2, 0.246); sharp-outline (2, 0.285); sharp-two-tone (4, 0.285); sharp-duotone (2, 0.246); sharp-solid (2, 0.246) |
| four-style set: store | rounded-outline (2, 0.139); rounded-two-tone (4, 0.139); rounded-duotone (2, 0.139); rounded-solid (4, 0.174); sharp-outline (2, 0.221); sharp-two-tone (4, 0.221); sharp-duotone (2, 0.177); sharp-solid (4, 0.177) |
| four-style set: swatch-book | rounded-outline (2, 0.174); rounded-two-tone (2, 0.174); rounded-duotone (2, 0.174); rounded-solid (2, 0.174); sharp-outline (3, 0.703); sharp-two-tone (3, 0.703); sharp-duotone (3, 0.703); sharp-solid (3, 0.703) |
| four-style set: tablet-check | rounded-outline (1, 0.024); rounded-two-tone (1, 0.024); rounded-duotone (1, 0.024); rounded-solid (1, 0.024); sharp-outline (1, 0.027); sharp-two-tone (1, 0.027); sharp-duotone (1, 0.027); sharp-solid (1, 0.027) |
| four-style set: tag | sharp-outline (2, 0.335); sharp-two-tone (4, 0.335); sharp-duotone (2, 0.293); sharp-solid (2, 0.293) |
| four-style set: tag-horizontal-end | sharp-outline (1, 0.335); sharp-two-tone (4, 0.473); sharp-duotone (2, 0.293); sharp-solid (2, 0.293) |
| four-style set: tag-horizontal-end-percent | sharp-outline (1, 0.335); sharp-two-tone (4, 0.473); sharp-duotone (2, 0.293); sharp-solid (2, 0.293) |
| four-style set: tag-horizontal-start | sharp-outline (1, 0.335); sharp-two-tone (4, 0.473); sharp-duotone (2, 0.293); sharp-solid (2, 0.293) |
| four-style set: tag-horizontal-start-percent | sharp-outline (1, 0.335); sharp-two-tone (4, 0.473); sharp-duotone (2, 0.293); sharp-solid (2, 0.293) |
| four-style set: tag-horizontal-start-sparkles | sharp-outline (1, 0.335); sharp-two-tone (1, 0.335); sharp-duotone (1, 0.335); sharp-solid (1, 0.335) |
| four-style set: tag-sparkles | sharp-outline (2, 0.335); sharp-two-tone (2, 0.335); sharp-duotone (2, 0.335); sharp-solid (2, 0.335) |
| four-style set: tape | rounded-outline (6, 0.333); rounded-two-tone (6, 0.333); rounded-duotone (12, 0.333); rounded-solid (12, 0.333); sharp-outline (6, 0.333); sharp-two-tone (6, 0.333); sharp-duotone (12, 0.333); sharp-solid (12, 0.333) |
| four-style set: terminal | rounded-outline (1, 0.53); rounded-two-tone (1, 0.53); rounded-duotone (1, 0.53); rounded-solid (1, 0.53); sharp-outline (1, 0.371); sharp-two-tone (1, 0.371); sharp-duotone (1, 0.371); sharp-solid (1, 0.371) |
| four-style set: terminal-asterisk | rounded-outline (2, 0.707); rounded-two-tone (2, 0.707); rounded-duotone (2, 0.707); rounded-solid (2, 0.707) |
| four-style set: terminal-plus | rounded-outline (1, 0.53); rounded-two-tone (1, 0.53); rounded-duotone (1, 0.53); rounded-solid (1, 0.53); sharp-outline (2, 0.523); sharp-two-tone (2, 0.523); sharp-duotone (2, 0.523); sharp-solid (2, 0.523) |
| four-style set: terminal-sparkles | rounded-outline (2, 0.53); rounded-two-tone (2, 0.53); rounded-duotone (2, 0.53); rounded-solid (2, 0.53); sharp-outline (2, 0.523); sharp-two-tone (2, 0.523); sharp-duotone (2, 0.523); sharp-solid (2, 0.523) |
| four-style set: test-tube-diagonal | rounded-two-tone (1, 0.413); rounded-solid (2, 0.413) |
| four-style set: tv | rounded-outline (2, 0.5); rounded-two-tone (2, 0.5); rounded-duotone (2, 0.5); rounded-solid (2, 0.5); sharp-outline (2, 0.538); sharp-two-tone (2, 0.538); sharp-duotone (2, 0.538); sharp-solid (2, 0.538) |
| four-style set: usb | rounded-outline (2, 0.526); rounded-two-tone (2, 0.526); rounded-duotone (2, 0.526); rounded-solid (2, 0.526); sharp-outline (2, 0.526); sharp-two-tone (2, 0.526); sharp-duotone (2, 0.526); sharp-solid (2, 0.526) |
| four-style set: user-check | rounded-outline (2, 0.198); rounded-two-tone (2, 0.198); rounded-duotone (2, 0.198); rounded-solid (2, 0.198); sharp-outline (2, 0.214); sharp-two-tone (2, 0.214); sharp-duotone (2, 0.214); sharp-solid (2, 0.214) |
| four-style set: user-message | rounded-outline (1, 0.207); rounded-two-tone (1, 0.207); rounded-duotone (1, 0.207); rounded-solid (1, 0.207); sharp-outline (1, 0.186); sharp-two-tone (1, 0.186); sharp-duotone (1, 0.186); sharp-solid (1, 0.186) |
| four-style set: user-shield | sharp-outline (2, 0.1); sharp-two-tone (2, 0.1); sharp-duotone (2, 0.1); sharp-solid (2, 0.1) |
| four-style set: vision-pro | sharp-outline (2, 0.399); sharp-two-tone (4, 0.426); sharp-duotone (2, 0.399); sharp-solid (2, 0.426) |
| four-style set: volume | rounded-outline (2, 0.445); rounded-two-tone (2, 0.445); sharp-outline (2, 0.023); sharp-two-tone (2, 0.023); sharp-duotone (2, 0.023); sharp-solid (2, 0.023) |
| four-style set: volume-low | rounded-outline (2, 0.445); rounded-two-tone (2, 0.445); sharp-outline (4, 0.023); sharp-two-tone (6, 0.023); sharp-duotone (4, 0.023); sharp-solid (4, 0.023) |
| four-style set: volume-minus | rounded-outline (2, 0.445); rounded-two-tone (2, 0.445); sharp-outline (2, 0.001); sharp-two-tone (4, 0.001); sharp-duotone (2, 0.001); sharp-solid (2, 0.001) |
| four-style set: volume-off | rounded-outline (2, 0.445); rounded-two-tone (2, 0.445); sharp-outline (1, 0.023); sharp-two-tone (1, 0.023); sharp-duotone (1, 0.023); sharp-solid (1, 0.023) |
| four-style set: volume-plus | rounded-outline (2, 0.445); rounded-two-tone (2, 0.445); sharp-outline (2, 0.001); sharp-two-tone (4, 0.001); sharp-duotone (2, 0.001); sharp-solid (2, 0.001) |
| four-style set: volume-x | rounded-outline (2, 0.445); rounded-two-tone (2, 0.445); sharp-outline (2, 0.001); sharp-two-tone (4, 0.001); sharp-duotone (2, 0.001); sharp-solid (2, 0.001) |
| four-style set: wifi | sharp-outline (4, 0.044); sharp-two-tone (4, 0.044); sharp-duotone (4, 0.044); sharp-solid (4, 0.044) |
| four-style set: wifi-exclamation | sharp-outline (2, 0.044); sharp-two-tone (2, 0.044); sharp-duotone (2, 0.044); sharp-solid (2, 0.044) |
| four-style set: wifi-info | sharp-outline (2, 0.044); sharp-two-tone (2, 0.044); sharp-duotone (2, 0.044); sharp-solid (2, 0.044) |
| four-style set: wifi-low | sharp-two-tone (2, 0.044); sharp-duotone (2, 0.044) |
| four-style set: wifi-medium | sharp-outline (2, 0.044); sharp-two-tone (2, 0.044); sharp-duotone (2, 0.044); sharp-solid (2, 0.044) |
| four-style set: wifi-plus | sharp-outline (2, 0.044); sharp-two-tone (2, 0.044); sharp-duotone (2, 0.044); sharp-solid (2, 0.044) |
| four-style set: wifi-x | sharp-outline (3, 0.151); sharp-two-tone (3, 0.151); sharp-duotone (3, 0.151); sharp-solid (3, 0.151) |
| four-style set: zap | rounded-outline (2, 0.064); rounded-two-tone (4, 0.064); rounded-duotone (2, 0.064); rounded-solid (2, 0.064) |
| four-style set: zap-off | rounded-outline (4, 0.052); rounded-two-tone (6, 0.052); rounded-duotone (4, 0.052); rounded-solid (4, 0.052) |
| four-style set: zap-sparkles | rounded-outline (2, 0.064); rounded-two-tone (2, 0.064); rounded-duotone (2, 0.064); rounded-solid (2, 0.064) |
