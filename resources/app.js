'use strict';

import * as fflate from 'fflate';
import * as CryptoJS from 'crypto-js';
import { base64ToUint8Array, uint8ArrayToBase64 } from 'base64-u8array-arraybuffer';

// cryptoRandomString is async.
import 'regenerator-runtime/runtime';
import cryptoRandomString from 'crypto-random-string';
import hljs from 'highlight.js';

// Paste Elements.
const pasteBox = document.getElementById('user-paste');
const pasteBoxRendered = document.getElementById('user-paste-rendered');
const noteAbovePasteBox = document.getElementById('note-above-paste-box');
// const syntaxHl = document.getElementById("syntax-hl");
const syntaxHl_1 = document.getElementById("syntax");
let pasteTextWithHljs =''
let pasteTextNoHljs 
const copyButton = document.getElementById("user-paste-clipboard");

//hamitems
const serverlessCheck = document.getElementById('serverless')
const expireTime = document.getElementById("expires-time");
const BurnAfterRead = document.getElementById("burnAfterRead");
const Passwd = document.getElementById("Passwd");

let URL = "localhost" //Temp--Public ip address

//If the backend isn't responding then automatically switch to serverless mode.
// function goingServerless(){
//     alert("Backend is down, switching to server-less mode");
//     window.location.hash = "";
//     serverlessCheck.click();
//     serverlessCheck.disabled = true;
// }

// const xhr = new XMLHttpRequest();
// xhr.open("GET", `http://${URL}:3000/api/`);
// xhr.send()
// xhr.onerror = (e)=>{
//     goingServerless()
// }
// xhr.onload = ()=>{
//     let res = xhr.response
//     if(res != 'OK')
//         goingServerless()
// }
//---

