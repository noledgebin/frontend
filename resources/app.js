'use strict';

import * as CryptoJS from 'crypto-js';

window.send = function send() {
    const paste = document.getElementById("user-paste").innerText;
    console.log(paste);

    const ciphertext = CryptoJS.AES.encrypt(paste, 'secret-key').toString();
    console.log(ciphertext);

    let bytes  = CryptoJS.AES.decrypt(ciphertext, 'secret-key');
    let originalText = bytes.toString(CryptoJS.enc.Utf8);
    console.log(originalText);
}
