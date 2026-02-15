const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  invoke: (channel, data) => {
    // Whitelist channels
    const validChannels = ['get-bookmarks', 'create-bookmark', 'update-bookmark', 'delete-bookmark'];
    if (validChannels.includes(channel)) {
      return ipcRenderer.invoke(channel, data);
    }
    return Promise.reject(new Error('Invalid IPC channel'));
  }
});
