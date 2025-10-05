import { Router } from 'express';
import viewLogin, { viewMsg } from '../views/login.js';
import viewDashboard from '../views/dashboard.js';
import { q } from '../db/pool.js';
import { fmtDate, monthFromVal } from '../utils/format.js';
import {
  findEmpleadoByDpiDob,
  listSueldosHastaHoy,
  ensureBoletasForSueldos,
  getSueldoFullRow
} from '../services/boletasService.js';

const router = Router();

router.get('/', (req, res) => res.redirect('/boletas'));
router.get('/boletas', (req, res) => res.send(viewLogin()));

router.post('/boletas', async (req, res) => {
  try {
    const dpi = String(req.body.dpi||'').trim();
    const fecha = String(req.body.fecha_nacimiento||'').trim();
    if (!/^[0-9]{13}$/.test(dpi)) return res.status(400).send(viewLogin({ error:'DPI inválido (13 dígitos).' }));
    if (!fecha) return res.status(400).send(viewLogin({ error:'La fecha de nacimiento es requerida.' }));
    const emp = await findEmpleadoByDpiDob(dpi, fecha);
    if (!emp) return res.status(401).send(viewLogin({ error:'Credenciales inválidas.' }));
    res.redirect(`/boletas/${dpi}`);
  } catch(err) {
    console.error('POST /boletas', err);
    res.status(500).send(viewMsg('Error', 'Error interno.'));
  }
});

router.get('/boletas/:dpi', async (req, res) => {
  try {
    const dpi = String(req.params.dpi||'').trim();
    if (!/^[0-9]{13}$/.test(dpi)) return res.status(400).send(viewMsg('Error','DPI inválido.'));
    const emp = await q(`SELECT id, nombre, dpi, puesto, salario_base FROM empleados WHERE dpi=$1 AND activo=TRUE`, [dpi]).then(r=>r.rows[0]);
    if (!emp) return res.status(404).send(viewMsg('No encontrado','El empleado no existe o está inactivo.'));

    // Crea boletas faltantes y muestra SOLO pendientes (orden ASC por fecha de inicio)
    const all = await listSueldosHastaHoy(emp.id, false);
    await ensureBoletasForSueldos(all.map(i=>i.sueldo_id));
    const pending = await listSueldosHastaHoy(emp.id, true);

    res.send(viewDashboard({ empleado: emp, items: pending, dpi }));
  } catch(err) {
    console.error('GET /boletas/:dpi', err);
    res.status(500).send(viewMsg('Error', 'Error interno.'));
  }
});

router.post('/boletas/:dpi/firmar', async (req, res) => {
  try {
    const dpi = String(req.params.dpi||'').trim();
    const sueldoId = Number(req.body.sueldo_id);
    const sigData = String(req.body.sig_data||''); // seguimos capturando la firma, pero no la enviamos por correo

    const emp = await q(`SELECT id FROM empleados WHERE dpi=$1 AND activo=TRUE`, [dpi]).then(r=>r.rows[0]);
    if (!emp) return res.redirect('/boletas');

    const ok = await q(`SELECT 1 FROM sueldos WHERE id=$1 AND empleado_id=$2`, [sueldoId, emp.id]).then(r=>r.rowCount>0);
    if (!ok) return res.redirect(`/boletas/${dpi}`);

    await ensureBoletasForSueldos([sueldoId]);
    await q(`UPDATE boletas SET firmado=TRUE, firmado_at=now() WHERE sueldo_id=$1 AND firmado=FALSE`, [sueldoId]);

    // Si quieres, aquí podrías guardar un hash/PNG de la firma en S3 o similar más adelante.
    // Por ahora no se guarda ni se envía.

    res.redirect(`/boletas/${dpi}`);
  } catch(err) {
    console.error('POST /firmar', err);
    res.status(500).send(viewMsg('Error', 'Error interno.'));
  }
});

export default router;
