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
| `cocktail_list1.json` | The recipes. Each cocktail has a name, category, method, image, and one field per ingredient (empty if not used) |
| `images/` | Cocktail photos stored with the site |
| `tools/download_images.py` | Downloads photos that are still web links into `images/` |

## Adding or changing a cocktail

The recipes are kept in a spreadsheet (`cocktail_list1-v2.xlsx`, not stored in this repo) and exported to `cocktail_list1.json`:

1. Add a row, or change a value, in the spreadsheet. Put the photo's **web link** in the `Image` column, as before.
2. Export it to `cocktail_list1.json`, the same way as before.
3. Upload `cocktail_list1.json` to this repo, replacing the old one.

A new category or ingredient column shows up in the site's menus automatically. Keep the column names the same as in the spreadsheet: they are what the site displays.

After step 3, the **Download cocktail images** Action runs by itself. It downloads any new or changed photos into `images/`, reuses the ones it already has, and commits the result. The site updates a minute or two later.

## Photos

Photos live in `images/`, named after the cocktail (e.g. `images/negroni.jpg`). `images/sources.json` records which web link each photo came from, and the site shows that link as a credit under the picture.

The download runs automatically when `cocktail_list1.json` changes. To run it by hand: on GitHub, go to **Actions → Download cocktail images → Run workflow**, or on your computer run `python3 tools/download_images.py`, then commit and push.

Photos that can't be downloaded keep their web link, so nothing breaks. Changing a cocktail's link downloads the new photo; renaming or deleting a cocktail removes its old photo.

## Running it locally

The page loads the JSON with `fetch`, so open it through a web server rather than double-clicking the file:

```bash
python3 -m http.server 8000
```

Then visit http://localhost:8000.
