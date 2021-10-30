import * as fflate from 'fflate';
const jsscompress = require("js-string-compression");
const lzw = require("node-lzw");
const LZUTF8 = require('lzutf8');
const randomstring = require("randomstring");

const longString = randomstring.generate({length : 2000,charset:"a"});

//fflate compression
const buf = fflate.strToU8(longString);
const t1 = Date.now();
const compressedPaste = fflate.compressSync(buf, { level: 6, mem: 8 });
const t2 = Date.now();
const Tfflate = t2 - t1;
console.log("Time taken for fflate "+ Tfflate + " ms");
console.log("Compression by fflate "+ compressedPaste);

//LZUTF8 compression
const t11 = Date.now();
const compressedPaste1 = LZUTF8.compress(longString)
const t22 = Date.now();
const TLZU = t22 - t11
console.log("Time taken for LZUTF8 "+ TLZU + " ms");
console.log("Compression by LZUTF8 "+ compressedPaste1);
// console.log(buf1)


//Hauffam compression
const t111 = Date.now();
const hm = new jsscompress.Hauffman();
const compressedPaste2 = hm.compress(longString);
const t222= Date.now();
const THauff = t222 - t111;
console.log("Time taken for Hauffman " + THauff + " ms");
console.log(compressedPaste2);
console.log(hm.decompress(compressedPaste2));


//LZW compression
const t1111 = Date.now();
const compressedPaste3 = lzw.encode(longString);
const t2222= Date.now();
const Tlzw = t2222 - t1111;
console.log("Time taken for LWZ " + Tlzw + " ms");
console.log("Compression by LWZ "+ compressedPaste3);

console.log( "Max Time : "+ (Math.max(THauff,TLZU,Tfflate,Tlzw)))
console.log( "Min Time : "+ (Math.min(THauff,TLZU,Tfflate,Tlzw)))



//fflate compression for  n  tests

// let stringLeng = 60000
// let tests =1000
// let sum = 0
// for (let i = 0 ;i<tests;i++)
// {
//     const longString = randomstring.generate({length : stringLeng,charset:"a"});
//     const buf = fflate.strToU8(longString);
//     const t1 = Date.now();
//     const compressedPaste = fflate.compressSync(buf, { level: 6, mem: 8 });
//     // console.log("Compression by FFlate "+ compressedPaste);
//     const t2 = Date.now();
//     const Tfflate = t2 - t1;
//     console.log("T : " + Tfflate)
//     sum += Tfflate    
// }
// console.log("StringLength "+ stringLeng + "\nTest " + tests + "\nsum " + sum)
// console.log("Average Time taken for fflate "+ (sum/tests) + " ms");

//LZW compression for  n  tests

// let stringLeng = 60000
// let tests =1000
// let sum = 0
// for (let i = 0 ;i<tests;i++)
// {
//     const longString = randomstring.generate(stringLeng);
//     const t1 = Date.now();
//     const compressedPaste3 = lzw.encode(longString);
//     // console.log("Compression by FFlate "+ compressedPaste);
//     const t2 = Date.now();
//     const Tlzw = t2 - t1;
//     // console.log("T : " + Tlzw)
//     sum += Tlzw    
// }
// console.log("StringLength "+ stringLeng + "\nTest " + tests + "\nsum " + sum)
// console.log("Average Time taken for LWZ "+ (sum/tests) + " ms");

