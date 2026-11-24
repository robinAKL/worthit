# Spot check: our fair price against an outside valuation

Ten cars from our listings, spread across price, each with at least three of the same model on sale. To check how close our fair price is, look each one up in an outside tool, for example the [AA Vehicle Valuation](https://aa.co.nz/vv) (Red Book) or the [Trade Me price guide](https://www.trademe.co.nz/motors/price-guide). Fill in the last two columns by hand, one car at a time, as the tools intend. Do not automate the lookups.

A gap of 10% or less between our fair price and the outside figure is close. Over 20% means one of the two is wrong, so note which.

| # | Car | km | Asking | Our fair price | Compared with | Outside valuation | Gap |
|---|---|---|---|---|---|---|---|
| 1 | 2007 Hyundai Tucson 2.7 4WD Elite | 272,189 | $7,995 | $6,800 | same model, any year | | |
| 2 | 2014 Toyota Corolla GLX 1.8 Hatch | 114,277 | $15,500 | $10,400 | same model, ±3 years | | |
| 3 | 2006 Volkswagen Golf GTI (race car) | 143,535 | $16,995 | $10,900 | same model, any year | | |
| 4 | 2015 Toyota Aqua X-Urban | 108,272 | $12,980 | $11,100 | same model, ±2 years | | |
| 5 | 2014 Toyota Prius S | 127,721 | $9,989 | $12,200 | same model, ±3 years | | |
| 6 | 2015 Toyota Vitz F | 42,509 | $14,995 | $13,000 | same model, ±2 years | | |
| 7 | 2015 Subaru Impreza 2.0i EyeSight | 73,500 | $16,990 | $13,200 | same model, ±2 years | | |
| 8 | 2017 Nissan X-Trail ST 2.5 | 154,163 | $13,990 | $14,100 | same model, any year | | |
| 9 | 2016 Honda Vezel Hybrid Z AWD | 111,935 | $15,989 | $16,100 | same model, ±2 years | | |
| 10 | 2015 Mazda Axela 20S Touring | 84,900 | $19,500 | $16,100 | same model, ±2 years | | |

Two of these are worth a closer look:

- **#3, the Golf GTI**, is listed as a race car. Modifications change its value in ways no comparison with standard Golfs can capture. It is a good test of whether we should drop listings whose title says "race car" or "modified".
- **#2, the Corolla**, asks 49% over our fair price. Either the dealer is high or our Corolla group is mixed (sedan and hatch, or different engines). The outside valuation will show which.

Fair prices are from the comparison rules in `src/lib/cars/model.ts`, run on the cars collected on 24 November 2026. They change when the listings change.
