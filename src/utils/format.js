export function fmtQ(n){ try { return 'Q ' + Number(n).toFixed(2); } catch { return n; } }

// formatea Date o string a dd/mm/yyyy en UTC
export function fmtDate(v){
  try {
    const d = (v instanceof Date) ? v : new Date(v);
    if (isNaN(d)) return '';
    const dd = String(d.getUTCDate()).padStart(2,'0');
    const mm = String(d.getUTCMonth()+1).padStart(2,'0');
    const yy = d.getUTCFullYear();
    return `${dd}/${mm}/${yy}`;
  } catch { return String(v||''); }
}

export function monthFromVal(v){
  try { const d = (v instanceof Date)? v: new Date(v); if (isNaN(d)) return null; return d.getUTCMonth()+1; }
  catch { return null; }
}
