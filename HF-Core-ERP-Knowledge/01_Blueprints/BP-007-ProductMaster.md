# BP-007

# Product Master

## Objetivo

Crear el Catálogo Maestro de Productos del ERP.

Este catálogo representa todos los productos que la empresa puede fabricar o comercializar.

No contiene inventario.

No contiene recetas.

No contiene costos.

Únicamente representa la información maestra del producto.

---

## Responsabilidades

Registrar productos.

Clasificarlos.

Permitir su utilización por Producción.

Permitir su utilización por Inventario.

Permitir su utilización por Ventas.

---

## Campos

UUID

Código visible

Nombre

Tipo

Categoría

Unidad de venta

Presentación

Estado

Descripción

---

## Reglas

Los códigos visibles podrán ser configurables.

El UUID nunca cambiará.

Un producto podrá existir aunque aún no tenga receta.

Un producto podrá estar inactivo sin eliminarse.

---

## Dependencias

Ninguna.

---

## Futuras ampliaciones

Fotografía

Código de barras

QR

Etiquetas

Costos

Recetas

Lotes

Vencimientos

Impuestos


## Decisión de Arquitectura

A partir de ENT-007, el sistema separa la entidad Producto de sus Presentaciones.

Esta decisión permitirá manejar múltiples presentaciones, listas de precios, códigos de barras, inventario y estrategias comerciales sin duplicar información del producto base.

La entidad Product representa la identidad comercial del producto.

La entidad ProductPresentation representa cada forma específica en la que ese producto puede comercializarse.


## Relaciones

Product (1)

↓

ProductPresentation (N)

Un producto puede tener múltiples presentaciones comerciales.

Cada presentación pertenece a un único producto.

## Estado del MVP

La versión MVP muestra el catálogo de productos y sus presentaciones comerciales.

No incluye aún:

- Precios
- Inventario
- Recetas (BOM)
- Costos
- Impuestos
- Fotografías

Estos módulos serán incorporados en entregables posteriores.

## Catálogos Maestros

Durante el MVP, las categorías y unidades de venta se gestionan mediante catálogos internos.

En versiones posteriores estos catálogos serán administrados desde el módulo de Configuración del ERP, sin modificar la estructura de los modelos.