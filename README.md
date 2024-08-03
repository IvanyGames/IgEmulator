# Warface Server Emulator
Server emulator for older versions of the Warface game, from 04/25/2012 to 06/28/2017.
# Installation and launch
1. Download the emulator [Releases](https://github.com/ivanygames/igemulator/releases).
2. Launching the emulator `MongoDbStart.bat`, `XmppServerTcp.bat`, `ComponentConferenceStart.bat`, `ComponentWFCStart.bat`, `Masterserver(Ru)(1.15000.1392.22400)(pve_001)`, `Masterserver(Ru)(1.15000.1392.22400)(pvp_pro_001).bat`.
3. Generating a token `http://127.0.0.1:8080/settoken?id=1&token=12345&time=120000`.
4. Starting the game `Game.exe -devmode -uid 1 -token 1.15000.1392.22400~12345 +online_server 127.0.0.1 +online_server_port 5222 +online_use_protect 0 +online_check_certificate 0`.
