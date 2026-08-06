// Google Maps URLs API: opens a Maps search for the query, biased to the
// viewer's current location. Works on desktop and hands off to the Maps app
// on phones. No API key or billing required.
// https://developers.google.com/maps/documentation/urls/get-started#search-action
export function googleMapsSearchUrl(query: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}
