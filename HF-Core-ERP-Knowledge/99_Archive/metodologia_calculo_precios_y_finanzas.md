# Especificación Técnica y Metodología Financiera para el Cálculo de Precios y Gestión de Negocios

Documento de referencia para el desarrollo de software de estructuración de costos, determinación de precios de venta, análisis de punto de equilibrio, flujo de caja y valoración financiera.

---

## 1. Fundamentos Matemáticos: Margen Financiero Real vs. Markup

### 1.1 El Error del Markup Tradicional
El recargo simple sobre el costo (Markup) aplica un porcentaje directo sobre la suma de costos. 
* **Fórmula de Markup:** $\text{Precio} = \text{Costo Total} \times (1 + \text{Markup})$
* *Problema:* Si un producto cuesta $100 y se aplica un Markup del 30%, el precio es $130. La ganancia es $30. Sin embargo, sobre el total cobrado ($130), $30 representa un **23.07%**, no el 30%.

### 1.2 Fórmula del Margen Financiero Real (Margen sobre Venta)
Para asegurar que un porcentaje específico de cada unidad monetaria que entra a la caja sea ganancia limpia, se debe calcular el precio dividiendo el costo entre el complemento del margen deseado:

$$\text{Precio de Venta} = \frac{\text{Costo Total Unitario}}{1 - \text{Margen Deseado}}$$

* **Ejemplo:** Si el Costo Total Unitario es $0.706 y se desea un 30% de margen real:
  $$\text{Precio} = \frac{0.706}{1 - 0.30} = \frac{0.706}{0.70} = \$1.008 \approx \$1.01$$

---

## 2. Arquitectura de Costos (Plantilla Maestra de 5 Bloques)

Para determinar el costo real diario o unitario de cualquier producto o servicio, la estructura se divide en 5 bloques fundamentales:

$$\text{Costo Total Diario} = \text{CDV} + \text{MOD} + \text{CIF} + \text{ROI} + \text{Depreciación}$$

| Bloque | Denominación | Definición y Componentes |
| :--- | :--- | :--- |
| **1. CDV** | Costos Directos Variables | Materias primas, insumos consumibles (vasos, empaques) más el **factor de protección por merma**. |
| **2. MOD** | Mano de Obra Directa | Pago del tiempo del operador/vendedor (basado en costo por hora/día ajustado a mercado). |
| **3. CIF** | Costos Indirectos de Fabricación | Servicios públicos (gas, luz, agua), transporte/fletes, alquiler, impuestos, mantenimiento minorista. |
| **4. ROI** | Retorno de Inversión Inicial (Capex Amortization) | Cuota diaria para recuperar la inversión inicial depositada por el dueño/inversionista en un horizonte fijo. |
| **5. Depreciación** | Fondo de Reposición de Activos | Cuota diaria destinada a un fondo de reserva para comprar equipos nuevos al vencer su vida útil. |

---

## 3. Modelo Operativo de Ejemplo: Caso Papelón con Limón

### 3.1 Datos del Negocio
* **Inversión Inicial en Equipos (Capex):** $170.00 (Termo $45, Cucharón $40, Mesa $25, Sombrilla $60).
* **Horizonte de Recuperación ROI deseado:** 3 meses (60 días hábiles).
* **Vida útil estimada de equipos:** 2 años (480 días hábiles).
* **Jornada de trabajo diaria:** 4 horas (Sueldo base de referencia: $150/mes por 80 hrs/mes = $7.50/día).
* **Capacidad de producción/venta diaria:** 15 Litros = 60 vasos de 12 oz.

### 3.2 Desglose Financiero Diario
1. **CDV (Materiales Base):** $30.00 / día
2. **Factor de Merma (5%):** $\$30.00 \times 0.05 = \$1.50$
   * *CDV Ajustado con Merma:* **$31.50**
3. **MOD (Sueldo):** **$7.50**
4. **CIF (Gas):** **$0.20**
5. **ROI (Recuperación Inversión):** $\$170.00 \div 60 \text{ días} =$ **$2.83**
6. **Depreciación (Fondo de Reserva):** $\$170.00 \div 480 \text{ días} =$ **$0.35**

$$\text{Costo Total Diario Real} = \$31.50 + \$7.50 + \$0.20 + \$2.83 + \$0.35 = \mathbf{\$42.38}$$

### 3.3 Métricas Unitarias
* **Costo Unitario (60 vasos):** $\$42.38 \div 60 =$ **$0.706**
* **Precio de Venta (Margen Real 30%):** $\$0.706 \div 0.70 =$ **$1.01 / vaso**

### 3.4 Transición Post-ROI (Mes 4 en adelante)
Al culminar el día 60, el ROI ($2.83/día) queda saldado (100% devuelto al dueño).
* El Costo Total Diario cae a **$39.55**.
* Opciones del sistema/usuario:
  1. Aumentar la utilidad neta pura (+ $56.60 / mes).
  2. Reducir el precio de venta manteniendo el margen deseado.
  3. Reducir el Punto de Equilibrio Operativo.

