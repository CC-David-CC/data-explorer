// Only one statement may be embedded into the result-table query. Semicolons
// in strings, quoted identifiers, and comments are data, not separators.
export function singleSelect(value){
 const text=value.trim();let terminator=-1;
 if(text.length>100000||!/^(select|with)\b/i.test(text))throw Error('Enter a SELECT query.');
 for(let i=0;i<text.length;i++){
  const ch=text[i],next=text[i+1];
  if(ch==='-'&&next==='-'){i+=2;while(i<text.length&&text[i]!=='\n'&&text[i]!=='\r')i++;continue;}
  if(ch==='/'&&next==='*'){let depth=1;i+=2;while(i<text.length&&depth){if(text[i]==='/'&&text[i+1]==='*'){depth++;i+=2;}else if(text[i]==='*'&&text[i+1]==='/'){depth--;i+=2;}else i++;}if(depth)throw Error('Unclosed SQL comment.');i--;continue;}
  if(terminator!==-1){if(!/\s/.test(ch))throw Error('Enter only one SELECT query.');continue;}
  if(ch===';'){terminator=i;continue;}
  if(ch==='\''||ch==='"'){
   const escape=ch==='\''&&i>0&&/[eE]/.test(text[i-1])&&(i<2||!/[a-zA-Z0-9_$]/.test(text[i-2]));let closed=false;
   for(i++;i<text.length;i++){if(escape&&text[i]==='\\'){i++;continue;}if(text[i]===ch){if(text[i+1]===ch){i++;continue;}closed=true;break;}}
   if(!closed)throw Error('Unclosed SQL quote.');continue;
  }
  if(ch==='$'){const tag=/^\$(?:[A-Za-z_][A-Za-z_0-9]*)?\$/.exec(text.slice(i))?.[0];if(tag){const end=text.indexOf(tag,i+tag.length);if(end<0)throw Error('Unclosed SQL quote.');i=end+tag.length-1;}}
 }
 return terminator<0?text:(text.slice(0,terminator)+text.slice(terminator+1)).trim();
}
