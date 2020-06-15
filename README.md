### Notice:  __Continued development of the project has moved to this fork.__ The original developer, @brainfoolong, stopped maintaining [the original project](https://github.com/brainfoolong/rcon-web-admin) due to their lack of time.

# RCON Web Admin

RCON Web Admin is a powerful web interface to control your RCON servers. All servers with RCON support should work.

This application can install and run on a server, Raspberry Pi, or other devices which are online 24/7.

Out of the box, RCON Web Admin can check users for high ping, VAC status, or filter the chat for you around the clock.

# Support me

If you'd like to buy some coffee to support the original developer, he would appreciate it. You can do this via [Patreon](https://www.patreon.com/brainfoolong) or  [PayPal](https://www.paypal.me/brainfoolong)

## Features

* RCON administration with your web browser
* Unlimited users and servers, admin roles can manage servers, users may use the dashboard.
* Granular user permissions to restrict access to specific server commands and interface components.
  * If you wish to configure a user to only use the `say` command, you can.
* Powerful widget framework - Developers can add new dashboard components easily
* Responsive frontend which should display correctly on most devices, desktop or smartphone.
* Internationalization support
* One-click update for the core and all installed widgets
* `rcon.web` support (usually more stable than legacy RCON)
* Core widgets and their features:
  * Console - Provides a console interface to directly execute and recieve output from RCON commands
  * Autobot - For advanced users; an interface to write your own high-level code for automation
  * Rustboard - A dedicated widget for the Rust. Provides tools such as the player & ban list, chat, kick/ban, admin/mod config, Steam info with VAC ban checking, and more
  * Timed Commands - Schedule server commands you wish to execute at a specific datetime.

## Supported/tested games

* Rust (Most tested at the moment)
* Counter-Strike: Go (Basic tests with the console widget)
* Minecraft (Basic tests with the console widget)
* Note: Despite the lack of testing, all other servers with RCON support should work. The console widget is generic for all games.

## Widgets

All components of the dashboard are written as widgers. Widgets can be very simple to very complex, depending on what is necessary.
Widgets are written in HTML and JS. Visit [here](https://github.com/rcon-web-admin/rcon-web-admin/tree/master/public/widgets) for more information.

## Requirements

* NodeJS v12.13.1

## Windows Installation

* Download and install [NodeJS](https://nodejs.org)
* Download and unpack this repository

In the extracted directory, run the following commands:
```bash
$ npm install
$ node src/main.js install-core-widgets
```

## Linux Installation

> **Note**: It is strongly advised to avoid running this application as root or with `sudo`, it is not required.
> Also, avoid installing this application in a directory which can be accessed from the internet.
> This application launches a self-contained webserver with limited access to the `/public` folder.
> Failure to follow this advice could leave you vulnerable to security risks.

Run the following commands in the shell:
```bash
$ sudo apt-get install nodejs npm
$ sudo npm update npm -g
$ wget https://codeload.github.com/rcon-web-admin/rcon-web-admin/zip/master -O rcon-web-admin.zip
$ unzip rcon-web-admin.zip
$ mv rcon-web-admin-master rcon-web-admin
$ cd rcon-web-admin
$ npm install
$ node src/main.js install-core-widgets
$ chmod 0755 -R startscripts *
```

## Environment Variables

RCON Web Admin can be partially configured with environment variables. You may configure the initial user and server with these environment variables.

| Variable | Description | Accepted values | Default value | Mandatory |
|:--------:|:-----------:|:---------------:|:-------------:|:---------:|
| RWA_ENV | Enables configuration by environment variables | TRUE / FALSE | FALSE | - |
| RWA_USERNAME | Sets the initial user's username | String | admin | no |
| RWA_PASSWORD | Sets the initial user's password | String | | yes |
| RWA_RESTRICT_COMMANDS | Prevent the initial user user executing these commands | Comma-seperated list | | no |
| RWA_RESTRICT_WIDGETS | Hide this list of widgets from the initial user | Comma-seperated list | | no |
| RWA_READ_ONLY_WIDGET_OPTIONS | Prevent the initial user changing options in the widget options tab | TRUE / FALSE | FALSE | no |
| RWA_ADMIN | Sets the initial user as an admin | TRUE / FALSE | FALSE | no |
| RWA_RCON_HOST | The initial RCON server to control | Hostname or IP address | 127.0.0.1 | no |
| RWA_GAME | The initial game you wish to control | minecraft / rust / csgo / other | minecraft | no |
| RWA_SERVER_NAME | The display name of the initial server (if unset; defaults to value of RWA_GAME) | String | minecraft | no |
| RWA_WEB_RCON | Enables 'web rcon' if supported by the game server | TRUE / FALSE | FALSE | no |
| RWA_RCON_PORT | The port number of the initial RCON server to control | 0-65535 | 25575 | no |
| RWA_RCON_PASSWORD | The password for the initial RCON server to control | String | '' | no |
| RWA_WEBSOCKET_URL_SSL | Manually specify SSL WebSocket URL (wss://example) | wss://string | wss://{host}:4327 | no |
| RWA_WEBSOCKET_URL | Manually specify WebSocket URL (ws://example) | ws://string | ws://{host}:4327 | no |

## Docker Usage

[itzg](https://hub.docker.com/r/itzg/) maintains a Docker image for RCON Web Admin, you can find the image [here (itzg/rcon)](https://hub.docker.com/r/itzg/rcon/).

## Linux Usage

```bash
$ sh startscripts/start-linux.sh start
$ sh startscripts/start-linux.sh stop
$ sh startscripts/start-linux.sh restart
```

## Windows Usage

```powershell
PS> startscripts/start-windows.bat
```

With basic usage, you can close the Powershell or Command Prompt window to stop the app.

## Visit the UI

With default configuration, the application will be available at http://localhost:4326 (if visiting remotely; substitute `localhost` with the IP or hostname of the host).

To modify the default port (4326) or allowed hosts, see `/config.template.js`.

## Boot script

On Linux you can automatically launch RCON Web Admin after each reboot by adding a line to crontab.

Run `crontab -e` while logged into the user you wish to execute the app on boot, and add the following line:

```shell
@reboot /path/to/startscripts/start-linux.sh start
```

## Troubleshooting

Linux: If you've installed it and `node` as not available but `nodejs` is, than create a symlink:

```shell
$ sudo ln -s $(which nodejs) /usr/bin/node
```