---

## 4. Análisis del Punto de Equilibrio (Break-Even Point)

El Punto de Equilibrio define la cantidad de unidades que deben venderse para cubrir la totalidad de los costos sin generar pérdidas ni ganancias.

### 4.1 Clasificación de Costos para el Cálculo
* **Costos Fijos Diarios ($CF$):** $\text{MOD} + \text{CIF} + \text{ROI} + \text{Depreciación} = \$7.50 + \$0.20 + \$2.83 + \$0.35 = \$10.88$
* **Costo Variable Unitario ($CDV_{u}$):** $\$31.50 \div 60 = \$0.525$ por vaso.

### 4.2 Fórmulas
$$\text{Contribución Marginal Unitario} = \text{Precio de Venta} - CDV_{u}$$
$$\text{Punto de Equilibrio (Unidades)} = \frac{\text{Costos Fijos Diarios}}{\text{Contribución Marginal Unitario}}$$

### 4.3 Ejemplo
* Con Precio = $1.01 y $CDV_{u}$ = $0.525:
  $$\text{Contribución Marginal} = \$1.01 - \$0.525 = \$0.485$$
  $$\text{Punto de Equilibrio} = \frac{\$10.88}{\$0.485} = 22.43 \approx 23 \text{ vasos}$$

* **Dinámica de Resultados:**
  * Unidades 1 a 22: Zona de Pérdida.
  * Unidad 23: Punto de Equilibrio alcanzado.
  * Unidades 24 a 60: Zona de Ganancia Neta Pura.

---

## 5. Capital de Trabajo (Working Capital)

Es la liquidez en efectivo necesaria para operar antes de cobrar las primeras ventas.

### 5.1 Cálculo de Requerimiento de Liquidez
$$\text{Capital de Trabajo Diario} = \text{CDV} + \text{MOD} + \text{CIF}$$
*(Nota: El ROI y la Depreciación no son desembolsos inmediatos a terceros, por lo que no forman parte de la salida de caja operativa).*

* **Operación Diaria:** $\$31.50 + \$7.50 + \$0.20 = \$39.20$
* **Capital de Trabajo Mensual (20 días hábiles):** $\$39.20 \times 20 = \mathbf{\$784.00}$
* **Capital de Trabajo Mínimo Recomendado (1 semana / 5 días):** $\$39.20 \times 5 = \mathbf{\$196.00}$

### 5.2 Capital Inicial de Arranque Total
$$\text{Capital Total Requerido} = \text{Capex (Equipos)} + \text{Capital de Trabajo (1 mes)}$$
$$\text{Capital Total} = \$170.00 + \$784.00 = \mathbf{\$954.00}$$

---

## 6. Control de Merma (Shrinkage Protection)

Pérdida de materia prima o insumos por caducidad, evaporación, derretimiento o accidentes.

* **Tipos:** Operativa (inevitable) y Accidental.
* **Algoritmo de Aplicación:**
  1. Definir el Porcentaje de Merma ($M\%$, típicamente 5% al 10%).
  2. Ajustar el costo variable: $CDV_{real} = CDV_{base} \times (1 + M\%)$.
  3. Indexar al precio unitario para evitar descapitalización o erosión del sueldo/ganancia.

---

## 7. Depreciación vs. ROI

| Concepto | Objetivo Financiero | Destino del Dinero | Fin del Ciclo |
| :--- | :--- | :--- | :--- |
| **ROI** | Reembolsar el capital aportado por el inversionista inicial. | Bolsillo personal del dueño/inversionista. | Desaparece del costo diario una vez devuelto el 100%. |
| **Depreciación** | Crear una reserva acumulativa para sustituir activos desgastados. | Cuenta de Reserva / Fondo de Reposición del negocio. | Se mantiene activa según la vida útil de los nuevos equipos. |

$$\text{Depreciación Diaria} = \frac{\text{Valor Total de los Activos}}{\text{Días de Vida Útil Estimada}}$$

---

## 8. Estrategias Anti-Inflación y Protección del Capital de Trabajo

Para evitar que la inflación descapitalice la empresa al reponer inventario:

1. **Costo de Reposición:** Calcular costos según el precio proyectado de la próxima compra, no según la factura del pasado.
2. **Reserva de Reposición (Indexación):** Agregar un margen adicional (5%-10%) en el bloque CDV en economías volátiles.
3. **Conversión de Liquidez en Inventario:** Transformar rápidamente el efectivo recaudado en insumos no perecederos.
4. **Revisión Dinámica de Parámetros:** Automatizar el recálculo semanal o diario de la plantilla ante variaciones en insumos clave.

---

