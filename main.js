const {app,BrowserWindow}=require("electron");

function create(){

let win=new BrowserWindow({

width:1000,
height:700,

webPreferences:{
nodeIntegration:true
}

});

win.loadFile("index.html");

}

app.whenReady().then(create);