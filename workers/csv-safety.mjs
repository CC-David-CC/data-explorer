import {hasFormulaLikeCSV} from '../csv-safety.mjs';
self.onmessage=event=>{const data=event.data;try{const risk=hasFormulaLikeCSV(data);self.postMessage({data,risk},data.buffer instanceof ArrayBuffer?[data.buffer]:[]);}catch(error){self.postMessage({error:error.message||'Could not inspect CSV.'});}};
