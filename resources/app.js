'use strict';

import * as fflate from 'fflate';
import * as CryptoJS from 'crypto-js';

// cryptoRandomString is async.
import 'regenerator-runtime/runtime';
import cryptoRandomString from 'crypto-random-string';

// Paste Elements /////////////////////////////////////////////////////////////
const pasteBox = document.getElementById('user-paste');

const pasteSendButton = document.getElementById('paste-send-button');
const pasteNewButton = document.getElementById('paste-new-button');

const noteAbovePasteBox = document.getElementById('note-above-paste-box');

window.newPaste = function newPaste() {
    // Remove fragment url.
    window.location.hash = '';

    // Reload.
    window.location.reload();
}

window.sendPaste = function sendPaste() {
    const passphrase = cryptoRandomString({length: 32, type: 'url-safe'});
    console.log("passphrase", passphrase);

    const paste = pasteBox.innerText;
    console.log("Paste", paste);

    // Increasing mem may increase performance at the cost of memory.
    // The mem ranges from 0 to 12, where 4 is the default.
    const buf = fflate.strToU8(paste);
    const compressedPaste = fflate.compressSync(buf, { level: 6, mem: 8 });
    console.log("Compressed", compressedPaste);

    // Convert compressedPaste to string before encrypting it.
    const encryptedText = CryptoJS.AES.encrypt(
        compressedPaste.toString(), passphrase
    ).toString();
    console.log("Encrypted", encryptedText);

    // Add encryptedText and passphrase to fragment url.
    const pasteUrl = encryptedText.concat('#', passphrase);
    noteAbovePasteBox.innerText = "Your paste is: ";

    let link = document.createElement('a');
    link.setAttribute('href', './#' + pasteUrl);
    link.innerText = '#' + pasteUrl;
    noteAbovePasteBox.appendChild(link);

    noteAbovePasteBox.classList.remove("failure", "hidden");
    noteAbovePasteBox.classList.add("success");

    pasteBox.setAttribute('contenteditable', false);

    pasteSendButton.classList.add("hidden");
    pasteNewButton.classList.remove("hidden");
}

function initialize() {
    const fragment = window.location.hash.substr(1).split('#');

    if (fragment.length === 2) {
        const encryptedText = fragment[0];
        const passphrase = fragment[1];

        // Get originalText by converting the decrypted string to Array.
        // Then we convert the strings in Array to Number with map, then
        // convert it to Uint8Array.
        const bytes = CryptoJS.AES.decrypt(encryptedText, passphrase);
        const originalText = Uint8Array.from(
            bytes.toString(CryptoJS.enc.Utf8).split(',').map(Number)
        );
        console.log("Decrypted", originalText);

        const decompressed = fflate.decompressSync(originalText);
        const outPaste = fflate.strFromU8(decompressed);
        console.log("Decompressed", outPaste);

        pasteBox.innerText = outPaste;

        noteAbovePasteBox.innerText = "Paste successfully decrypted.";
        noteAbovePasteBox.classList.remove("failure", "hidden");
        noteAbovePasteBox.classList.add("success");

        pasteNewButton.classList.remove("hidden");
    } else {
        pasteBox.setAttribute('contenteditable', true);
        pasteSendButton.classList.remove("hidden");
    }
}
initialize();
