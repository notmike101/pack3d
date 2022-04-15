import { domReady } from './utils'
import { useLoading } from './loading'
import { contextBridge, ipcRenderer } from 'electron';
import path from 'path';

const { appendLoading, removeLoading } = useLoading()
window.removeLoading = removeLoading;

domReady().then(appendLoading)
