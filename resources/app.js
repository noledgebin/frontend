'use strict';

import * as fflate from 'fflate';
import * as CryptoJS from 'crypto-js';
import { base64ToUint8Array, uint8ArrayToBase64 } from 'base64-u8array-arraybuffer';

// cryptoRandomString is async.
import 'regenerator-runtime/runtime';
import cryptoRandomString from 'crypto-random-string';

// Paste Elements.
const pasteBox = document.getElementById('user-paste');
const pasteBoxRendered = document.getElementById('user-paste-rendered');
const noteAbovePasteBox = document.getElementById('note-above-paste-box');

//hamitems
const serverlessCheck = document.getElementById('serverless')
const expireTime = document.getElementById("expires-time");
const BurnAfterRead = document.getElementById("burnAfterRead");
const Passwd = document.getElementById("Passwd");

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
//--------
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
    pasteBox.value = pasteBoxRendered.innerHTML;

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
        "ExpireTime":expireVal()
    };
    console.log(paste)
    if (paste.compressed) {
        try {
            const buf = fflate.strToU8(paste.text);

            // Increasing mem may increase performance at the cost of
            // memory. The mem ranges from 0 to 12, where 4 is the
            // default.
            //
            // Convert the compressed paste to string before storing
            // it. Later we're stringifying this object, if we don't
            // convert it to string here then JSON.stringify will
            // preserve the Array structure, using much more space.
            paste.text = uint8ArrayToBase64(
                fflate.compressSync(buf, { level: 6, mem: 8 })
            );
        } catch(err) {
            console.log("Decompression failed, turning off.", err);
            paste.text = pasteBox.innerText;
            paste.compressed = false;
        }
    }

    let Pasteid = ""
    let link = document.createElement("a");
    console.log(paste)
    
    console.log(paste)
    if(serverlessCheck.checked)
    {
        let encryptedText;
        try {
            // Convert paste to string before encrypting it.
            encryptedText = CryptoJS.AES.encrypt(
                JSON.stringify(paste), passphrase
            ).toString();
        } catch(err) {
            console.log("Cannot recover from Encryption failure.", err);
            noteAbovePasteBox.innerText = "Encryption failed.";
            displayFailureNote();
            return;
        }
        const pasteUrl = encryptedText.concat('#', passphrase);
        console.log(pasteUrl)
        console.log((encryptedText))
        noteAbovePasteBox.innerText = "Your paste is: ";
        window.location.hash = pasteUrl;
        
        // Inform user about the Paste.
        link.setAttribute("href", "./#" + pasteUrl);
        link.innerText = "#" + pasteUrl;

        noteAbovePasteBox.appendChild(link);
        console.log(link);
        displaySuccessNote();

        // Show rendered text.
        pasteBox.style.display = "none";
        pasteBoxRendered.style.display = "";
        pasteBoxRendered.innerHTML = pasteBox.value;
        
    }
    else {
        try {
            // Convert paste to string before encrypting it.
            paste.text = CryptoJS.AES.encrypt(
                JSON.stringify(paste.text), passphrase
            ).toString();
        } catch(err) {
            console.log("Cannot recover from Encryption failure.", err);
            noteAbovePasteBox.innerText = "Encryption failed.";
            displayFailureNote();
            return;
        }
        //Sending Paste to the server
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "http://18.116.44.211:3000/api/store");
        xhr.setRequestHeader('Content-Type','application/json')
        xhr.send(JSON.stringify(paste))
        xhr.onload = ()=>{
            Pasteid = xhr.response;
            Pasteid = Pasteid.slice(1,Pasteid.length-1)
            console.log("PasteID",Pasteid)

            // Add ObjectID and passphrase to fragment url.
            const pasteUrl = Pasteid+'#'+passphrase+'#server';
            console.log("PasteUrl",pasteUrl)
            noteAbovePasteBox.innerText = "Your paste is: ";
        
            // Update the URL.
            window.location.hash = pasteUrl;
            
            // Inform user about the Paste.
            link.setAttribute("href", "./#" + pasteUrl);
            link.innerText = "#" + pasteUrl;

            noteAbovePasteBox.appendChild(link);
            console.log(link);
            displaySuccessNote();

            // Show rendered text.
            pasteBox.style.display = "none";
            pasteBoxRendered.style.display = "";
            pasteBoxRendered.innerHTML = pasteBox.value;
        }
        
    }
    
    
}