## 9. Gestión de Inventarios y Punto de Reorden

### 9.1 Clasificación por Rotación
* **Perecederos (Alta Rotación):** Cobertura para 1 a 3 días. Compras pequeñas y frecuentes para minimizar la merma.
* **No Perecederos (Rotación Controlada):** Cobertura para 7 a 15 días según liquidez.

### 9.2 Fórmula del Punto de Reorden (Stock de Seguridad)
Determina el momento exacto en que debe emitirse una nueva orden de compra:

$$\text{Punto de Reorden} = (\text{Ventas Diarias Promedio} \times \text{Tiempo de Entrega/Reposición en días}) + \text{Stock de Seguridad}$$

* **Ejemplo:** Ventas = 60 vasos/día, Tiempo reposición = 1 día, Stock de seguridad = 60 vasos.
  $$\text{Punto de Reorden} = (60 \times 1) + 60 = 120 \text{ vasos (1.5 paquetes)}$$

---

## 10. Ganancia Contable vs. Flujo de Caja (Liquidez)

* **Ganancia Contable:** Medición teórica en estados financieros ($\text{Ventas Realizadas} - \text{Costos Incurridos}$).
* **Flujo de Caja:** Movimiento real de billetes/efectivo en la cuenta bancaria.
* **Reglas de Prevención de Quiebra:**
  1. Priorizar ventas al contado.
  2. En ventas a crédito, exigir un **anticipo mínimo equivalente al CDV** (cobertura de materiales) antes de procesar la orden.
  3. No financiar operaciones con capital de trabajo destinado al ciclo diario.

---

## 11. Apalancamiento Financiero (Financial Leverage)

Uso de capital de terceros para amplificar la capacidad operativa y el retorno sobre capital propio.

* **Fórmula de Impacto:** $\text{Retorno sobre Capital} = \frac{\text{Ganancia Neta - Intereses}}{\text{Capital Propio Invertido}}$
* **Estructura en Entornos Restringidos (ej. Venezuela):**
  * Crédito bancario condicionado por encaje legal elevado.
  * Alternativas de apalancamiento: Crédito comercial con proveedores, plataformas Fintech / ventas a cuotas, emisión de renta fija / papeles comerciales.

---

## 12. Valoración de Empresas (Business Valuation)

Metodología para poner precio de mercado a una empresa para su venta total o venta de participaciones accionarias.

### 12.1 Método Mixto (Activos + Múltiplo de Flujo de Caja)
$$\text{Valor de la Empresa} = \text{Valor Neto de Activos Tangibles} + (\text{Flujo de Caja Anual Neto} \times M)$$

* **M (Múltiplo):** Entre 1 y 2 para microempresas / negocios pequeños de alto riesgo operativo.

### 12.2 Ejemplo Papelón con Limón
* **Activos Tangibles + Capital de Trabajo:** $358.50
* **Flujo Neto Anual de la Empresa (después de sueldos):** $\$70.00 \times 12 = \$840.00$
* **Múltiplo M = 1:**
  $$\text{Valoración Total} = \$358.50 + \$840.00 = \mathbf{\$1,198.50} \approx \mathbf{\$1,200.00}$$

### 12.3 Negociación con Socios
* Si un socio desea adquirir el 50% de la empresa, su aporte debe ser:
  $$\text{Aporte por 50\%} = \frac{\text{Valoración Total}}{2} = \frac{\$1,200.00}{2} = \mathbf{\$600.00}$$
*(No $85.00 correspondientes a la mitad de los equipos originales, sino la mitad del valor económico presente del negocio).*

---

## 13. Estructura Lógica Recomendada para la Programación del Software

### Parámetros de Entrada (Inputs):
1. **Lista de Materiales e Insumos:** Cantidad, precio unitario de compra, rendimiento por receta.
2. **Porcentaje de Merma Estimado ($M\%$).**
3. **Mano de Obra (MOD):** Sueldo mensual proyectado, horas de trabajo al día/mes.
4. **Costos Indirectos (CIF):** Lista de gastos fijos mensuales/diarios.
5. **Activos e Inversión (Capex):** Detalle de equipos, valor de compra, horizonte ROI (días), vida útil depreciación (días).
6. **Margen Financiero Real Deseado (Margen %).**
7. **Proyección de Ventas Diarias ($N$ unidades).**

### Métricas de Salida Automatizadas (Outputs):
* Costo Directo Variable Unitario ($CDV_{u}$).
* Costo Fijo Diario ($CF$).
* Costo Total Diario y Costo Total Unitario.
* Precio de Venta Sugerido (Fórmula de Margen Real).
* Margen de Contribución Unitario.
* Punto de Equilibrio en Unidades y en Dinero.
* Capital de Trabajo Requerido (1 día, 1 semana, 1 mes).
* Fondo de Depreciación Diario.
* Valoración Estimada del Negocio.
