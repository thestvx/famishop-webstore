# Stripe Integration TODO

## Values to Replace

The following values are placeholders and must be updated before going live.

**Files containing placeholders:**
- [src/app/api/stripe/checkout-session/route.ts](src/app/api/stripe/checkout-session/route.ts)
- [functions/api/stripe/checkout-session.js](functions/api/stripe/checkout-session.js)

| Field | Current Value | What to Set |
|-------|--------------|-------------|
| success_url | https://famishop-webstore.pages.dev/checkout/success/?session_id={CHECKOUT_SESSION_ID}&orderId=... | Your actual post-payment success page URL. Keep the {CHECKOUT_SESSION_ID} template. |
| cancel_url | https://famishop-webstore.pages.dev/checkout/ | Your actual cancel/return page URL. |
| line_items[].price (price_data) | computed from DB product price | Replace with your actual Stripe Price IDs from the Dashboard (https://dashboard.stripe.com/prices) or API. |
| branding_settings.icon.file | file_1UWHL3CjlPXGToodIVhfQlG2 | Your actual uploaded brand icon file ID. |
| NEXT_PUBLIC_SITE_URL | https://famishop-webstore.pages.dev | Your production domain. |

## Configured Parameters

These parameters were configured in Checkout Studio and are already set correctly.

**Files containing these parameters:**
- [src/app/api/stripe/checkout-session/route.ts](src/app/api/stripe/checkout-session/route.ts)
- [functions/api/stripe/checkout-session.js](functions/api/stripe/checkout-session.js)

| Parameter | Value |
|-----------|-------|
| ui_mode | hosted_page |
| mode | payment |
| billing_address_collection | auto |
| phone_number_collection.enabled | false |
| automatic_tax.enabled | false |
| allow_promotion_codes | false |
| submit_type | auto |
| consent_collection.terms_of_service | required |
| integration_identifier | hosted_web_0001 |
| branding_settings.background_color | #ffffff |
| branding_settings.button_color | #000000 |
| branding_settings.font_family | default |
| branding_settings.border_style | rounded |

## Setup and next steps

- Environment variables: set `STRIPE_SECRET_KEY` in Cloudflare Pages (Production) and in `.env.local` for local dev. Set `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (already embedded as fallback).
- The secret key is NOT committed to the repo (GitHub secret scanning). Add it via Cloudflare Dashboard → Environment variables.
- Rotate the Stripe secret key since it was shared in chat.
- Testing: use a real card with live keys, or switch to Stripe test keys (sk_test/pk_test) for safe testing.
- Order fulfillment: orders are created as `pending` in Supabase at checkout-session creation; status updated to `processing` + `payment_status: paid` on successful verification in `/checkout/success`.
- Resources: https://support.stripe.com and https://docs.stripe.com/mcp