function initialize() {
    // Clean the pasteBox.
    pasteBox.value = '';

    const fragment = window.location.hash.substr(1).split('#');
    console.log(typeof(fragment))//T
    console.log((fragment))//T
    // Paste & Encryption key in fragment URL.
    if (fragment.length === 2) {
        const encryptedText = fragment[0];
        const passphrase = fragment[1];

        let paste;
        try {
            // Decrypt the text and parse it to get the paste structure.
            const bytes = CryptoJS.AES.decrypt(encryptedText, passphrase);
            paste = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
            console.log('Paste : ',paste)
            console.log('Bytes : ',bytes)
        } catch(err) {
            console.log("Decryption failure.", err);
            noteAbovePasteBox.innerText = "Decryption failure.";
            displayFailureNote();
            return;
        }

        if (paste.compressed) {
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
        }

        // Update the text.
        pasteBox.style.display = 'none';
        pasteBoxRendered.style.display = '';
        pasteBoxRendered.innerHTML = paste.text;

        // Inform user about the paste.
        noteAbovePasteBox.innerText = "Paste successfully decrypted.";
        displaySuccessNote();
    }
    else if (fragment.length === 3){
        if (fragment[2] == "server")
        {
            const passphrase = fragment[1];
            const PasteID = fragment[0];
            console.log(PasteID)
            const xhr = new XMLHttpRequest();
            xhr.open("GET", `http://18.116.44.211:3000/api/GetPaste/${PasteID}`);
            xhr.send();
            xhr.onload = ()=>{
                const Paste = JSON.parse(xhr.response)
                console.log(Paste)
                if(Paste.message)
                {
                    // Update the text.
                        pasteBox.style.display = 'none';
                        pasteBoxRendered.style.display = '';
                        pasteBoxRendered.innerHTML = "😅";
                        noteAbovePasteBox.innerText = "Paste not found!"
                        displaySuccessNote();
                }
                else{

                    try {
                        // Decrypt the text and parse it to get the paste structure.
                        const bytes = CryptoJS.AES.decrypt(Paste.PasteMsg, passphrase);
                        Paste.PasteMsg = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
                    } catch(err) {
                        console.log("Decryption failure.", err);
                        noteAbovePasteBox.innerText = "Decryption failure.";
                        displayFailureNote();
                        return;
                    }
                    //Have to create pasteCompressedFunction 
                    if (Paste.compressed) {
                        try {
                            // Get the original Uint8Array generated by fflate by
                            // converting paste.text to Array. It was converted to
                            // string so the Array structure was not preserved.
                            const decompressed = fflate.decompressSync(
                                base64ToUint8Array(Paste.PasteMsg)
                                );
                                
                                // Store decompressed text.
                                Paste.PasteMsg = fflate.strFromU8(decompressed);
                            } catch(err) {
                                console.log("Decompression failure.", err);
                                noteAbovePasteBox.innerText = "Decompression failure.";
                                displayFailureNote();
                                return;
                            }
                        }
                        // Update the text.
                        pasteBox.style.display = 'none';
                        pasteBoxRendered.style.display = '';
                        pasteBoxRendered.innerHTML = Paste.PasteMsg;
                    
                        // Inform user about the paste.
                        noteAbovePasteBox.innerText = "Paste successfully decrypted.";
                        displaySuccessNote();
                }
                }
        }
    }
}
initialize();
