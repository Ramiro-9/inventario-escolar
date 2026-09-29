// Ejecutar desde la raíz: node --test tests/client.test.cjs
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../frontend/src/api/client.js'), 'utf8')
  .replace('import.meta.env.VITE_API_URL', 'undefined').replaceAll('export ', '');

function cliente(fetch) {
  const data = new Map([['token', 'token-local'], ['usuario', '{}']]);
  const context = vm.createContext({ fetch, URLSearchParams,
    localStorage: { getItem: key => data.get(key), setItem: (k,v) => data.set(k,v), removeItem: key => data.delete(key) },
    window: { location: { href: '/' } },
  });
  vm.runInContext(source, context);
  return { call: code => vm.runInContext(code, context), data, context };
}

test('cursos envía token en crear, editar y borrar', async () => {
  const calls = [];
  const c = cliente(async (url, options) => {
    calls.push({url, ...options});
    return {ok:true, status:200, json:async () => ({id:1})};
  });
  await c.call('createCurso({nombre:"QA",ubicacion_id:1})');
  await c.call('updateCurso(1,{turno:null})');
  await c.call('deleteCurso(1)');
  assert.deepEqual(calls.map(x => x.method), ['POST', 'PATCH', 'DELETE']);
  for (const item of calls) assert.equal(item.headers.Authorization, 'Bearer token-local');
  assert.equal(JSON.parse(calls[1].body).turno, null);
});

test('401 borra sesión y rechaza la operación, sin informar éxito', async () => {
  const c = cliente(async () => ({status:401}));
  await assert.rejects(c.call('updateStock({bancos_total:10})'), /sesión/);
  assert.equal(c.data.has('token'), false);
  assert.equal(c.data.has('usuario'), false);
  assert.equal(c.context.window.location.href, '/login');
});

test('fallo de conexión devuelve un mensaje legible', async () => {
  const c = cliente(async () => { throw new TypeError('Failed to fetch'); });
  await assert.rejects(c.call('createCurso({})'), /No se pudo conectar/);
});

test('errores de validación no se muestran como object Object', async () => {
  const c = cliente(async () => ({status:422, ok:false, json:async () => ({detail:[{loc:['body','nombre'],msg:'Campo obligatorio'}]})}));
  await assert.rejects(c.call('createCurso({})'), /nombre: Campo obligatorio/);
});

test('403 informa rechazo sin cerrar una sesión válida', async () => {
  const c = cliente(async () => ({status:403, ok:false, json:async () => ({detail:'Se requiere rol administrador'})}));
  await assert.rejects(c.call('updateStock({})'), /administrador/);
  assert.equal(c.data.get('token'), 'token-local');
});
