# Warface Server Emulator
Server emulator for Warface build 1.22400.5519.45100. (20DEV)

### Download latest release from [Releases](https://github.com/n1kodim/IgEmulator/releases).
## Quick start:
1. Start the server:
* `MongoDbStart.bat`
* `XmppServerTcp.bat`
* `ComponentConferenceStart.bat`
* `ComponentWFCStart.bat`
* `Masterserver(pve_001)`
* `Masterserver(pvp_pro_001).bat`.

> [!NOTE]
> Accounts with login `1` and `2` are created by default.
> `XmppServerTcp\config.js` -> localAccounts

- Generate a token (temporary password for account) with web browser. For example, with login `1`, password `1`:
```
http://127.0.0.1:8080/settoken?id=1&token=1&time=120000
```

- Edit or create `online.cfg` in root game folder. For example to `localhost`:
```
online_host = warface
online_server = 127.0.0.1
```

- Start the game `Bin64\Game.exe`.

