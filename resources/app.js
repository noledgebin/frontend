'use strict';

import * as fflate from 'fflate';
import * as CryptoJS from 'crypto-js';
import { base64ToUint8Array, uint8ArrayToBase64 } from 'base64-u8array-arraybuffer';

// cryptoRandomString is async.
import 'regenerator-runtime/runtime';
import cryptoRandomString from 'crypto-random-string';
import hljs from 'highlight.js';

//text highlighter 
// hljs = require("highlight.js");
// hljs.highlightAuto("<h1>Hello World!</h1>").value;

// Paste Elements.
const pasteBox = document.getElementById('user-paste');
const pasteBoxRendered = document.getElementById('user-paste-rendered');
const noteAbovePasteBox = document.getElementById('note-above-paste-box');
const syntaxHl = document.getElementById("syntax-hl");
let pasteText =''

//hamitems
const serverlessCheck = document.getElementById('serverless')
const expireTime = document.getElementById("expires-time");
const BurnAfterRead = document.getElementById("burnAfterRead");
const Passwd = document.getElementById("Passwd");

let URL = "localhost" //Temp

//If the backend isn't responding then automatically switch to serverless mode.
function goingServerless(){
    alert("Backend is down, switching to server-less mode");
    window.location.hash = "";
    serverlessCheck.click();
    serverlessCheck.disabled = true;
}

const xhr = new XMLHttpRequest();
xhr.open("GET", `http://${URL}:3000/api/`);
xhr.send()
xhr.onerror = (e)=>{
    goingServerless()
}
xhr.onload = ()=>{
    let res = xhr.response
    console.log(res)
    if(res != 'OK')
        goingServerless()
}
//---

//Disabling other features when serverless mode is checked
serverlessCheck.addEventListener('click',()=>{
    if(serverlessCheck.checked)
    {
        console.log(serverlessCheck.checked)
        expireTime.value = 'never';
        BurnAfterRead.checked = false;
        Passwd.checked = false;
        expireTime.disabled = true;
        BurnAfterRead.disabled = true;
        Passwd.disabled = true
    }
    else{
        expireTime.disabled = false;
        BurnAfterRead.disabled = false;
        Passwd.disabled = false
        
    }
    console.log(expireTime.value)
})

//Disabling Expiry Time when BurnAfterRead is checked.
BurnAfterRead.addEventListener('click',()=>{
    if(BurnAfterRead.checked)
    {
        expireTime.value = 'never';
        expireTime.disabled = true;
    }
    else{
        expireTime.disabled = false;
    }
})
// Calculating the expiry time.
function expireVal(){
    switch(expireTime.value){
        case "never":
            return false;
        case "5min":
            return (5*60)
        case "10min":
            return (10*60)
        case "1hr":
            return (60*60)
        case "1day":
            return (24*60*60)
        case "1week":
            return (7*24*60*60)
        case "1mon":
            return (30*24*60*60)
        case "1yr":
            return (365*24*60*60)
    }
}

function displaySuccessNote() {
    noteAbovePasteBox.classList.add("success");
    noteAbovePasteBox.classList.remove("failure");
    noteAbovePasteBox.style.display = '';
}

function displayFailureNote() {
    noteAbovePasteBox.classList.add("failure");
    noteAbovePasteBox.classList.remove("success");
    noteAbovePasteBox.style.display = '';
}

function compressor(Content){
    try {
            const buf = fflate.strToU8(Content);

            // Increasing mem may increase performance at the cost of
            // memory. The mem ranges from 0 to 12, where 4 is the
            // default.
            //
            // Convert the compressed paste to string before storing
            // it. Later we're stringifying this object, if we don't
            // convert it to string here then JSON.stringify will
            // preserve the Array structure, using much more space.
            Content = uint8ArrayToBase64(
                fflate.compressSync(buf, { level: 6, mem: 8 })
            );
        } catch(err) {
            console.log("Decompression failed, turning off.", err);
            Content.text = pasteBox.innerText;
            Content.compressed = false;
        }
    console.log("Compressed Paste : ", Content)
    return Content
}

function encryptor(Content,passphrase){
    let encryptedText;
        try {
            // Convert paste to string before encrypting it.
            encryptedText = CryptoJS.AES.encrypt(
                JSON.stringify(Content), passphrase
            ).toString();
        } catch(err) {
            console.log("Cannot recover from Encryption failure.", err);
            noteAbovePasteBox.innerText = "Encryption failed.";
            displayFailureNote();
            return;
        }
        return encryptedText
    }
    
function linkDisplay(encryptedText,passphrase,server){
    console.log(server)
    let pasteUrl
    if(server)
    {
        pasteUrl = encryptedText+"#"+passphrase+"#server";
    }
    else{
        pasteUrl = encryptedText.concat("#", passphrase);
    }
    console.log(pasteUrl); //T
    console.log(encryptedText); //T
    noteAbovePasteBox.innerText = "Your paste is: ";
    window.location.hash = pasteUrl;
    
    // Inform user about the Paste.
    let link = document.createElement("a");
    link.setAttribute("href", "./#" + pasteUrl);
    link.innerText = "#" + pasteUrl;
    
    noteAbovePasteBox.appendChild(link);
    console.log(link);
    displaySuccessNote();
    
    // Show rendered text.
    
    if(syntaxHl.checked)
    {
        console.log("syntaxHl ",syntaxHl.value)
        pasteBox.value = hljs.highlightAuto(pasteBox.value).value;
    }
    pasteBox.style.display = "none";
    pasteBoxRendered.style.display = "";
    pasteBoxRendered.innerHTML = pasteBox.value;
}
function decompressor(paste){
    try {
            // Get the original Uint8Array generated by fflate by
            // converting paste.text to Array. It was converted to
            // string so the Array structure was not preserved.
            const decompressed = fflate.decompressSync(
                base64ToUint8Array(paste.text)
            );

            // Store decompressed text.
            paste.text = fflate.strFromU8(decompressed);
            } catch(err) {
            console.log("Decompression failure.", err);
            noteAbovePasteBox.innerText = "Decompression failure.";
            displayFailureNote();
            return;
            }
    pasteText = paste.text
    return paste
}

