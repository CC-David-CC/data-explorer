import perspective, {createMessageHandler} from '@perspective-dev/client';
import perspectiveViewer from '@perspective-dev/viewer';
import * as viewerModule from '@perspective-dev/viewer/dist/wasm/perspective-viewer.js';
import '@perspective-dev/viewer-datagrid';
import '@perspective-dev/viewer-charts';
import {DuckDBHandler} from '@perspective-dev/client/dist/esm/virtual_servers/duckdb.js';
import * as duckdb from '@duckdb/duckdb-wasm';
import serverWasm from '@perspective-dev/server/dist/wasm/perspective-server.wasm';
import viewerWasm from '@perspective-dev/viewer/dist/wasm/perspective-viewer.wasm';
import duckWasm from '@duckdb/duckdb-wasm/dist/duckdb-mvp.wasm';
import './data-explorer.css';
let initialization;
function initialize(){return initialization??=Promise.all([perspective.init_server(fetch(serverWasm)),perspectiveViewer.init_client(fetch(viewerWasm),viewerModule)]).catch(e=>{initialization=null;throw e;});}
export function mount(host){
 const {w,desktop}=host,{make,textButton,appInput}=host.ui,{mirrorFileContext,signedInSubject}=host.storage,owner=w.launchContext?.owner||signedInSubject();w.ownerSub=owner;
 const body=make('div','window-content data-explorer'),bar=make('div','data-explorer-bar'),path=appInput('Data file path',w.launchContext?.path||'/'),sql=make('textarea','data-explorer-sql'),status=make('div','app-status'),viewer=document.createElement('perspective-viewer');viewer.setAttribute('theme','Pro Light');viewer.setAttribute('aria-label','Interactive data grid and charts');sql.setAttribute('aria-label','SQL query');sql.value='SELECT * FROM data';let disposed=false,busy=false,db,connection,client,duckWorker,viewerLoaded=false,queryNumber=0,lastResult=null,setupTask=null;
 const valid=()=>!disposed&&!host.signal.aborted&&body.isConnected&&signedInSubject()===owner;const tell=s=>{if(valid())status.textContent=s;};
 async function setupInner(){await initialize();if(!valid())return;duckWorker=new Worker(new URL('./node_modules/@duckdb/duckdb-wasm/dist/duckdb-browser-mvp.worker.js',import.meta.url));db=new duckdb.AsyncDuckDB(new duckdb.VoidLogger(),duckWorker);await db.instantiate(duckWasm);connection=await db.connect();await connection.query('SET default_null_order=NULLS_FIRST_ON_ASC_LAST_ON_DESC');await connection.query('SET autoinstall_known_extensions=false');await connection.query('SET autoload_known_extensions=false');client=await perspective.worker(await createMessageHandler(new DuckDBHandler(connection)));if(!valid())return;await viewer.load(client);viewerLoaded=true;}
 function setup(){return setupTask??=setupInner();}
 async function open(){if(busy||!valid())return;busy=true;tell('Opening data in your browser…');try{const c=await mirrorFileContext(),p=c.path(path.value),extension=p.match(/\.(csv)$/i)?.[1].toLowerCase();if(!extension)throw Error('Choose a CSV file from Files.');const file=await c.files.read(p);if(file.data.byteLength>32*1024*1024)throw Error('Data files are limited to 32 MiB for this preview.');await setup();if(!valid()||!c.valid())return;const filename='codi-input.'+extension;await db.registerFileBuffer(filename,Uint8Array.from(file.data));const read='read_csv_auto';await connection.query(`CREATE OR REPLACE TABLE data AS SELECT * FROM ${read}('${filename}')`);await db.dropFile(filename);sql.value='SELECT * FROM data';await query();}catch(e){tell('Could not open data: '+e.message);}finally{busy=false;}}
 async function query(){if(!connection||!valid())return;try{tell('Running query…');const statement=sql.value.trim().replace(/;\s*$/,'');if(!/^(select|with)\b/i.test(statement))throw Error('Enter a SELECT query.');const result='codi_result_'+(++queryNumber);await connection.query('CREATE TABLE '+result+' AS ('+statement+')');await viewer.restore({table:'memory.'+result});if(lastResult)await connection.query('DROP TABLE '+lastResult);lastResult=result;tell('Ready. Use the viewer settings to group, pivot, filter, and choose a chart.');}catch(e){tell('Query failed: '+e.message);}}
 bar.append(path,textButton('Open',open),textButton('Files',()=>desktop.launch('files')),textButton('Run SQL',()=>{if(!busy){busy=true;query().finally(()=>{busy=false;});}}));body.append(bar,sql,viewer,status);tell('Open a CSV file from your Files.');if(w.launchContext)queueMicrotask(open);
 return {element:body,dispose(){disposed=true;void (async()=>{try{await setupTask;}catch{}try{if(viewerLoaded)await viewer.delete();}catch{}try{await client?.terminate();}catch{}try{await connection?.close();}catch{}try{await db?.terminate();}catch{}duckWorker?.terminate();})();}};
}
