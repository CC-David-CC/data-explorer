// Inspect the CSV produced by DuckDB without changing its values. This catches
// common spreadsheet formula prefixes; it is not a complete CSV security test.
export function hasFormulaLikeCSV(bytes){
 const numeric=/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/;let prefix='',truncated=false,quoted=false,start=true,leading=true,candidate=false,first=true;
 const add=byte=>{if(first&&[9,10,13].includes(byte))candidate=true;first=false;if(leading&&![9,10,13,32].includes(byte)){leading=false;if([61,43,64,45].includes(byte))candidate=true;}if(prefix.length<256)prefix+=String.fromCharCode(byte);else truncated=true;};
 const risky=()=>candidate&&(truncated||!numeric.test(prefix));
 for(let i=0;i<bytes.length;i++){
  const byte=bytes[i];if(quoted){if(byte===34){if(bytes[i+1]===34){add(34);i++;}else quoted=false;}else add(byte);continue;}
  if(start&&byte===34){quoted=true;start=false;continue;}
  if(byte===44||byte===10||byte===13){if(risky())return true;prefix='';truncated=false;start=true;leading=true;candidate=false;first=true;if(byte===13&&bytes[i+1]===10)i++;continue;}
  add(byte);start=false;
 }
 return risky();
}
