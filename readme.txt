=== Wello ServiceDesk API ===
Contributors: odswello
Tags: servicedesk, helpdesk, support, ticketing, api
Requires at least: 6.0
Tested up to: 6.9
Requires PHP: 7.4
Stable tag: 1.0.0
Donate link: https://wello.solutions/
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Securely connect WordPress to Wello ServiceDesk platform with OTP authentication and ticket management.

== Description ==

Our plugin integrates WordPress with the Wello ServiceDesk API:

* OTP-based login and verification
* Access token generation and refresh
* React-powered ServiceDesk dashboard inside WordPress
* Admin configuration panel (API endpoint, client secrets, sync behavior)
* Ticket and work order listing + detail views
* Translation-ready (en, fr, nl, it, pl, de, es)

Requires a valid Wello ServiceDesk account and API credentials.

== Installation ==

1. Upload the plugin folder to `/wp-content/plugins/`.
2. Activate the plugin in the WordPress **Plugins** page.
3. Navigate to **Settings → Wello ServiceDesk**.
4. Enter API URL and ServiceDesk credentials.
5. Save and open **ServiceDesk** from the menu.

== Frequently Asked Questions ==

= Do I need a Wello ServiceDesk account? =
Yes. A Wello ServiceDesk account is required to use this plugin.

= How is user data handled? =
Passwords are never stored in WordPress. Only temporary authorization tokens are used, and data is exchanged only on user action.

= Can this work on multisite? =
Yes, it is compatible with multisite installations (admin settings are network/site scoped depending on configuration).

== Screenshots ==

1. Admin settings page
2. OTP login screen
3. Embedded ServiceDesk dashboard
4. Ticket detail view

== Changelog ==

= 1.0.0 =
* Initial release with core API integration and React ServiceDesk UI.

== Upgrade Notice ==

= 1.0.0 =
Initial stable release.

== External Services ==

This plugin communicates with Wello ServiceDesk API:
https://servicedeskapi.wello.solutions

Data transferred:
* Email (OTP request)
* Password (authentication request)
* OTP code/token (verification)
* Ticket/work order metadata

Data is sent only when users or administrators perform authentication/configuration actions.

Terms of Service: https://wello.solutions/terms-of-service
Privacy Policy: https://wello.solutions/privacy-note

== Support ==

Report bugs or request features:
https://github.com/wello-solutions/wello-servicedesk-api/issues

== Additional Notes ==

* Production assets are in `build/static/`.
* Source app in `app/src/` and plugin PHP in root.

Local development:
1. npm install
2. npm run build
3. npm run start

== License ==

GPLv2 or later.

All bundled third-party libraries are GPL-compatible.