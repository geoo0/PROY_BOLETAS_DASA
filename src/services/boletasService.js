import { q } from '../db/pool.js';

export async function findEmpleadoByDpiDob(dpi, fechaNac) {
    const { rows } = await q(
        `SELECT id, cod_empleado, nombre, dpi, fecha_nacimiento, puesto, salario_base, activo
     FROM empleados WHERE dpi=$1 AND fecha_nacimiento=$2 AND activo=TRUE`, [dpi, fechaNac]
    );
    return rows[0] || null;
}

export async function ensureBoletasForSueldos(sueldoIds = []) {
    if (!sueldoIds.length) return;
    await q(
        `INSERT INTO boletas (sueldo_id)
     SELECT s.id FROM sueldos s LEFT JOIN boletas b ON b.sueldo_id=s.id
     WHERE s.id = ANY($1::bigint[]) AND b.sueldo_id IS NULL`, [sueldoIds]
    );
}

// Lista hasta hoy; pendingOnly = solo NO firmadas
export async function listSueldosHastaHoy(empleadoId, pendingOnly = false) {
    const base = `
    SELECT s.id AS sueldo_id, s.salario_quincenal, s.fecha_pago,
           s.horas_extra, s.bonificacion, s.bono_14, s.aguinaldo,
           s.comisiones, s.igss, s.isr, s.descuentos_dasa, s.seguro_vida,
           p.id AS periodo_id, p.etiqueta AS periodo_etiqueta,
           p.fecha_inicio AS periodo_inicio, p.fecha_fin AS periodo_fin,
           b.firmado AS boleta_firmada, b.firmado_at AS boleta_firmada_at
    FROM sueldos s
    JOIN periodos_pago p ON p.id=s.periodo_id
    LEFT JOIN boletas b ON b.sueldo_id=s.id
    WHERE s.empleado_id=$1 AND p.fecha_inicio <= CURRENT_DATE
  `;
    const onlyPending = pendingOnly ? ' AND (b.firmado IS DISTINCT FROM TRUE)' : '';
    const order = ' ORDER BY p.fecha_inicio ASC';
    const { rows } = await q(base + onlyPending + order, [empleadoId]);
    return rows;
}

export async function getSueldoFullRow(sueldoId) {
    const { rows } = await q(`
    SELECT e.cod_empleado, e.nombre, e.dpi, e.puesto, e.salario_base,
           p.etiqueta, p.fecha_inicio, p.fecha_fin,
           s.salario_quincenal, s.fecha_pago, s.horas_extra, s.bonificacion, s.bono_14, s.aguinaldo,
           s.comisiones, s.igss, s.isr, s.descuentos_dasa, s.seguro_vida
    FROM sueldos s JOIN empleados e ON e.id=s.empleado_id JOIN periodos_pago p ON p.id=s.periodo_id
    WHERE s.id=$1`, [sueldoId]);
    return rows[0] || null;
}