function decryptor(encryptedText,passphrase){
    let DencryptedText;
        try {
            // Decrypt the text and parse it to get the paste structure.
            const bytes = CryptoJS.AES.decrypt(encryptedText, passphrase);
            DencryptedText = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
            console.log("Paste : ", DencryptedText);
            console.log('Bytes : ',bytes)
        } catch(err) {
            console.log("Decryption failure.", err);
            noteAbovePasteBox.innerText = "Decryption failure.";
            displayFailureNote();
            return;
        }
    return DencryptedText;
}
function displayUpdate(paste){
    // Update the text.
    console.log("pasteText for clone feature",pasteText)
    if(paste.syntaxHl)
    {
        paste.text = hljs.highlightAuto(paste.text).value;
    }
    pasteBox.style.display = 'none';
    pasteBoxRendered.style.display = '';
    pasteBoxRendered.innerHTML = paste.text;
    // Inform user about the paste.
    noteAbovePasteBox.innerText = "Paste successfully decrypted.";
    displaySuccessNote();
}


window.newPaste = function newPaste() {
    // Remove fragment url.
    window.location.hash = '';

    // Reload.
    window.location.reload();
}

window.clonePaste = function clonePaste() {
    // Remove fragment url.
    window.location.hash = '';
    console.log("In clone function : ",pasteText)
    // Clone the paste in pasteBox.
    pasteBox.value = pasteText;

    // Show textarea.
    pasteBoxRendered.style.display = 'none';
    pasteBox.style.display = '';

    // Hide note.
    noteAbovePasteBox.style.display = 'none';
}

// sendPaste reads data from pasteBox and acts on it.
window.sendPaste = function sendPaste() {
    const passphrase = cryptoRandomString({length: 32, type: 'url-safe'});
    let paste = {
        "text": pasteBox.value,
        "compressed": pasteBox.value.length <= 72 ? false : true,
        "BurnAfterRead": BurnAfterRead.checked,
        "ExpireTime":expireVal(),
        "syntaxHl":syntaxHl.checked
    };
    pasteText = paste.text;
    console.log(paste)
    if (paste.compressed) {
        paste.text = compressor(paste.text)
        // console.log("Compressed Paste :",paste.text)
    }

    if(serverlessCheck.checked)
    {
        let encryptedText = encryptor(paste,passphrase)
        linkDisplay(encryptedText,passphrase)
    }
    else {
        paste.text = encryptor(paste.text,passphrase)
        console.log("encrypted Paste : ",paste)
        //Sending Paste to the server
        const xhr = new XMLHttpRequest();
        xhr.open("POST", `http://${URL}:3000/api/store`);
        xhr.setRequestHeader('Content-Type','application/json')
        xhr.send(JSON.stringify(paste))
        xhr.onload = ()=>{
            let Pasteid = xhr.response;
            Pasteid = Pasteid.slice(1,Pasteid.length-1)
            console.log("PasteID",Pasteid) //T
            // Passing ObjectID and passphrase to linkDisplay function.
            linkDisplay(Pasteid,passphrase,true)
        }
        
    }
    
}

function initialize() {
    // Clean the pasteBox.
    pasteBox.value = '';

    const fragment = window.location.hash.substr(1).split('#');
    // Paste & Encryption key in fragment URL.
    if (fragment.length === 2) {
        const encryptedText = fragment[0];
        const passphrase = fragment[1];
        let paste = decryptor(encryptedText,passphrase)
        console.log("Decrypted Paste: ",paste)

        if (paste.compressed) {
            paste = decompressor(paste)
        }
        displayUpdate(paste);
    }
    else if (fragment.length === 3){
        if (fragment[2] == "server")
        {
            const passphrase = fragment[1];
            const PasteID = fragment[0];
            console.log(PasteID)
            const xhr = new XMLHttpRequest();
            xhr.open("GET", `http://${URL}:3000/api/GetPaste/${PasteID}`);
            xhr.send();
            xhr.onload = ()=>{
                let paste = JSON.parse(xhr.response)
                console.log(paste);
                if(paste.message)
                {
                    // Update the text.
                        pasteBox.style.display = 'none';
                        pasteBoxRendered.style.display = '';
                        pasteBoxRendered.innerHTML = "😅";
                        noteAbovePasteBox.innerText = "Paste not found!"
                        displaySuccessNote();
                }
                else{
                    
                    paste.text = decryptor(paste.text, passphrase);
                    console.log("Paste Text : ",paste.text)
                    //Have to create pasteCompressedFunction 
                    if (paste.compressed) {
                        paste = decompressor(paste);
                        console.log("Paste Text after decompression: ",paste.text)
                        }
                        displayUpdate(paste);
                }
                }
        }
    }
}
initialize();
