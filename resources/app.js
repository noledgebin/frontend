'use strict';

import * as fflate from 'fflate';
import * as CryptoJS from 'crypto-js';
import {base64ToUint8Array, uint8ArrayToBase64} from 'base64-u8array-arraybuffer';
// cryptoRandomString is async.
import 'regenerator-runtime/runtime';
import cryptoRandomString from 'crypto-random-string';
import {env} from './env.js'

// Paste Elements.
const pasteBox = document.getElementById('user-paste');
const pasteBoxRendered = document.getElementById('user-paste-rendered');
const noteAbovePasteBox = document.getElementById('note-above-paste-box');

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

/**
 * Displays the paste and url for the paste to the user
 *
 * @param id is the id to the paste. Appended to the URL as route
 * @param deleteId is the deleteId for the paste. Not in use yet
 * @param passphrase is the decryption key to the paste. Appended to the URL as fragment identifier
 */
function displaySuccessNoteAfterPost(id, deleteId, passphrase) {
    // Add encryptedText and passphrase to fragment url.
    const pasteUrl = id.concat('#', passphrase);
    noteAbovePasteBox.innerText = "Your paste is: ";

    // Update the URL to /pasteUrl#passphrase.
    window.history.pushState("NoledgeBin", "NoledgeBin", `/${pasteUrl}`);

    // Inform user about the Paste.
    let link = document.createElement('a');
    link.setAttribute('href', './' + pasteUrl);
    link.innerText = '/' + pasteUrl;

    noteAbovePasteBox.appendChild(link);
    displaySuccessNote();

    // Show rendered text.
    pasteBox.style.display = 'none';
    pasteBoxRendered.style.display = '';
    pasteBoxRendered.innerHTML = pasteBox.value;
}

window.newPaste = function newPaste() {
    // Remove fragment url.
    window.location.hash = '';
    // Changing route to root this also reloads the page
    window.location = "/";

    // Reload.
    // window.location.reload();
}

window.clonePaste = function clonePaste() {
    // Remove fragment url.
    window.location.hash = '';

    // Update the URL to root.
    window.history.pushState("NoledgeBin", "NoledgeBin", `/`);

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
        "compressed": pasteBox.value.length <= 72 ? false : true
    };

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
                fflate.compressSync(buf, {level: 6, mem: 8})
            );
        } catch (err) {
            console.log("Decompression failed, turning off.", err);
            paste.text = pasteBox.innerText;
            paste.compressed = false;
        }
    }

    let encryptedText;
    try {
        // Convert paste to string before encrypting it.
        encryptedText = CryptoJS.AES.encrypt(
            JSON.stringify(paste), passphrase
        ).toString();
    } catch (err) {
        console.log("Cannot recover from Encryption failure.", err);
        noteAbovePasteBox.innerText = "Encryption failed.";
        displayFailureNote();
        return;
    }

    if (frontendOnly) {
        // Add encryptedText and passphrase to fragment url.
        const pasteUrl = encryptedText.concat('#', passphrase);
        noteAbovePasteBox.innerText = "Your paste is: ";

        // Update the URL.
        window.location.hash = pasteUrl;

        // Inform user about the Paste.
        let link = document.createElement('a');
        link.setAttribute('href', './#' + pasteUrl);
        link.innerText = '#' + pasteUrl;

        noteAbovePasteBox.appendChild(link);
        displaySuccessNote();

        // Show rendered text.
        pasteBox.style.display = 'none';
        pasteBoxRendered.style.display = '';
        pasteBoxRendered.innerHTML = pasteBox.value;
    } else {
        sendPostRequest(encryptedText, passphrase);
    }
}

/**
 * Decrypts and displays the paste
 *
 * @param {string} encryptedText holds the encrypted message
 * @param {string} passphrase is the decryption key
 */
function displayPaste(encryptedText, passphrase) {
    let paste;
    try {
        // Decrypt the text and parse it to get the paste structure.
        const bytes = CryptoJS.AES.decrypt(encryptedText, passphrase);
        paste = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
    } catch (err) {
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
        } catch (err) {
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

/**
 * Sends get request to the server
 *
 * @param id is the id of the paste we want to retrieve
 * @param passphrase is the encryption key for the paste
 */
function getPaste(id, passphrase) {
    const xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function () {
        if (xmlHttp.readyState === 4 && xmlHttp.status === 200) {
            // Creating a object with the received stringifyed JSON
            const json = JSON.parse(xmlHttp.responseText)
            displayPaste(json.paste, passphrase);
        }
    }
    xmlHttp.open("GET", `${serverURL}${id}`, true);
    xmlHttp.send(null);
}

/**
 * Sends a post request to the server with the following parameters
 *
 * @param {string} encryptedText is the encrypted paste JSON
 * @param {Number} expiry determines when the paste will be deleted from the server. 0 indicates it will never be deleted
 * @param {Boolean} burnAfterRead determines if the paste should be deleted after being read once
 *
 * @param {string} passphrase is the encryption key to the paste. This is not sent in the post request
 */
function sendPostRequest(encryptedText, passphrase, expiry = 0, burnAfterRead = false) {
    const xmlHttp = new XMLHttpRequest();
    const url = serverURL;
    // Creating object with parametes
    const postObject = {
        paste: encryptedText,
        expiry: expiry,
        burnAfterRead: burnAfterRead
    }
    // Creating URLEncoded text with the JSON object
    const postObjectURLEncoded = new URLSearchParams(postObject).toString();
    xmlHttp.open('POST', `${url}`, true);

    //Send the proper header information along with the request
    xmlHttp.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');

    // Call a function when the state changes.
    xmlHttp.onreadystatechange = function () {
        if (xmlHttp.readyState === 4 && xmlHttp.status === 200) {
            // Creating a object with the returned text
            // This object has two attributes:
            // 1. id
            // 2. deleteId
            let pasteObject = JSON.parse(xmlHttp.responseText)

            // Displaying URL and paste to user
            displaySuccessNoteAfterPost(pasteObject.id, pasteObject.deleteId, passphrase)
        }
    }
    // Sending post request
    xmlHttp.send(postObjectURLEncoded);
}

function initialize() {
    // Clean the pasteBox.
    pasteBox.value = '';

    const fragment = window.location.hash.substr(1).split('#');
    if (frontendOnly) {
        // Paste & Encryption key in fragment URL.
        if (fragment.length === 2) {
            const encryptedText = fragment[0];
            const passphrase = fragment[1];

            displayPaste(encryptedText, passphrase)
        }
    } else {
        const route = window.location.pathname.substr(1).split('/');
        if (route.length === 1 && route[0] !== '' && fragment.length === 1) {
            const id = route[0];
            const passphrase = fragment[0];
            console.log(id)
            console.log(passphrase)
            getPaste(id, passphrase);
        }
    }
}

// Determines if the app is frontend only
const frontendOnly = false
// Server url if the app has a backend
const serverURL = env.serverUrl

initialize();