//Disabling other features when serverless mode is checked
serverlessCheck.addEventListener('click',()=>{
    if(serverlessCheck.checked)
    {
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
//copying the decrypted paste to the clipboard
copyButton.addEventListener("click", ()=>{
    const text = pasteTextNoHljs;
    let element = document.createElement('textarea');
    document.body.appendChild(element);
    element.value = text;
    element.select();
    document.execCommand('copy');
    document.body.removeChild(element);

    copyButton.innerText = "Copied";
    setTimeout(()=>{
        copyButton.innerText = "Copy";
    },2500)
});


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
    
//Display after the paste is sent
function linkDisplay(encryptedText,passphrase,server,HLJS,pasteText){
    console.log(pasteText)
    let pasteUrl
    if(server)
    {
        pasteUrl = encryptedText+"#"+passphrase+"#server";
    }
    else{
        pasteUrl = encryptedText.concat("#", passphrase);
    }
    noteAbovePasteBox.innerText = "Your paste is: ";
    window.location.hash = pasteUrl;
    
    // Inform user about the Paste.
    let link = document.createElement("a");
    link.setAttribute("href", "./#" + pasteUrl);
    link.innerText = "#" + pasteUrl;
    
    noteAbovePasteBox.appendChild(link);
    displaySuccessNote();
    // Show rendered text.
    //selectbox Highlight
    console.log("Language : ",HLJS);
    pasteTextWithHljs,pasteTextNoHljs = pasteText;
    pasteTextWithHljs = hljs.highlight(pasteText, { language: HLJS }).value;
    console.log("PasteText : ",JSON.stringify(pasteText));
    console.log("pasteTextWithHljs : ", JSON.stringify(pasteTextWithHljs));
    console.log("pasteTextNoHljs : ", pasteTextNoHljs);
        
    pasteBox.style.display = "none";
    pasteBoxRendered.style.display = "";
    pasteBoxRendered.innerHTML = pasteTextWithHljs;
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
    pasteTextWithHljs = paste.text;
    pasteTextNoHljs = paste.text;
    console.log("pasteTextWithHljs", pasteTextWithHljs);
    console.log("pasteTextWithHljs", pasteTextWithHljs);
    return paste
}

function decryptor(encryptedText,passphrase){
    let DencryptedText;
        try {
            // Decrypt the text and parse it to get the paste structure.
            const bytes = CryptoJS.AES.decrypt(encryptedText, passphrase);
            DencryptedText = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
        } catch(err) {
            console.log("Decryption failure.", err);
            noteAbovePasteBox.innerText = "Decryption failure.";
            displayFailureNote();
            return;
        }
    pasteTextWithHljs,pasteTextNoHljs = DencryptedText;
    console.log("After Decryption pasteTextWithHljs : ", pasteTextWithHljs,"After Decryption pasteTextNoHljs : ", pasteTextNoHljs);
    return DencryptedText;
}
function displayUpdate(paste){
    // Update the text.
    pasteTextWithHljs, (pasteTextNoHljs = paste.text);
    pasteTextWithHljs = hljs.highlight(paste.text, { language: paste.syntaxHl }).value;
    console.log("pasteTextWithHljs : ", JSON.stringify(pasteTextWithHljs));
    console.log("pasteTextNoHljs : ", pasteTextNoHljs);

    pasteBox.style.display = 'none';
    pasteBoxRendered.style.display = '';
    pasteBoxRendered.innerHTML = pasteTextWithHljs;
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
    
    // Clone the paste in pasteBox.
    pasteBox.value = pasteTextNoHljs;
    console.log("pasteTextNoHljs in Clone section : ", pasteTextNoHljs);
    // Show textarea.
    pasteBoxRendered.style.display = 'none';
    pasteBox.style.display = '';

    // Hide note.
    noteAbovePasteBox.style.display = 'none';
}

// sendPaste reads data from pasteBox and acts on it.
window.sendPaste = function sendPaste() {
    
    //user-paste
    const passphrase = cryptoRandomString({length: 32, type: 'url-safe'});
    let paste = {
        "text": pasteBox.value,
        "compressed": pasteBox.value.length <= 72 ? false : true,
        "BurnAfterRead": BurnAfterRead.checked,
        "ExpireTime":expireVal(),
        "syntaxHl":syntaxHl_1.value
    };
    console.log(Boolean(pasteTextNoHljs))
    if(pasteTextNoHljs)
    {
        paste.text = pasteTextNoHljs
        console.log("Paste.text = ",paste.text)
    }
    let pasteText = paste.text //temp var
    console.log('Paste before encryption  : ',paste);

    if (paste.compressed) {
        paste.text = compressor(paste.text)
    }
    //---
    if(serverlessCheck.checked)
    {
        let encryptedText = encryptor(paste,passphrase)
        linkDisplay(encryptedText,passphrase)
    }
    else {
        paste.text = encryptor(paste.text,passphrase)
        //Sending Paste to the server
        const xhr = new XMLHttpRequest();
        xhr.open("POST", `http://${URL}:3000/api/store`);
        xhr.setRequestHeader('Content-Type','application/json')
        console.log("Paste after encrpytion : ",paste)
        xhr.send(JSON.stringify(paste))
        xhr.onload = ()=>{
            // console.log('Response from the server: ',xhr.response)
            let Pasteid = xhr.response;
            Pasteid = Pasteid.slice(1,Pasteid.length-1)
            // Passing ObjectID , passphrase ,severMode ,syntax Highlight and pastetext for display to linkDisplay function.
            linkDisplay(Pasteid, passphrase, true, paste.syntaxHl, pasteText);
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
            const xhr = new XMLHttpRequest();
            xhr.open("GET", `http://${URL}:3000/api/GetPaste/${PasteID}`);
            xhr.send();
            xhr.onload = ()=>{
                let paste = JSON.parse(xhr.response)
                if(paste.message)
                {
                    // Update the text.
                        pasteBox.style.display = 'none';
                        pasteBoxRendered.style.display = '';
                        pasteBoxRendered.innerHTML = "(*￣3￣)╭";
                        noteAbovePasteBox.innerText = "Paste not found!"
                        displaySuccessNote();
                }
                else{
                    
                    paste.text = decryptor(paste.text, passphrase);
                    if (paste.compressed) {
                        paste = decompressor(paste);
                        }
                        displayUpdate(paste);
                }
                }
        }
    }
}
initialize();
