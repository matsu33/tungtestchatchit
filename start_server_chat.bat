@echo off
echo -----------------------
echo 'Stopping node.exe ...'
TASKKILL /F /IM node.exe
echo -----------------------
echo starting chat server
echo -----------------------
cd server 
node index.js
echo -----------------------
pause