import layout from './layout.js';
import { fmtQ, fmtDate, monthFromVal } from '../utils/format.js';

export default function viewDashboard({ empleado, items, dpi }) {
    const header = `
<div class="mb-4"><div class="card shadow-sm"><div class="card-body">
  <h2 class="h5 mb-3">Empleado</h2>
  <p class="mb-1"><strong>Nombre:</strong> ${empleado.nombre}</p>
  <p class="mb-1"><strong>DPI:</strong> ${empleado.dpi}</p>
  <p class="mb-1"><strong>Puesto:</strong> ${empleado.puesto}</p>
  <p class="mb-1"><strong>Salario base:</strong> ${fmtQ(empleado.salario_base)}</p>
</div></div></div>`;

    if (!items.length) {
        return layout({
            title: 'Boletas',
            body: `${header}
<div class="alert alert-success">No tienes boletas pendientes de firma.</div>
<a class="btn btn-secondary mt-2" href="/boletas">Salir</a>` });
    }

    const accordionItems = items.map((it, idx) => {
        const m = monthFromVal(it.fecha_pago);
        const showBono14 = m === 7, showAguinaldo = m === 12;

        const percep = {
            salario_quincenal: Number(it.salario_quincenal || 0),
            horas_extra: Number(it.horas_extra || 0),
            bonificacion: Number(it.bonificacion || 0),
            comisiones: Number(it.comisiones || 0),
            bono_14: showBono14 ? Number(it.bono_14 || 0) : 0,
            aguinaldo: showAguinaldo ? Number(it.aguinaldo || 0) : 0,
        };
        const totalPercepciones = Object.values(percep).reduce((a, b) => a + b, 0);
        const deduc = {
            igss: Number(it.igss || 0),
            isr: Number(it.isr || 0),
            descuentos_dasa: Number(it.descuentos_dasa || 0),
            seguro_vida: Number(it.seguro_vida || 0),
        };
        const totalDeducciones = Object.values(deduc).reduce((a, b) => a + b, 0);
        const neto = totalPercepciones - totalDeducciones;

        const collapseId = `collapse${idx}`;
        return `
<div class="accordion-item">
  <h2 class="accordion-header" id="h${idx}">
    <button class="accordion-button ${idx === 0 ? '' : 'collapsed'} d-flex align-items-center" type="button" data-bs-toggle="collapse" data-bs-target="#${collapseId}">
      <span>${it.periodo_etiqueta}</span>
      <span class="ms-auto badge bg-warning text-dark">Pendiente</span>
    </button>
  </h2>
  <div id="${collapseId}" class="accordion-collapse collapse ${idx === 0 ? 'show' : ''}" data-bs-parent="#acc">
    <div class="accordion-body">
      <p class="mb-3"><strong>Fecha de pago:</strong> ${fmtDate(it.fecha_pago)}</p>

      <div class="row g-4">
        <div class="col-12 col-lg-6">
          <h3 class="h6 mb-2">Percepciones</h3>
          <table class="table table-sm mb-2"><tbody>
            <tr><td>Salario quincenal</td><td class="text-end fw-semibold">${fmtQ(percep.salario_quincenal)}</td></tr>
            <!-- <tr><td>Horas extra</td><td class="text-end fw-semibold">${fmtQ(percep.horas_extra)}</td></tr> -->
            <tr><td>Bono Ley 37-2001</td><td class="text-end fw-semibold">${fmtQ(percep.bonificacion)}</td></tr>
            <!-- <tr><td>Comisiones</td><td class="text-end fw-semibold">${fmtQ(percep.comisiones)}</td></tr> -->
            ${showBono14 ? `<tr><td>Bono 14</td><td class="text-end fw-semibold">${fmtQ(percep.bono_14)}</td></tr>` : ''}
            ${showAguinaldo ? `<tr><td>Aguinaldo</td><td class="text-end fw-semibold">${fmtQ(percep.aguinaldo)}</td></tr>` : ''}
            <tr class="table-light"><td class="fw-bold">Total percepciones</td><td class="text-end fw-bold">${fmtQ(totalPercepciones)}</td></tr>
          </tbody></table>
        </div>
        <div class="col-12 col-lg-6">
          <h3 class="h6 mb-2">Deducciones</h3>
          <table class="table table-sm mb-2"><tbody>
            <tr><td>IGSS</td><td class="text-end fw-semibold">-${fmtQ(deduc.igss)}</td></tr>
            <tr><td>ISR</td><td class="text-end fw-semibold">-${fmtQ(deduc.isr)}</td></tr>
            <tr><td>Descuentos DASA</td><td class="text-end fw-semibold">-${fmtQ(deduc.descuentos_dasa)}</td></tr>
            <tr><td>Seguro de vida / gastos médicos</td><td class="text-end fw-semibold">-${fmtQ(deduc.seguro_vida)}</td></tr>
            <tr class="table-light"><td class="fw-bold">Total deducciones</td><td class="text-end fw-bold">-${fmtQ(totalDeducciones)}</td></tr>
          </tbody></table>
        </div>
      </div>

      <div class="row"><div class="col-12">
        <table class="table table-sm mb-0"><tbody>
          <tr class="table-dark"><td class="fw-bold">Líquido a recibir</td><td class="text-end fw-bold">${fmtQ(neto)}</td></tr>
        </tbody></table>
      </div></div>

      <hr class="my-3">

      <div class="row g-3">
        <div class="col-12 col-md-6">
          <label class="form-label">Firma</label>
          <div class="border rounded bg-white" style="width:100%; max-width:360px; height:140px;">
            <canvas id="sig-${idx}" width="360" height="140"></canvas>
          </div>
          <div class="mt-2"><button type="button" class="btn btn-outline-secondary btn-sm" id="clear-${idx}">Limpiar</button></div>
        </div>
        <div class="col-12 col-md-6 d-flex align-items-end justify-content-end">
          <form method="POST" action="/boletas/${dpi}/firmar" class="m-0">
            <input type="hidden" name="sueldo_id" value="${it.sueldo_id}">
            <input type="hidden" name="sig_data" id="sigdata-${idx}">
            <button class="btn btn-success d-inline-flex align-items-center gap-2" id="btn-${idx}">
              <i class="bi bi-pen"></i> Firmar ahora
            </button>
          </form>
        </div>
      </div>

    </div>
  </div>
</div>`;
    }).join('');

    return layout({
        title: 'Boletas',
        body: `
${header}
<div class="accordion" id="acc">${accordionItems}</div>
<a class="btn btn-secondary mt-4" href="/boletas">Salir</a>
<script>
(function(){
  function SigPad(canvas, clearBtn, submitBtn, hiddenField){
    const ctx = canvas.getContext('2d'); let drawing=false, last=null;
    function pos(e){ const r=canvas.getBoundingClientRect(); const t=(e.touches && e.touches[0])||e; return {x:t.clientX-r.left, y:t.clientY-r.top}; }
    function start(e){ drawing=true; last=pos(e); e.preventDefault(); }
    function move(e){ if(!drawing) return; const p=pos(e);
      ctx.beginPath(); ctx.lineWidth=2; ctx.lineCap='round'; ctx.moveTo(last.x,last.y); ctx.lineTo(p.x,p.y); ctx.stroke();
      last=p; submitBtn.disabled=false; e.preventDefault();
    }
    function end(){ drawing=false; }
    function clear(){ ctx.clearRect(0,0,canvas.width,canvas.height); submitBtn.disabled=true; hiddenField.value=''; }
    canvas.addEventListener('mousedown',start); canvas.addEventListener('mousemove',move); canvas.addEventListener('mouseup',end); canvas.addEventListener('mouseleave',end);
    canvas.addEventListener('touchstart',start,{passive:false}); canvas.addEventListener('touchmove',move,{passive:false}); canvas.addEventListener('touchend',end);
    clearBtn.addEventListener('click',clear);
    const form = submitBtn.closest('form'); form.addEventListener('submit', ()=>{ try{ hiddenField.value = canvas.toDataURL('image/png'); }catch{} });
    submitBtn.disabled = true;
  }
  document.querySelectorAll('canvas[id^="sig-"]').forEach((cv)=>{
    const id=cv.id.split('-')[1]; const clearBtn=document.getElementById('clear-'+id);
    const submitBtn=document.getElementById('btn-'+id); const hidden=document.getElementById('sigdata-'+id);
    SigPad(cv, clearBtn, submitBtn, hidden);
  });
})();
</script>`
    });
}
