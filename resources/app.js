'use strict';
<<<<<<< Updated upstream
function send() {
    const paste = document.getElementById("user-paste").innerText
    console.log("User Pasted: " + paste)
}
=======

let ciphertext = CryptoJS.AES.encrypt('my message', 'secret-key').toString();
console.log(ciphertext);

let bytes  = CryptoJS.AES.decrypt(ciphertext, 'secret-key');
let originalText = bytes.toString(CryptoJS.enc.Utf8);
console.log(originalText);
>>>>>>> Stashed changes
