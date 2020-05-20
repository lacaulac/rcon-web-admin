# Widget development

Widgets use high-level functions to easily extend the features of RCON Web Admin. There are some core widgets included with the app which you can use to learn.

## New widgets

Creating a new widget is straight forward. Just copy one of the existing widgets. Rename the copied folder. Modify the `manifest.json` to your needs. `id` must be the folder name. Restart the server and you should see the widget in the dashboard.

## Documentation for widgets

This feature is not yet documented in a friendly way. Any contributions to extend this are welcome.
For developers, you can view the [frontend](https://github.com/rcon-web-admin/rcon-web-admin/blob/master/public/scripts/widget.js) and [backend](https://github.com/rcon-web-admin/rcon-web-admin/blob/master/src/widget.js) widget classes to build an understanding of the widget architecture.

## Contribute to this project

If you would like your widget to be considered as a candidate to be included with RCON Web Admin, it must follow the following criteria:

* MIT License
* Public GitHub Repository

## Current list of core widgets

* [rwa-autobot](https://github.com/rcon-web-admin/rwa-autobot)
* [rwa-console](https://github.com/rcon-web-admin/rwa-console)
* [rwa-rustboard](https://github.com/rcon-web-admin/rwa-rustboard)
* [rwa-timedcommands](https://github.com/rcon-web-admin/rwa-timedcommands)

## Tips

During development:

* If you modify `backend.js`; the server must be restarted.
* If you modify `frontend.js`; the web page must be reloaded (F5).
