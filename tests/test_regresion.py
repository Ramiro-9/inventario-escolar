"""Pruebas aisladas: nunca usan DATABASE_URL ni datos de producción.

Ejecutar desde la raíz: python -m unittest discover -s tests -v
SQLite comprueba rutas y lógica; no sustituye la prueba de migración PostgreSQL.
"""
import ast
import os
from pathlib import Path
import unittest

os.environ["DATABASE_URL"] = "sqlite://"
os.environ["SECRET_KEY"] = "clave-exclusiva-para-pruebas-locales"

from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from app.main import app
from app.database import Base, get_db
from app import models
from app.auth import crear_token, hash_password


class RegresionInventario(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.password_hash = hash_password("clave-qa-123")

    def setUp(self):
        self.engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
        Base.metadata.create_all(self.engine)
        self.Session = sessionmaker(bind=self.engine)
        # Mismas consultas de las vistas; SQLite no admite CREATE OR REPLACE VIEW.
        tree = ast.parse((Path(__file__).resolve().parents[1] / "app/main.py").read_text())
        with self.engine.begin() as conn:
            for node in ast.walk(tree):
                if isinstance(node, ast.Constant) and isinstance(node.value, str) and "CREATE OR REPLACE VIEW" in node.value:
                    conn.execute(text(node.value.replace("CREATE OR REPLACE VIEW", "CREATE VIEW")))
        with self.Session() as db:
            db.add_all([
                models.Usuario(username="qa_admin", password=self.password_hash, rol=models.RolUsuario.admin),
                models.Usuario(username="qa_viewer", password=self.password_hash, rol=models.RolUsuario.viewer),
                models.Stock(id=1, bancos_total=10, sillas_total=10),
                models.Ubicacion(id=1, nombre="Aula QA"),
                models.Ubicacion(id=2, nombre="Otra aula"),
            ])
            db.commit()
        def database():
            with self.Session() as db:
                yield db
        app.dependency_overrides[get_db] = database
        # Sin lifespan: no se ejecuta el arranque PostgreSQL ni se crea el admin real.
        self.client = TestClient(app)
        self.admin = {"Authorization": "Bearer " + crear_token({"sub": "qa_admin"})}
        self.viewer = {"Authorization": "Bearer " + crear_token({"sub": "qa_viewer"})}

    def tearDown(self):
        self.client.close()
        app.dependency_overrides.clear()
        self.engine.dispose()

    def curso(self, **fields):
        payload = {"nombre": "Curso QA", "ubicacion_id": 1, **fields}
        response = self.client.post("/cursos/", json=payload, headers=self.admin)
        self.assertEqual(response.status_code, 201, response.text)
        return response.json()

    def test_login_valido_e_incorrecto(self):
        for password, status in [("clave-qa-123", 200), ("incorrecta", 401), ("x" * 73, 401), ("ñ" * 37, 401)]:
            with self.subTest(password_length=len(password)):
                r = self.client.post("/auth/login", data={"username": "qa_admin", "password": password})
                self.assertEqual(r.status_code, status)
                if status == 200:
                    self.assertEqual(self.client.get("/auth/me", headers={"Authorization": "Bearer " + r.json()["access_token"]}).status_code, 200)

    def test_sin_sesion_no_modifica_datos(self):
        self._bloqueo({}, 401)

    def test_viewer_no_modifica_datos(self):
        self._bloqueo(self.viewer, 403)

    def test_token_invalido_no_modifica_datos(self):
        self._bloqueo({"Authorization": "Bearer invalido"}, 401)

    def _bloqueo(self, headers, expected):
        curso = self.curso()
        operations = [
            ("POST", "/cursos/", {"nombre": "Intruso", "ubicacion_id": 1}),
            ("PATCH", f"/cursos/{curso['id']}", {"nombre": "Alterado"}),
            ("DELETE", f"/cursos/{curso['id']}", None),
            ("PATCH", "/stock/", {"bancos_total": 999}),
            ("POST", "/ubicaciones/", {"nombre": "Intrusa"}),
            ("PATCH", "/ubicaciones/1", {"nombre": "Alterada"}),
            ("DELETE", "/ubicaciones/2", None),
        ]
        for method, path, body in operations:
            with self.subTest(method=method, path=path):
                self.assertEqual(self.client.request(method, path, json=body, headers=headers).status_code, expected)
        self.assertEqual(self.client.get("/stock/").json()["bancos_total"], 10)
        self.assertEqual(self.client.get(f"/cursos/{curso['id']}").json()["nombre"], "Curso QA")
        self.assertEqual(len(self.client.get("/cursos/").json()), 1)

    def test_admin_crea_edita_elimina_y_actualiza_stock(self):
        curso = self.curso()
        url = f"/cursos/{curso['id']}"
        self.assertEqual(self.client.patch(url, json={"nombre": "Editado"}, headers=self.admin).json()["nombre"], "Editado")
        self.assertEqual(self.client.patch("/stock/", json={"bancos_total": 20}, headers=self.admin).json()["bancos_total"], 20)
        self.assertEqual(self.client.delete(url, headers=self.admin).status_code, 204)
        self.assertEqual(self.client.get(url).status_code, 404)

    def test_nombres_invalidos_rechazados_al_crear_y_editar(self):
        curso = self.curso()
        for name in ["", "   ", None, "x" * 101]:
            for method, path, body in [
                ("POST", "/ubicaciones/", {"nombre": name}),
                ("PATCH", "/ubicaciones/1", {"nombre": name}),
                ("POST", "/cursos/", {"nombre": name, "ubicacion_id": 1}),
                ("PATCH", f"/cursos/{curso['id']}", {"nombre": name}),
            ]:
                with self.subTest(name=name, method=method, path=path):
                    self.assertEqual(self.client.request(method, path, json=body, headers=self.admin).status_code, 422)

    def test_cantidades_negativas_y_nulas_rechazadas(self):
        curso = self.curso()
        for value in [-1, None, 1.5]:
            for path, key in [("/stock/", "bancos_total"), (f"/cursos/{curso['id']}", "sillas_requeridas")]:
                with self.subTest(path=path, value=value):
                    self.assertEqual(self.client.patch(path, json={key: value}, headers=self.admin).status_code, 422)
        self.assertEqual(self.client.patch("/stock/", json={"bancos_total": 0}, headers=self.admin).status_code, 200)

    def test_usuario_y_password_validaciones(self):
        for changes in [{"username": ""}, {"username": "  "}, {"username": "x" * 51}, {"password": ""}, {"password": "  "}, {"password": "x" * 73}, {"password": "ñ" * 37}, {"rol": "desconocido"}]:
            with self.subTest(changes=changes):
                r = self.client.post("/auth/usuarios", json={"username": "nuevo", "password": "correcta", **changes}, headers=self.admin)
                self.assertEqual(r.status_code, 422)
        r = self.client.post("/auth/usuarios", json={"username": "nuevo", "password": "ñ" * 36}, headers=self.admin)
        self.assertEqual(r.status_code, 201)
        self.assertEqual(self.client.post("/auth/login", data={"username": "nuevo", "password": "ñ" * 36}).status_code, 200)

    def test_ubicacion_duplicada_responde_conflicto_y_recupera_sesion(self):
        r = self.client.post("/ubicaciones/", json={"nombre": "  Aula QA  "}, headers=self.admin)
        self.assertEqual(r.status_code, 409)
        r = self.client.patch("/ubicaciones/2", json={"nombre": "Aula QA"}, headers=self.admin)
        self.assertEqual(r.status_code, 409)
        self.assertEqual(self.client.get("/ubicaciones/2").json()["nombre"], "Otra aula")
        self.assertEqual(self.client.post("/ubicaciones/", json={"nombre": "Nueva aula"}, headers=self.admin).status_code, 201)

    def test_turnos_se_guardan_y_se_listan(self):
        for turno in ["mañana", "tarde", "noche", None]:
            with self.subTest(turno=turno):
                c = self.curso(turno=turno)
                self.assertEqual(c["turno"], turno)
                self.assertEqual(self.client.get(f"/cursos/{c['id']}").json()["turno"], turno)
        self.assertEqual(len(self.client.get("/cursos/").json()), 4)

    def test_quitar_turno_y_omitir_turno_son_distintos(self):
        curso = self.curso(turno="mañana")
        path = f"/cursos/{curso['id']}"
        self.assertEqual(self.client.patch(path, json={"nombre": "Cambio"}, headers=self.admin).json()["turno"], "mañana")
        self.assertIsNone(self.client.patch(path, json={"turno": None}, headers=self.admin).json()["turno"])
        self.curso(turno="mañana")

    def test_turno_duplicado_en_misma_aula(self):
        self.curso(turno="mañana")
        r = self.client.post("/cursos/", json={"nombre": "Otro", "ubicacion_id": 1, "turno": "mañana"}, headers=self.admin)
        self.assertEqual(r.status_code, 409)
        self.curso(turno="mañana", ubicacion_id=2)

    def test_descripcion_se_puede_limpiar(self):
        self.client.patch("/ubicaciones/1", json={"descripcion": "Texto"}, headers=self.admin)
        r = self.client.patch("/ubicaciones/1", json={"descripcion": None}, headers=self.admin)
        self.assertIsNone(r.json()["descripcion"])

    def test_inyeccion_sql_se_trata_como_texto(self):
        r = self.client.post("/auth/login", data={"username": "' OR 1=1 --", "password": "x"})
        self.assertEqual(r.status_code, 401)
        self.curso(nombre="QA'; DROP TABLE cursos; --")
        self.assertEqual(len(self.client.get("/cursos/").json()), 1)

    def test_resumen_conserva_max_por_aula_y_deficit(self):
        self.curso(turno="mañana", bancos_requeridos=20, sillas_requeridas=25)
        self.curso(turno="tarde", bancos_requeridos=30, sillas_requeridas=20)
        self.curso(ubicacion_id=2, bancos_requeridos=5, sillas_requeridas=7)
        r = self.client.get("/resumen")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.json()["bancos_requeridos"], 35)
        self.assertEqual(r.json()["sillas_requeridas"], 32)
        self.assertEqual(r.json()["bancos_sobrantes"], -25)

    def test_nombres_vacios_historicos_siguen_siendo_legibles(self):
        # Validar entradas nuevas no debe hacer fallar listados de datos antiguos.
        with self.Session() as db:
            db.add(models.Ubicacion(nombre=""))
            db.add(models.Curso(nombre="", ubicacion_id=1))
            db.commit()
        self.assertEqual(self.client.get("/ubicaciones/").status_code, 200)
        self.assertEqual(self.client.get("/cursos/").status_code, 200)


if __name__ == "__main__":
    unittest.main()
