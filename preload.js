const { contextBridge, ipcRenderer: r } = require("electron");
const i = (c) => (...a) => r.invoke(c, ...a);
contextBridge.exposeInMainWorld("pasargad", {
  status: i("status"), getCfg: i("cfg:get"), setOpts: i("opts:set"),
  launch: i("launch"), connect: i("connect"), close: i("close"),
  pick: i("pick"), detect: i("detect"),
  cfgList: i("cfg:list"), cfgSave: i("cfg:save"), cfgDel: i("cfg:del"), openCfgDir: i("cfg:open"),
  win: i("win")
});
