-- ============================================================
--  Inventario de Inmuebles Escolares — v3
-- ============================================================

CREATE TABLE ubicaciones (
    id          SERIAL PRIMARY KEY,
    nombre      VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT
);

CREATE TYPE turno_tipo AS ENUM ('mañana', 'tarde', 'noche');

CREATE TABLE cursos (
    id                  SERIAL PRIMARY KEY,
    nombre              VARCHAR(100) NOT NULL,          -- ej: "1°4°", "3°1°"
    turno               turno_tipo,                     -- NULL si no comparte aula
    ubicacion_id        INTEGER NOT NULL REFERENCES ubicaciones(id) ON DELETE RESTRICT,
    bancos_requeridos   INTEGER NOT NULL DEFAULT 0 CHECK (bancos_requeridos >= 0),
    sillas_requeridas   INTEGER NOT NULL DEFAULT 0 CHECK (sillas_requeridas >= 0)
);

CREATE TABLE stock (
    id              INTEGER PRIMARY KEY DEFAULT 1,
    bancos_total    INTEGER NOT NULL DEFAULT 0 CHECK (bancos_total >= 0),
    sillas_total    INTEGER NOT NULL DEFAULT 0 CHECK (sillas_total >= 0),
    updated_at      TIMESTAMP DEFAULT NOW(),
    CONSTRAINT una_sola_fila CHECK (id = 1)
);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_stock_updated_at
BEFORE UPDATE ON stock
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
--  Vista: requerimientos por ubicación (MAX entre cursos)
-- ============================================================
CREATE OR REPLACE VIEW requerimientos_por_ubicacion AS
SELECT
    u.id                        AS ubicacion_id,
    u.nombre                    AS ubicacion,
    MAX(c.bancos_requeridos)    AS bancos_requeridos,
    MAX(c.sillas_requeridas)    AS sillas_requeridas,
    COUNT(c.id)                 AS cantidad_cursos
FROM ubicaciones u
LEFT JOIN cursos c ON c.ubicacion_id = u.id
GROUP BY u.id, u.nombre;

-- ============================================================
--  Vista: resumen global
-- ============================================================
CREATE OR REPLACE VIEW resumen_inventario AS
SELECT
    s.bancos_total,
    s.sillas_total,
    COALESCE(SUM(r.bancos_requeridos), 0)                   AS bancos_requeridos,
    COALESCE(SUM(r.sillas_requeridas), 0)                   AS sillas_requeridas,
    s.bancos_total - COALESCE(SUM(r.bancos_requeridos), 0)  AS bancos_sobrantes,
    s.sillas_total - COALESCE(SUM(r.sillas_requeridas), 0)  AS sillas_sobrantes
FROM stock s
LEFT JOIN requerimientos_por_ubicacion r ON true
GROUP BY s.bancos_total, s.sillas_total;

-- ============================================================
--  Datos de ejemplo
-- ============================================================
INSERT INTO stock (bancos_total, sillas_total) VALUES (100, 120);

INSERT INTO ubicaciones (nombre) VALUES
    ('Aula 1'), ('Aula 2'), ('Aula 3');

INSERT INTO cursos (nombre, turno, ubicacion_id, bancos_requeridos, sillas_requeridas) VALUES
    ('1°4°', 'mañana', 1, 17, 17),
    ('3°1°', 'tarde',  1, 20, 20),  -- comparte Aula 1 → el MAX será 20
    ('2°2°', NULL,     2, 25, 25),  -- no comparte, turno NULL
    ('4°1°', 'mañana', 3, 18, 18),
    ('5°2°', 'tarde',  3, 22, 22),
    ('6°1°', 'noche',  3, 15, 15); -- hasta 3 cursos por aula → MAX será 22