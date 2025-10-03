import layout from './layout.js';

export default function viewLogin({ error = null } = {}) {
    const err = error ? `<div class="alert alert-danger">${error}</div>` : '';
    return layout({
        title: 'Ingreso',
        body: `
<div class="row justify-content-center">
  <div class="col-12 col-md-8 col-lg-6">
    <div class="card shadow-sm"><div class="card-body p-4">
      <h1 class="h4 mb-3">Ingreso</h1>
      <p class="text-muted mb-4">Ingresa tu DPI y fecha de nacimiento.</p>
      ${err}
      <form method="POST" action="/boletas" novalidate>
        <div class="mb-3">
          <label class="form-label">DPI</label>
          <input name="dpi" class="form-control" required pattern="^[0-9]{13}$" inputmode="numeric" placeholder="13 dígitos">
          <div class="form-text">Debe contener 13 dígitos.</div>
        </div>
        <div class="mb-3">
          <label class="form-label">Fecha de nacimiento</label>
          <input name="fecha_nacimiento" class="form-control" type="date" required>
        </div>
        <button class="btn btn-primary w-100" type="submit">Ingresar</button>
      </form>
    </div></div>
  </div>
</div>`
    });
}

export function viewMsg(title, msg, backLink = '/boletas') {
    return layout({ title, body: `<div class="alert alert-info">${msg}</div><a href="${backLink}" class="btn btn-primary mt-2">Volver</a>` });
}
