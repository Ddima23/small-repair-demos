# Synthetic inventory cleanup demo

This original fixture was created with AI for an Upwork Project Catalog listing. It contains fictional products only. It is not a completed client project, customer data or a performance claim.

The eight source rows contain three agreed cleaning rules: trim leading/trailing whitespace, apply the explicit category map, and remove records only when all five normalized fields match exactly. The key is `sku`. A repeated key with conflicting values is retained for review. These rules produce seven rows, one exact duplicate removed and four unresolved issue records.

The original `before.csv` is preserved. `after.csv` contains cleaned values. `issues.csv` lists source row numbers (including the header), the affected field and the action requiring a client's decision. `cleaning-result.json` also contains the complete cell-change and removal logs. The workbook `cleanup-demo.xlsx` provides the same values as an Excel sample, with the cleaned data, original source and exception list on distinct sheets. The workbook has no formulas, macros or external connections.

## Reproduce

Run `node clean.mjs` and `node --test clean.test.mjs` in this folder. The script is specific to this documented five-column schema. A client task requires agreement on their actual schema, mapping, duplicate definition and required fields before adapting it.

## Rules and data dictionary

- `sku`: case-sensitive text product identifier. Leading zeroes or identifier characters must not be inferred or removed.
- `product`: descriptive text, including quoted commas in CSV.
- `category`: agreed map (case-insensitive input): `accessories` to `Accessories`, `home` to `Home`, `office` to `Office`, `stationery` to `Stationery`. Unknown values are retained and flagged.
- `stock_date`: dates must be real ISO dates, `YYYY-MM-DD`. Other or impossible dates are retained as text and flagged. The ambiguous `10/11/2026` is not interpreted as October 11 or November 10.
- `quantity`: source values retained. Blank remains blank. Zero remains zero. Conflicting values for the same SKU are not reconciled or summed.

The example changes five whitespace cells and four category cells, including changes on the subsequently removed duplicate. It removes source row 4, which matches normalized source row 3. Source row 5 has an ambiguous date, row 6 has a missing quantity, and rows 7 and 8 share a SKU with conflicting quantities.

## Proposed service scope

One CSV or one values-only XLSX sheet, up to 1,000 data rows and 10 columns, with up to three agreed cleaning rules. Proposed price $50, two calendar days after required materials, one revision within the same rules. Original preserved, cleaned data and issues/change notes delivered. AI-led processing is disclosed and requires the client's permission. No invented values, external enrichment, sensitive personal data, formulas/macros or production access. Clients confirm unresolved ambiguities.
