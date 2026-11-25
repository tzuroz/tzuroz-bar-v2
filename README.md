# 🍸 Tzuroz's Bar

A small cocktail recipe site with 64 cocktails, from the classics to a few house favourites.

## Features

- **Browse by category**: pick a category, then a cocktail.
- **Search by name**: type part of a name; press Enter to open the first match.
- **Search by ingredient**: see every cocktail that uses an ingredient, with the amount.
- **🎲 Surprise me**: opens a random cocktail.
- **🍾 What can I make?**: tick the bottles and ingredients you have, and see which cocktails you can make (plus the ones you're just one ingredient away from). Your choices are remembered on your device.
- **Shareable links**: each cocktail has its own link, e.g. `index.html#negroni`. Use the "Copy link" button on the card.

## Files

| File | What it is |
| --- | --- |
| `index.html` | Page structure |
| `script.js` | Loads the recipes and powers all the features |
| `style.css` | Styling |
| `cocktail_list1.json` | The recipes. Each cocktail has a name, category, method, image link, and one field per ingredient (empty if not used) |

## Adding or changing a cocktail

The recipes are kept in a spreadsheet (`cocktail_list1-v2.xlsx`, not stored in this repo) and exported to `cocktail_list1.json`:

1. Add a row, or change a value, in the spreadsheet. Put the photo's web link in the `Image` column.
2. Export it to `cocktail_list1.json`.
3. Upload `cocktail_list1.json` to this repo, replacing the old one. The site updates a minute or two later.

A new category or ingredient column shows up in the site's menus automatically. Column names are what the site displays, so keep them the same as in the spreadsheet. Use plain English letters only (no accents such as c-cedilla or tilde).

Photos are shown straight from their web links, with a small "Photo: website" credit underneath. If a link stops working, the photo is simply hidden; replace the link in the spreadsheet to fix it.

## Running it locally

The page loads the JSON with `fetch`, so open it through a web server rather than double-clicking the file:

```bash
python3 -m http.server 8000
```

Then visit http://localhost:8000.
