import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const headers = ['sku','product','category','stock_date','quantity'];
export const categoryMap = {accessories:'Accessories',home:'Home',office:'Office',stationery:'Stationery'};

export function parseCsv(text) {
  const rows=[]; let row=[], value='', quoted=false, afterQuote=false;
  for(let i=0;i<text.length;i++) {
    const c=text[i];
    if(quoted) { if(c==='"') { if(text[i+1]==='"') {value+='"'; i++;} else {quoted=false; afterQuote=true;} } else value+=c; continue; }
    if(c==='"') {if(value!=='' || afterQuote) throw new Error('Unexpected quote'); quoted=true; continue;}
    if(c===',') {row.push(value); value=''; afterQuote=false; continue;}
    if(c==='\n'||c==='\r') {if(c==='\r'&&text[i+1]==='\n')i++; row.push(value); rows.push(row); row=[]; value=''; afterQuote=false; continue;}
    if(afterQuote) throw new Error('Characters after closing quote');
    value+=c;
  }
  if(quoted) throw new Error('Unclosed quote');
  if(value!=='' || row.length || afterQuote) {row.push(value); rows.push(row);}
  if(rows.length && rows.some(r=>r.length!==rows[0].length)) throw new Error('Inconsistent column count');
  return rows;
}
export function toCsv(rows) {
  return rows.map(row=>row.map(v=>{const s=String(v??''); return /[",\r\n]/.test(s)?'"'+s.replaceAll('"','""')+'"':s;}).join(',')).join('\r\n')+'\r\n';
}
function validIsoDate(s) {
  if(!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d=new Date(s+'T00:00:00Z'); return !Number.isNaN(d.valueOf()) && d.toISOString().slice(0,10)===s;
}
export function clean(matrix) {
  if(JSON.stringify(matrix[0])!==JSON.stringify(headers)) throw new Error('Unexpected schema; agree fields before processing');
  if(matrix.length>1001) throw new Error('Maximum 1,000 data rows');
  if(matrix.some(r=>r.length!==headers.length)) throw new Error('Wrong column count');
  const result=[], changes=[], issues=[], removed=[]; const seen=new Map();
  for(let i=1;i<matrix.length;i++) {
    const row=matrix[i].map((v,j)=>{const s=String(v); const t=s.trim(); if(s!==t) changes.push({source_row:i+1,field:headers[j],rule:'trim',before:s,after:t}); return t;});
    const categoryKey=row[2].toLowerCase();
    const mapped=Object.hasOwn(categoryMap,categoryKey)?categoryMap[categoryKey]:undefined;
    if(mapped && mapped!==row[2]) {changes.push({source_row:i+1,field:'category',rule:'agreed category map',before:row[2],after:mapped}); row[2]=mapped;}
    // Matching SKU alone never authorizes deletion. All values must match after the agreed rules.
    const signature=JSON.stringify(row);
    if(seen.has(signature)) {removed.push({source_row:i+1,kept_source_row:seen.get(signature),sku:row[0],reason:'all normalized fields exactly equal'}); continue;}
    seen.set(signature,i+1); result.push({source_row:i+1,values:row});
  }
  const keys=new Map();
  for(const rec of result) {const key=rec.values[0]; if(key) keys.set(key,[...(keys.get(key)||[]),rec.source_row]);}
  for(const rec of result) {
    const {source_row,values:row}=rec;
    for(let j=0;j<row.length;j++) if(row[j]==='') issues.push({source_row,sku:row[0],field:headers[j],value:'',issue:'Missing value',action:'Preserved blank; client input needed'});
    if(row[3] && !validIsoDate(row[3])) issues.push({source_row,sku:row[0],field:'stock_date',value:row[3],issue:'Ambiguous or invalid date',action:'Preserved text; confirm intended date'});
    if(row[2] && !Object.hasOwn(categoryMap,row[2].toLowerCase())) issues.push({source_row,sku:row[0],field:'category',value:row[2],issue:'Unmapped category',action:'Preserved value; confirm category mapping'});
    if(row[0] && keys.get(row[0]).length>1) issues.push({source_row,sku:row[0],field:'sku',value:row[0],issue:'Conflicting rows share key',action:'All conflicting rows retained; client decision needed'});
  }
  return {rows:[headers,...result.map(r=>r.values)], sourceRows:result.map(r=>r.source_row), changes,removed,issues,stats:{inputRows:matrix.length-1,outputRows:result.length,duplicatesRemoved:removed.length,trimmedCells:changes.filter(c=>c.rule==='trim').length,categoryChanges:changes.filter(c=>c.rule==='agreed category map').length,issues:issues.length}};
}
if(process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  const base=path.dirname(fileURLToPath(import.meta.url));
  const input=process.argv[2]??path.join(base,'before.csv');
  const result=clean(parseCsv(await fs.readFile(input,'utf8')));
  await fs.writeFile(path.join(base,'after.csv'),toCsv(result.rows));
  const issueHeaders=['source_row','sku','field','value','issue','action'];
  await fs.writeFile(path.join(base,'issues.csv'),toCsv([issueHeaders,...result.issues.map(r=>issueHeaders.map(k=>r[k]))]));
  await fs.writeFile(path.join(base,'cleaning-result.json'),JSON.stringify(result,null,2)+'\n');
  console.log(JSON.stringify(result.stats));
}
