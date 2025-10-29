<script lang="ts" setup>
const {app, BrowserWindow, ipcMain} = require('electron')

const path = require('node:path')

// ...

function handleSetTitle(event, title) {
    const webContents = event.sender
    const win = BrowserWindow.fromWebContents(webContents)
    win.setTitle(title)
}

function createWindow() {
    const mainWindow = new BrowserWindow({
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
        }
    })
    mainWindow.loadFile('index.html')
}

app.whenReady().then(() => {
    ipcMain.on('set-title', handleSetTitle)
    createWindow()
})
</script>

<template>

</template>

<style scoped>

</style>