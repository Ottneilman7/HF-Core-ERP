# HF CORE ERP

# PROJECT INDEX

**Single Source of Truth (SSOT)**

Versión: 0.1.0

Estado: MVP en Desarrollo

Última actualización: Julio 2026

---

# Propósito

Este documento representa el índice maestro del proyecto HF Core ERP.

Todo desarrollador, asistente de IA o colaborador deberá comenzar aquí antes de realizar cualquier modificación.

Este documento indica:

- Estado del proyecto
- Arquitectura general
- Organización de la documentación
- Organización del código
- Entregables
- Blueprints
- ADR
- Roadmap
- Próximos objetivos

---

# Visión del Proyecto

HF Core ERP nace como el ERP interno de Honestly Foods CA.

Su evolución tiene como objetivo convertirse en un ERP moderno para:

- Startups
- Emprendedores
- PyMEs

priorizando:

- simplicidad
- escalabilidad
- arquitectura limpia
- documentación continua
- reutilización de código
- Inteligencia Artificial integrada

---

# Repositorios Oficiales

## Código

HF-CORE-ERP

Contiene únicamente el código fuente.

---

## Documentación

HF-Core-ERP-Knowledge

Contiene toda la documentación funcional, técnica y arquitectónica.

---

# Arquitectura General

HF CORE ERP

├── Frontend

│ React

│ TypeScript

│ Vite

│

├── UI

│ Design System

│ Componentes reutilizables

│

├── Core

│ Modelos

│ Servicios

│ Reglas de negocio

│

├── ERP

│ Inventario

│ Producción

│ Ventas

│ Compras

│ Clientes

│ Proveedores

│ Finanzas

│ IA

│

└── Documentación

Blueprints

ADR

Roadmap

Lecciones aprendidas

---

# Organización de la Documentación

00_Project

Documentos principales del proyecto.

---

01_Blueprints

Blueprint funcional de cada módulo.

---

02_Architecture

Arquitectura técnica.

ADR.

Modelo de datos.

---

03_AI_Tutor

Base de conocimiento del Tutor IA.

---

04_Database

Modelo de datos.

Colecciones.

Relaciones.

---

05_API

Servicios.

Integraciones.

---

06_UI_UX

Sistema de Diseño.

Experiencia de Usuario.

---

07_Testing

Pruebas.

QA.

Checklists.

---

08_Releases

Historial de versiones.

---

09_Lessons_Learned

Errores resueltos.

Buenas prácticas.

---

10_Backlog

Ideas futuras.

Funcionalidades.

---

# Estado de los Entregables

| ID | Entregable | Estado |
|-----|------------------------------|---------|
| ENT-000 | Fundación del Proyecto | ✅ |
| ENT-001 | Foundation React + Vite | ✅ |
| ENT-002 | Design System Inicial | ✅ |
| ENT-003 | Sidebar + Layout | ✅ |
| ENT-004 | Dashboard MVP | ✅ |
| ENT-005 | Maestro Materias Primas | ✅ |
| ENT-006 | Catálogo de Inventario MVP | 🔄 |
| ENT-007 | Maestro de Productos | ⏳ |
| ENT-008 | BOM Inteligente | ⏳ |
| ENT-009 | Producción | ⏳ |
| ENT-010 | Ventas | ⏳ |

---

# Estado de Blueprints

| Blueprint | Estado |
|------------|---------|
| BP-000 | Fundación | ✅ |
| BP-001 | MVP Foundation | ✅ |
| BP-002 | Arquitectura Inicial | ✅ |
| BP-003 | Maestro Materias Primas | 🔄 |
| BP-004 | Maestro Productos | ⏳ |

---

# Estado de ADR

| ADR | Estado |
|------|---------|
| ADR-001 | Theme System | ✅ |
| ADR-002 | Modelo Inventario | ⏳ |
| ADR-003 | Codificación Productos | ⏳ |

---

# Arquitectura de Datos

Maestros

- Productos
- Materias Primas
- Clientes
- Proveedores
- Recetas (BOM)
- Empleados

Transacciones

- Compras
- Producción
- Ventas
- Inventario
- Ajustes

Configuración

- Empresa
- Parámetros
- Usuarios
- IA

---

# Principios del Proyecto

1. Nunca perder trabajo realizado.

2. Siempre reutilizar código.

3. Toda mejora debe documentarse.

4. MVP primero.

5. Escalabilidad desde el primer día.

6. Arquitectura modular.

7. Código limpio.

8. Git obligatorio.

9. Un entregable siempre debe funcionar antes del siguiente.

10. La documentación tiene el mismo valor que el código.

---

# Próximo Objetivo

Construir el Maestro de Productos.

Este módulo permitirá registrar todos los productos comercializados por la empresa y servirá como base para Producción, Inventario y Ventas.

---

# Última decisión importante

Los identificadores internos del sistema utilizarán UUID.

Los códigos visibles serán configurables por el usuario.

Ejemplo:

HB-C1

HB-C3

HB-C6

Estos códigos podrán modificarse sin afectar las relaciones internas del ERP.

---

# Estado General

Proyecto activo.

Arquitectura estable.

Documentación en construcción.

Desarrollo del MVP en progreso.

---

# ENT-007 — Product Master Module

**Estado:** ✅ COMPLETADO

**Fecha de cierre:** 16/07/2026

## Objetivo

Construcción del Catálogo Maestro de Productos del MVP.

## Implementado

- Modelo Product
- Modelo ProductPresentation
- Relación Product → ProductPresentation
- Datos de ejemplo
- Página ProductsPage
- Componente StatCard
- Dashboard del módulo
- Integración con MainLayout
- Catálogos iniciales
- Documentación técnica

## Resultado

El ERP ya permite visualizar productos y sus presentaciones comerciales utilizando una arquitectura escalable que servirá como base para los módulos de Inventario, Producción y Ventas.

## Repositorios

HF-CORE-ERP ✅

HF-Core-ERP-Knowledge ✅

---

## ENT-008 — Customer Master Module

Estado: ✅ Finalizado

Objetivo:
Implementar el Catálogo Maestro de Clientes.

Incluye:

- Modelo Customer
- Datos de ejemplo
- CustomersPage
- Indicadores
- Prioridad de atención
- Arquitectura preparada para Motor de Decisiones

Repositorio:
HF-CORE-ERP

## ENT-008A — Arquitectura de Navegación

Estado: ✅ Finalizado

Objetivo:
Implementar la navegación profesional del ERP mediante React Router.

Incluye:

- React Router DOM
- AppRouter
- Sidebar conectado
- Navegación entre módulos
- Arquitectura desacoplada

Resultado:

El crecimiento del ERP ya no requiere modificar App.tsx.