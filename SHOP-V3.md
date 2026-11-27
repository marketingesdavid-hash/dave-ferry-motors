# Dave Ferry Motors shop v3

The catalogue in assets/dfm-catalog-v3.js is the authoritative product data for the homepage and individual static product pages. New items go at the beginning of the array; create a matching /shop/<slug>/index.html page with the same slug, unique title, metadata, stylesheet and shared scripts. Product pages retain model, garment and colour through URL parameters.

## Enquiries and checkout
The current email is SP Print's published general contact (contact@spprint.be), not an agreed dedicated ordering address. The request quote button opens the customer's email app without sending or charging. Confirm the dedicated recipient, exact product IDs, final garment prices, available sizes, model-specific size tables, fulfilment/seller responsibilities, and partner-approved checkout/referral parameters before enabling checkout. Leave unknown fields null. The checkout requires both the global checkoutEnabled setting and verified=true on the relevant product, with an HTTPS spprint.be URL. The optional variants dictionary uses fields garment, color, size, quantity with {parameter,values} confirmed by the partner. The optional referral uses {parameter,value}. No personal email or fabricated checkout URL is used.

The site emits a local dfm:shop CustomEvent for product_open, product_view, artwork_zoom, order_enquiry, partner_checkout; no analytics provider is connected and no event is transmitted by this code.

## Image work pending
Existing 24 model images are unchanged. George's beard and cross-garment identity matching need genuine source-image edits and visual QA. NSU still uses the older artwork and transparent print until the high-resolution replacement passes QA. The eight other WebP files have alpha flags and complete returned RIFF byte lengths; that does not verify interior opacity or visual quality. Exact film URLs and publishing dates need confirmed records. The overall shop layout and order request are independent of these pending assets.
