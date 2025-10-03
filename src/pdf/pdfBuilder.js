import PDFDocument from 'pdfkit';

function dataURLtoBuffer(dataURL) {
    if (!dataURL || !dataURL.startsWith('data:')) return null;
    const base64 = dataURL.split(',')[1];
    return Buffer.from(base64, 'base64');
}

export async function buildBoletaPDF({ empresa, empleado, periodo, sueldo, totales, firmaDataURL }) {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ size: [396, 612], margin: 24 }); // media carta
        const chunks = []; doc.on('data', c => chunks.push(c)); doc.on('end', () => resolve(Buffer.concat(chunks))); doc.on('error', reject);

        const w = doc.page.width, m = 24, yLine = (y) => { doc.moveTo(m, y).lineTo(w - m, y).strokeColor('#000').lineWidth(0.5).stroke(); };

        doc.fontSize(12).text(empresa, { align: 'center' });
        doc.moveDown(0.5);
        doc.fontSize(9).text(`Nómina del: ${periodo.fecha_inicio} al ${periodo.fecha_fin}`);

        yLine(doc.y + 4); doc.moveDown(0.3);
        doc.font('Helvetica-Bold');
        doc.text('Concepto', m, doc.y, { width: 180 });
        doc.text('Percepción', m + 180, doc.y - 12, { width: 70, align: 'right' });
        doc.text('Deducción', m + 250, doc.y - 12, { width: 70, align: 'right' });
        doc.text('Líquido', m + 320, doc.y - 12, { width: 52, align: 'right' });
        doc.font('Helvetica'); yLine(doc.y + 4);

        const row = (label, per, ded) => {
            const y0 = doc.y + 4;
            doc.text(label, m, y0, { width: 180 });
            doc.text(per ? `Q ${Number(per).toFixed(2)}` : '', m + 180, y0, { width: 70, align: 'right' });
            doc.text(ded ? `-Q ${Number(ded).toFixed(2)}` : '', m + 250, y0, { width: 70, align: 'right' });
            const liq = (Number(per || 0) - Number(ded || 0));
            doc.text(liq ? `Q ${liq.toFixed(2)}` : '', m + 320, y0, { width: 52, align: 'right' });
            doc.moveDown(1.2);
        };

        row('Sueldo (quincena)', sueldo.salario_quincenal, 0);
        row('Bono Ley 37-2001', sueldo.bonificacion, 0);
        row('IGSS', 0, sueldo.igss);
        row('ISR', 0, sueldo.isr);
        row('Descuentos DASA', 0, sueldo.descuentos_dasa);
        row('Seguro de Vida / gastos médicos', 0, sueldo.seguro_vida);

        yLine(doc.y); doc.moveDown(0.2); doc.font('Helvetica-Bold');
        doc.text('total +', m + 180, doc.y, { width: 70, align: 'right' });
        doc.text('total -', m + 250, doc.y, { width: 70, align: 'right' });
        doc.text('total - total', m + 320, doc.y, { width: 52, align: 'right' });
        doc.font('Helvetica');
        doc.text(`Q ${totales.percepciones.toFixed(2)}`, m + 180, doc.y, { width: 70, align: 'right' });
        doc.text(`-Q ${totales.deducciones.toFixed(2)}`, m + 250, doc.y, { width: 70, align: 'right' });
        doc.text(`Q ${totales.neto.toFixed(2)}`, m + 320, doc.y, { width: 52, align: 'right' });

        doc.moveDown(1.4);
        doc.text(`${sueldo.fecha_pago}`);
        doc.moveDown(0.8);
        doc.text(`Recibí de ${empresa}, la cantidad de Q ${totales.neto.toFixed(2)}, por concepto del salario que corresponde a la Nómina del ${periodo.fecha_inicio} al ${periodo.fecha_fin}.`);

        doc.moveDown(2);
        const sigY = doc.y;
        doc.text('Firma del colaborador:', m, sigY);
        const buf = dataURLtoBuffer(firmaDataURL);
        if (buf) { try { doc.image(buf, m + 140, sigY - 8, { width: 150, height: 60, fit: [150, 60] }); } catch { } }

        doc.moveDown(3);
        doc.text(empleado.nombre, { align: 'center' });
        doc.text(empleado.cod_empleado || empleado.dpi, { align: 'center' });
        doc.text(empleado.puesto, { align: 'center' });

        doc.end();
    });
}
