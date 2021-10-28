'use strict';

import * as fflate from 'fflate';
import * as CryptoJS from 'crypto-js';

// cryptoRandomString is async.
import 'regenerator-runtime/runtime';
import cryptoRandomString from 'crypto-random-string';

window.sendPaste = function sendPaste() {
    const passphrase = cryptoRandomString({length: 64, type: 'url-safe'});
    console.log("passphrase", passphrase);

    const paste = document.getElementById("user-paste").innerText;
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

    // Get originalText by converting the decrypted string to Array.
    // Then we convert the strings in Array to Number with map, then
    // convert it to Uint8Array.
    const bytes  = CryptoJS.AES.decrypt(encryptedText, passphrase);
    const originalText = Uint8Array.from(
        bytes.toString(CryptoJS.enc.Utf8).split(',').map(Number)
    );
    console.log("Decrypted", originalText);

    const decompressed = fflate.decompressSync(originalText);
    const outPaste = fflate.strFromU8(decompressed);
    console.log("Decompressed", outPaste);
}
