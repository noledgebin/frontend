'use strict';
import lzwCompress from 'lzwcompress';
function send() {
  const paste = document.getElementById("user-paste").innerText;
  console.log(paste);
  
  const compressedPaste = lzwCompress.pack(paste);
  // const original = lzwCompress.unpack(compressedPaste);
  const ciphertext = CryptoJS.AES.encrypt(compressedPaste, 'secret-key').toString();
  console.log(ciphertext);
  
  // console.log(original);
  let bytes  = CryptoJS.AES.decrypt(ciphertext, 'secret-key');
  let originalText = bytes.toString(CryptoJS.enc.Utf8);
  console.log(originalText);
}
