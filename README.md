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
| `cocktail_list1.json` | The recipes. Each cocktail has a name, category, method, image URL, and one field per ingredient (empty if not used) |

## Adding a cocktail

Copy an existing entry in `cocktail_list1.json`, change the name, category, method and image, and fill in amounts for the ingredients it uses. A new category or ingredient shows up in the menus automatically.

## Running it locally

The page loads the JSON with `fetch`, so open it through a web server rather than double-clicking the file:

```bash
python3 -m http.server 8000
```

Then visit http://localhost:8000.
