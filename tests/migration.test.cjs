// PostgreSQL embebido PGlite. Solo datos de prueba en memoria.
const { PGlite } = require(process.env.PGLITE_MODULE_PATH || '../.qa-postgres/node_modules/@electric-sql/pglite');
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const sql = fs.readFileSync(path.join(__dirname, '../migrations/001_turno_manana.sql'), 'utf8');

test('migra el enum anterior sin perder filas y permite repetir la migración', async () => {
  const db = new PGlite();
  try {
    await db.exec("CREATE TYPE turnotipo AS ENUM ('manana','tarde','noche'); CREATE TABLE cursos (id int primary key, turno turnotipo); INSERT INTO cursos VALUES (1,'manana'),(2,'tarde'),(3,NULL);");
    await db.exec(sql);
    await db.exec(sql);
    assert.deepEqual((await db.query('SELECT id, turno::text FROM cursos ORDER BY id')).rows, [{id:1,turno:'mañana'},{id:2,turno:'tarde'},{id:3,turno:null}]);
    await db.exec("INSERT INTO cursos VALUES (4,'mañana')");
  } finally { await db.close(); }
});

test('acepta el enum de schema.sql sin modificar datos', async () => {
  const db = new PGlite();
  try {
    await db.exec("CREATE TYPE turno_tipo AS ENUM ('mañana','tarde','noche'); CREATE TABLE cursos (id int primary key, turno turno_tipo); INSERT INTO cursos VALUES (1,'mañana');");
    await db.exec(sql);
    assert.equal((await db.query('SELECT turno::text FROM cursos')).rows[0].turno, 'mañana');
  } finally { await db.close(); }
});

test('base vacía no requiere modificaciones', async () => {
  const db = new PGlite();
  try { await db.exec(sql); }
  finally { await db.close(); }
});

test('enum ambiguo se rechaza conservando las filas', async () => {
  const db = new PGlite();
  try {
    await db.exec("CREATE TYPE turnotipo AS ENUM ('manana','mañana','tarde'); CREATE TABLE cursos (id int primary key, turno turnotipo); INSERT INTO cursos VALUES (1,'manana');");
    await assert.rejects(db.exec(sql), /ambas etiquetas/);
    await db.exec('ROLLBACK');
    assert.equal((await db.query('SELECT turno::text FROM cursos')).rows[0].turno, 'manana');
  } finally { await db.close(); }
});
