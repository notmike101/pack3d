/**
 * Licensed Materials - Property of Michael Orozco
 * (C) Copyright Michael Orozco 2022
 */


import fs from 'fs'
import { ipcRenderer } from 'electron'

// Usage of ipcRenderer.on
ipcRenderer.on('main-process-message', (_event, ...args) => {
  console.log('[Receive Main-process message]:', ...args)
})

fs.lstat(process.cwd(), (err, stats) => {
  if (err) {
    console.log(err)
  } else {
    console.log('[fs.lstat]', stats)
  }
})
