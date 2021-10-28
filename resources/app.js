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

    let paste = {
        "text": pasteBox.innerText,
        "compressed": pasteBox.innerText.length <= 72 ? false : true
    };
    console.log("Paste", paste);

    if (paste.compressed) {
        // Increasing mem may increase performance at the cost of memory.
        // The mem ranges from 0 to 12, where 4 is the default.
        const buf = fflate.strToU8(paste);
        paste.text = fflate.compressSync(buf, { level: 6, mem: 8 });
    }

    // Convert compressedPaste to string before encrypting it.
    const encryptedText = CryptoJS.AES.encrypt(
        JSON.stringify(paste), passphrase
    ).toString();
    console.log("Encrypted", encryptedText);

    // Add encryptedText and passphrase to fragment url.
    const pasteUrl = encryptedText.concat('#', passphrase);
    noteAbovePasteBox.innerText = "Your paste is: ";

    window.location.hash = pasteUrl;

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

        const bytes = CryptoJS.AES.decrypt(encryptedText, passphrase);
        let paste = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));

        if (paste.compressed) {
            // Get originalText by converting the decrypted string to
            // Array. Then we convert the strings in Array to Number
            // with map, then convert it to Uint8Array.
            const originalText = Uint8Array.from(
                bytes.toString(CryptoJS.enc.Utf8).split(',').map(Number)
            );
            const decompressed = fflate.decompressSync(originalText);
            paste.text = fflate.strFromU8(decompressed);
        }

        pasteBox.innerText = paste.text;

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
