# KC-Bank — Conciliación bancaria automática

## Objetivo

Crear una plataforma web multiempresa que permita conciliar movimientos bancarios contra CFDI emitidos y recibidos.

La plataforma debe detectar pagos o ingresos sin factura, facturas sin movimiento bancario, diferencias de monto, pagos parciales, anticipos, archivos inválidos y casos que requieran revisión manual.

## Usuarios

La plataforma podrá ser utilizada por cualquier persona o empresa que necesite realizar conciliaciones bancarias. El acceso a empresas, usuarios y funciones dependerá del plan contratado.

## Fuentes de información

### Estados de cuenta bancarios

El sistema debe aceptar obligatoriamente:

- PDF
- Excel
- CSV

Los bancos pueden generar archivos con estructuras diferentes. El sistema debe usar parsers específicos por banco y permitir mapeo manual cuando el formato no sea reconocido.

### CFDI

El sistema debe aceptar:

- XML individual
- múltiples XML
- ZIP con XML
- PDF como documento de apoyo

Los CFDI podrán ser:

- recibidos de proveedores
- emitidos a clientes
- facturas
- notas de crédito
- complementos de pago

La carga manual debe permanecer disponible siempre, aunque posteriormente exista descarga directa desde el SAT.

## Conciliación

La conciliación debe funcionar para ingresos y egresos.

El sistema debe considerar:

- RFC, cuando esté disponible
- monto
- referencia
- descripción
- tipo de movimiento
- fecha como criterio secundario

La fecha no debe ser un criterio obligatorio porque los CFDI pueden emitirse días después del pago.

## Casos especiales

El sistema debe soportar:

- una factura con varios pagos
- un pago para varias facturas
- pagos parciales
- PPD
- PUE
- complementos de pago
- anticipos
- diferencias de monto
- errores de pago
- comisiones
- devoluciones
- conciliación manual

## Alertas

Las alertas son una función central del producto.

El sistema debe avisar sobre:

- movimiento bancario sin CFDI
- CFDI sin movimiento bancario
- XML inválido o dañado
- PDF inválido o no legible
- archivo bancario no reconocido
- diferencia de monto
- pago parcial
- anticipo
- coincidencia ambigua
- movimiento duplicado
- CFDI duplicado
- RFC no identificado
- revisión manual pendiente

## Reportes

Cada conciliación debe permitir exportar resultados en:

- Excel
- PDF

## Volumen inicial

El sistema debe poder procesar como mínimo aproximadamente 1,000 movimientos bancarios mensuales por empresa, sin bloquear la interfaz del usuario.

## Principios obligatorios

1. La carga manual de archivos siempre debe estar disponible.
2. La conciliación manual siempre debe estar disponible.
3. La conciliación automática no debe ocultar coincidencias ambiguas.
4. Toda modificación debe quedar registrada en auditoría.
5. Los datos de cada empresa deben permanecer aislados.
6. Ningún archivo debe descartarse sin mostrar el error al usuario.
7. Los procesos pesados deben ejecutarse en segundo plano.
