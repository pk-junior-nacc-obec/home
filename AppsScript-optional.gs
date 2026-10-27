/**
 * OPTIONAL: only for an additional Google Apps Script Web App wrapper.
 * Not required for GitHub Pages. Uploading this .gs file to GitHub does not execute it.
 * Replace GITHUB_PAGES_URL with the actual HTTPS URL after publishing.
 * Original static site already uses <link rel="icon"> with the same logo.
 */
function doGet() {
  var GITHUB_PAGES_URL = 'https://YOUR_USERNAME.github.io/YOUR_REPOSITORY/';
  var LOGO_URL = GITHUB_PAGES_URL + 'assets/logo.png';
  return HtmlService.createHtmlOutput(
    '<!doctype html><html lang="th"><head><meta name="viewport" content="width=device-width,initial-scale=1"></head>' +
    '<body style="margin:0"><iframe title="ป.ป.ช.สพฐ.น้อย โรงเรียนภูเขียว" ' +
    'src="' + GITHUB_PAGES_URL + '" style="border:0;width:100%;height:100vh"></iframe></body></html>'
  ).setTitle('ป.ป.ช.สพฐ.น้อย โรงเรียนภูเขียว')
    .setFaviconUrl(LOGO_URL);
}
