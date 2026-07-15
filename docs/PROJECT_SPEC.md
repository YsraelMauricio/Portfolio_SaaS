# PROJECT_SPEC.md — Especificación Maestra del Proyecto

**Autor:** Ysrael Mauricio Lopez Rossel · **Versión:** 3.6 · **Estado:** Para revisión

> **Nota para agentes de IA que lean este documento:** este es el documento de más alto nivel del proyecto — la fuente de verdad sobre *qué* se construye y *por qué*. El *cómo* exacto vive en los documentos complementarios generados después de este: `README.md`, `ARCHITECTURE.md`, `DATA_MODEL.md`, `API_SPEC.md`, `STYLEGUIDE.md`, `AGENTS.md`, `PLAN.md`, `TASKS.md`, `DECISIONS.md`, `CONSTRAINTS.md`, `TESTS.md`, `SECURITY.md`. Si una instrucción entra en conflicto con este documento, este documento tiene prioridad. No infieras patrones no escritos — si algo no está explícito aquí, pregunta.

**Historial de versión:** v1.0 cubría el sistema base. v2.0 sumó enlaces de perfil, tecnología de escritorio por SO, asincronía de frontend, fotos de perfil, ambientes/datos de prueba, contratos y firma electrónica, cancelación/reembolso, portabilidad de datos, tiempos de entrega. v3.0 sumó: handoff de chatbot a WhatsApp con resumen, planes de mantenimiento, categoría de mantenimiento a la carta en el cotizador, opción de sitio WordPress económico, lazo de retroalimentación para recalibrar el cotizador, sección de seguridad dedicada, aclaración sobre aviso de cookies, y entorno de desarrollo confirmado. **v3.1** es una corrección de consistencia, sin decisiones de producto nuevas: todos los nombres de tabla/campo/ruta de API mencionados en este documento pasan a inglés, para alinearse con `DATA_MODEL.md` y `API_SPEC.md` (que ya usan inglés) y con las convenciones del propio ecosistema Laravel/Next.js. Las URLs que ve el visitante del sitio siguen localizadas vía `next-intl` — esto no cambia. **v3.2** suma: quinta categoría del cotizador — Soporte Técnico (solo Bolivia) con mantenimiento general de equipo e instalación de software con licencia del cliente; sección de SEO formalizada (antes solo conversada, nunca escrita); y el mecanismo de escalamiento del chatbot corregido para cubrir WhatsApp, Telegram y correo con notificación paralela al admin. **v3.3** resuelve dos vacíos reales encontrados al revisar a fondo: el lazo de retroalimentación ahora excluye automáticamente proyectos con cambio de alcance (`scope_changed`) antes de llegar a revisión humana, y se activa desde el lanzamiento (no como parte diferida de moneda) la conversión USD→BOB necesaria para que el QR boliviano pueda cobrar, con tasa editable por el admin y sobreescribible por transacción. **v3.4** cierra un vacío que solo salió a la luz al preguntarlo directamente: hasta ahora el admin solo podía editar el precio de un modificador ya existente — crear una categoría, tipo de producto o grupo de extras completamente nuevo no tenía endpoint propio y hubiera requerido código. Ahora las cuatro piezas del cotizador (categorías, tipos de producto, grupos de extras, extras) tienen gestión completa desde el admin, sin tocar código para expandir la oferta de servicios en el futuro. **v3.5** es una auditoría completa de estados: cada `enum` de `DATA_MODEL.md` se verificó contra si existía un camino real en `API_SPEC.md` para alcanzarlo. Se encontraron y corrigieron siete casos donde no lo había — un estado `cancelled` en contratos sin endpoint, pagos que solo registraban éxito y nunca rechazo, suscripciones de mantenimiento sin forma de pausarse, proyectos sin estado terminal de cancelación, `scope_changed` sin ningún endpoint que lo pudiera marcar, la generación de contrato para "proyecto a medida" sin explicar de dónde salen los datos cuando no hay cotización de origen, y el PDF del contrato guardado fuera del mismo sistema de archivos que todo lo demás. También se hizo explícito el orden de dependencia de migraciones entre `projects`/`contracts`/`payments` en `TASKS.md`, dado que ese orden importa para las llaves foráneas y antes quedaba implícito. **v3.6**, pensada específicamente para agentes gratuitos/menos capaces que se comunican entre sí (ej. DeepSeek vía OpenCode): "SES" se expande la primera vez que aparece (colisiona con Amazon SES); la ventana de retención de cuentas pasa de rango ("30-90 días") a un valor único y exacto en `settings` (60 por defecto, ajustable, pero uno solo a la vez — nunca un rango que cada agente interprete distinto); "cotizador" queda explícitamente enlazado a la tabla `quotes` en una sola frase, en vez de inferirse del contexto; la forma exacta de `quote_snapshot` queda definida como estructura fija, para que el camino automático (desde una cotización real) y el manual (proyecto a medida) produzcan siempre el mismo formato; y los límites de tasa pasan de "generoso"/"estricto" a cifras exactas (60/min y 5/min respectivamente).

---

## 1. Resumen ejecutivo

Esta no es una especificación de portafolio. Es la especificación de una **plataforma completa** que integra portafolio técnico, blog, landing de servicios, un **motor de cotizaciones paramétrico** (precio y tiempo de entrega), **generación automática de contratos con firma electrónica**, chatbot con IA (con escalamiento a humano vía WhatsApp), sistema de pagos multi-proveedor, planes de mantenimiento recurrente, dashboard de cliente y panel de administración con inteligencia de negocio.

Objetivo doble: (a) generar ingresos reales vendiendo servicios de desarrollo, y (b) ser la demostración más completa posible de capacidad de arquitectura y desarrollo full-stack de su autor.

---

## 2. Filosofía y restricciones no negociables

1. **Cero SaaS de pago durante el desarrollo.** Pagos previstos solo al desplegar (hosting) y comisiones normales de pasarelas de pago.
2. **"Laravel primero" rige la arquitectura de la plataforma propia — no las tecnologías que se ofrecen como servicio a un cliente** (ej. WordPress es una opción de servicio legítima, sección 9, sin contradecir este principio).
3. **API-first, desacoplado**, incluso en monorepo.
4. **Diseño completo ahora, desarrollo por fases.**
5. **Todo lo posible, self-hosted y open-source.**
6. **Ninguna decisión de UX se siente a presión de venta.**
7. **El código fuente completo siempre está incluido en el precio.**
8. **Hosting, dominio y SSL corren por cuenta del cliente**, declarado explícitamente.

---

## 3. Stack tecnológico

| Capa | Tecnología | Notas |
|---|---|---|
| Frontend | **Next.js 16** (App Router, Turbopack) + **React 19** | |
| Estilos | **Tailwind CSS 4.3** | OKLCH, container queries |
| Backend | **Laravel 13** (PHP 8.3+) | AI SDK nativo multi-proveedor |
| Base de datos | **PostgreSQL** | Búsqueda de texto completo |
| Cache / Colas | **Redis** | |
| Tiempo real | **Laravel Reverb** | |
| Roles y permisos | **Spatie Laravel-Permission** | |
| Archivos y medios | **Spatie Media Library** | |
| Internacionalización | **next-intl** | |
| Analítica | **Umami** (self-hosted, sin cookies) | |
| Newsletter | **Listmonk** (self-hosted) | |
| Monitoreo de errores | **GlitchTip** (self-hosted) | También vendible como parte de planes de mantenimiento |
| Anti-spam | **Cloudflare Turnstile** | |
| Firma electrónica | **Documenso** (self-hosted) | Nivel SES (Simple Electronic Signature — no confundir con Amazon SES) bajo eIDAS |
| Correo (desarrollo) | **Mailpit** | |
| Contenedores | **Docker Compose** | ~10 servicios — ver nota de entorno en sección 25 |
| IA / Chatbot | **Groq** (principal) | Respaldo en fase final |
| Moneda futura | **fawazahmed0/currency-api** | Integración diferida |
| Dependencias | **Dependabot** (GitHub, gratis) | Escaneo automático de vulnerabilidades |

**Explícitamente fuera por defecto:** Nest.js (salvo necesidad justificada), Google Analytics, Stripe (sin soporte de comercio en Bolivia), Payoneer como método de cobro en el sitio.

---

## 4. Arquitectura general

**Monorepo:**
```
/
├── frontend/ ├── backend/ ├── infra/ ├── .github/workflows/
├── docs/ (toda la documentación — sí se sube a GitHub)
├── AGENTS.md └── README.md
```

**API versionada** desde el día uno (`/api/v1/...`). **CORS** configurado explícitamente — solo los orígenes del propio frontend autorizados a llamar la API.

**Ambientes explícitos:** desarrollo/local (Docker Compose), staging (réplica de producción), producción.

**Datos de prueba:** desarrollo/staging vía Seeders/Factories de Laravel (`php artisan migrate:fresh --seed`, nunca borrado manual). Pruebas finales en producción real vía campo `is_test` en `quotes`/`projects`/`contracts`/`payments` — el dashboard de BI filtra `is_test = false` por defecto.

**Asincronía — dos capas:**
- *Backend (Laravel Queue + Redis):* correo, respuestas del chatbot (streaming vía Reverb), anonimización de cuentas, precómputo de métricas, PDF de cotizaciones/contratos, actualización de tipo de cambio (futuro).
- *Frontend (Next.js):* React Server Components + streaming, Suspense/skeletons (crítico en el cotizador), fetching de cliente para piezas interactivas, actualizaciones optimistas.

**Idempotencia de pagos:** verificación de ID de transacción único antes de procesar cualquier webhook — evita procesar el mismo pago dos veces.

**Rate limiting** en endpoints públicos de alta frecuencia (cálculo de cotización) y en intentos de login (protección de fuerza bruta — ver sección 17).

---

## 5. Sistema de diseño — "Índigo Profundo"

Liquid Glass: superficies translúcidas con `backdrop-filter` real, profundidad en capas, *mesh gradient*.

**Modo oscuro:** fondo `#09090B` · primario `#6D28D9` · acento/CTA `#00D4FF` · secundario `#34D399` · texto `#FAFAFA`.
**Modo claro:** fondo `#F4F2FB` · primario `#6D28D9` · acento/CTA `#00A9D6` · secundario `#0EA371` · texto `#1E1B2E`.
**Tipografía:** Space Grotesk (display) · Inter (cuerpo) · JetBrains Mono (código/labels). Sin cobertura de glifos chinos — fuente de respaldo (Noto Sans SC) solo si se vuelve prioridad.

**Reglas de vidrio:** `backdrop-filter: blur(24px) saturate(160%)` base; blur pesado limitado a 2-3 superficies hero por página; variante "vidrio liviano" para gama baja de Android.

**Accesibilidad:** contraste WCAG AA verificado, navegación por teclado completa en el wizard, etiquetas de lector de pantalla en íconos, `prefers-reduced-motion` y `forced-colors`.

**Responsive:** container queries de Tailwind 4.3, tipografía fluida (`clamp()`), unidades `dvh`, `next/image`.

---

## 6. Internacionalización

Inglés principal, español secundario, en todo el sitio desde el lanzamiento (`/en/...` default, `/es/...`). Soporte básico de layout para chino/francés/alemán. Regla obligatoria: ningún ancho fijo en botones/badges/campos. Gestión vía `next-intl`.

---

## 7. Mapa del sitio

`/` · `/portafolio` (filtrable, botón "Ver más en GitHub") · `/servicios` · `/cotizar` · `/mantenimiento` (planes, sección 10) · `/blog` · `/sobre-mi` (certificaciones, LinkedIn, CV) · `/dashboard` · `/admin` · `/privacidad`, `/terminos`, `/cookies`, `/aviso-legal`.

**Enlaces de perfil** (GitHub, LinkedIn, CV, futuros YouTube/Discord/Udemy): tabla `profile_links` (key, url, visible, sort_order), editable desde el admin — extensible sin tocar código. Visibles en footer persistente y en `/sobre-mi`.

---

## 8. Roles, estados y perfiles

**3 roles** (Spatie Permission): **Visitante** (precios de referencia, cotizador anónimo en tiempo real) · **Cliente registrado** (guardar/comparar cotizaciones, comentar blog, ver progreso, exportar sus datos) · **Admin** (control total, incl. cuentas eliminadas dentro de ventana de retención).

**Estado de proyecto:** por proyecto individual, no por cliente — pipeline `Enviada → En revisión → Aprobada → En desarrollo → Entregada`, con hitos intermedios opcionales para proyectos grandes.

**Foto de perfil:** importada automáticamente desde el proveedor OAuth al registrarse (Google/GitHub/Facebook, sin costo extra vía Socialite), reemplazable después. Registro por correo/contraseña sin foto → avatar generado con iniciales. Misma lógica para admin.

---

## 9. Motor de cotizaciones

> En el resto de este documento, "cotizador" y "motor de cotizaciones" se refieren siempre al mismo sistema que `DATA_MODEL.md`/`API_SPEC.md` implementan como la tabla `quotes` y las rutas `/quotes/*` — un nombre de producto en español, una sola implementación en inglés. No son dos cosas distintas.

Motor de reglas paramétrico, cinco categorías:

```
Categoría (Web / Móvil / Escritorio / Mantenimiento y modificaciones / Soporte Técnico)
 └─ Tipo de producto
      └─ Alcance técnico
           └─ Nivel de UX
                └─ Extras
```

### Web

| Tipo | Tiempo | Notas |
|---|---|---|
| Landing page | 5 días | Incluye 1 ronda de revisión |
| **Sitio WordPress (económico)** | 3-5 días | Alternativa de menor costo — tema + page builder, sin código a medida, por eso más rápido incluso que una landing custom. Fuerte candidato de entrada hacia planes de mantenimiento (WordPress requiere actualizaciones más frecuentes por ser objetivo común de ataques). Sinergia natural con Hostinger como destino de despliegue. |
| Web completa — básica | 15 días | Informativa/corporativa, panel simple |
| Web completa — con lógica de negocio | 25-30 días | Calibre OdontoTeam |
| E-commerce | 20-25 días | Carrito, catálogo, checkout, pagos del cliente |
| SaaS | Desde 30 días (piso) | Alcance final confirmado en llamada de descubrimiento |

En el paso de selección, un texto breve aclara la diferencia entre WordPress y stack custom (velocidad/precio vs. control/personalización) — para autoselección informada, no para empujar hacia lo más caro.

### Móvil y Escritorio

| Tipo | Tiempo |
|---|---|
| App nativa (Android o iOS) | 20 días |
| App Flutter (ambas) | 25 días |
| App escritorio — Electron/Tauri | 15 días |
| App escritorio — nativa (ej. C#) | Mayor — atado a la tecnología, no un número plano |

Tabla de tecnología de escritorio por caso: Windows profundo → C# (.NET/WPF/MAUI); macOS → Swift/SwiftUI o Electron/Tauri; multiplataforma → Tauri o Electron; escritorio + móvil compartido → Flutter Desktop.

### Mantenimiento y modificaciones (a la carta, sin plan)

Reutiliza toda la infraestructura del cotizador (precio/tiempo en tiempo real, contrato, pago) en vez de un sistema aparte. Modificadores propios:
- **Tamaño del cambio:** menor / mediano / mayor
- **Urgencia:** normal / urgente

Para mantenimiento *recurrente* con compromiso mensual/anual, ver **sección 10** — son productos distintos, no se mezclan.

### Soporte Técnico (solo Bolivia — trabajo presencial/local)

Categoría marcada `bolivia_only` — visible para todos, pero rotulada con claridad ("Solo disponible en Bolivia") para que un visitante internacional se autoseleccione fuera sin necesidad de bloqueo geográfico poco confiable.

| Tipo | Precio | Notas |
|---|---|---|
| Mantenimiento general de equipo | $30 | Paquete: limpieza física, cambio de pasta térmica, formateo/reinstalación de SO |
| Instalación y configuración de software | $5 por programa | **El cliente aporta su propia licencia** (comprada, o de un plan educativo genuino — ej. licencias reales de estudiante/docente de Autodesk). El servicio cobra la mano de obra de instalación/configuración, nunca el software en sí. Para quien no tiene licencia, se sugieren alternativas libres reales (GIMP, Inkscape, FreeCAD/LibreCAD) antes que cualquier otra vía — nunca se recurre a software de origen no verificado o pirateado, sin excepción. |

### Comportamiento del motor
Precio y tiempo en tiempo real, sin gating · rangos con colchón integrado (no advertencias aparte) · **"Próxima fecha de inicio disponible"** visible, calculada desde el pipeline actual, editable por el admin · guardar/comparar cotizaciones · ruta propia (`/cotizar`) + enlace desde Servicios · salida de escape a "proyecto a medida" · aviso de código fuente incluido y hosting/dominio/SSL a cargo del cliente · extra de "configuración y despliegue inicial".

### Lazo de retroalimentación (recalibración trimestral)

Cada proyecto entregado ya tiene, gracias al contrato congelado (sección 11), lo que se cotizó (precio, tiempo, modificadores elegidos) y lo que realmente pasó (pago final, fecha real de "Entregada"). La comparación **es automática de punta a punta**, con dos filtros que limpian la señal antes de que llegue a cualquier persona:
- Los días en que el proyecto estuvo pausado esperando al cliente (`paused_days`) se restan antes de calcular la desviación.
- Los proyectos marcados con `scope_changed` (el admin lo marca en el momento, cuando un cliente pide algo fuera de lo contratado — un clic, no trabajo extra) se **excluyen** de la comparación: esa desviación no dice nada sobre si el precio original estaba bien calibrado.

Con esos dos filtros aplicados, el sistema agrega **por categoría** (no por modificador individual — con el volumen de un freelancer solo, una atribución a nivel de modificador sería estadísticamente poco confiable) y genera una **sugerencia concreta de ajuste** ("subir este modificador de $X a $Y"), no solo un reporte de números crudos.

La decisión final de aplicar cada sugerencia **siempre la confirma una persona** — un botón de aceptar/ajustar/ignorar por sugerencia, no recalcular desde cero. Esto no es desconfianza del cálculo: con 2-3 proyectos por categoría en un trimestre, un ajuste 100% automático puede moverse por ruido de una sola muestra atípica que los dos filtros de arriba no alcanzaron a capturar. El costo real de mantener a la persona en el loop es un clic por sugerencia cada tres meses, no rehacer el análisis. Se guarda un historial ligero (`price_change_history`) de cómo evolucionó cada modificador. El sistema genera un recordatorio/alerta trimestral automático (mismo mecanismo que las demás alertas de BI) para que esta revisión no se olvide.

---

## 10. Planes de mantenimiento

Producto distinto al cotizador — sin "configuración" real, solo elección de nivel. Página propia con tarjetas de precio (patrón SaaS clásico), mensual o anual (anual con descuento, reduce cancelaciones). Niveles sugeridos, a escalar en inclusiones:
- Horas o cambios menores incluidos por mes.
- Tiempo de respuesta garantizado.
- Actualizaciones de seguridad y dependencias.
- Backups verificados.
- Monitoreo de errores (GlitchTip) como beneficio visible para el cliente, no solo infraestructura interna.
- Soporte prioritario por WhatsApp/correo.

WordPress (sección 9) es el candidato natural de entrada a este embudo, dada la frecuencia de mantenimiento que ese tipo de sitio típicamente requiere.

---

## 11. Sistema de contratos y firma electrónica

**Orden fijo:** cotización aceptada → contrato como **borrador automático** → admin aprueba/envía (no 100% automático, cubre casos "a medida") → cliente firma (Documenso) → **recién ahí** se solicita el pago/anticipo.

**Fotografía congelada:** el contrato copia los datos de la cotización al generarse (precio, tecnologías, alcance, tiempo) — no referencia en vivo el registro de cotización. Para el camino de "proyecto a medida" (sin cotización paramétrica limpia detrás), no hay de dónde copiar automáticamente — el admin completa esos mismos campos a mano al generar el contrato, en vez de que el sistema los infiera.

**Cancelación de un contrato aún no firmado** (distinto de la cancelación de un proyecto ya en marcha, más abajo): válida en borrador, aprobado-pendiente-de-envío, o enviado — nunca sobre uno ya firmado, que sigue el proceso de cancelación/reembolso normal en su lugar.

**Fecha de entrega:** confirmada como fecha de calendario concreta al firmar, calculada contra la cola de trabajo real. Reloj en días hábiles, pausado mientras se espera al cliente; empieza con la última de: contrato firmado + anticipo recibido + materiales del cliente entregados. Hitos intermedios para proyectos grandes, atados a la tabla de pagos parciales. Cláusula de extensión reservada a casos excepcionales — no el mecanismo para variación normal.

**Firma — Documenso**, nivel SES (Simple Electronic Signature, sección 3) bajo eIDAS, válido para procesos operativos estándar. Guía de firma incluida en el correo de entrega (bilingüe): abrir enlace → leer → firmar (clic + nombre) → confirmar y recibir copia.

**Cancelación/reembolso** (cláusula en Términos de Servicio): anticipo no reembolsable una vez iniciado el desarrollo; reembolsable si se cancela antes.

---

## 12. Sistema de pagos

Contrato `PaymentProvider`, una implementación por método:

| Método | Público | Automatización | Moneda del cobro |
|---|---|---|---|
| QR Boliviano (OpenBCB) | Local | Automática — API gratuita del Banco Central | **Bolivianos** — el sistema interbancario boliviano solo mueve BOB, así que el monto en USD del contrato se convierte al momento de generar el código (ver sección 13) |
| Binance Pay (USDT) | Internacional | Automática — **recomendado/destacado** | USD (USDT, prácticamente 1:1) — sin conversión |
| PayPal | Internacional | Automática para el cobro; conversión a bolivianos vía AirTM, fuera del sistema | USD — sin conversión |
| Transferencia + comprobante | Montos medios/altos | Manual, confirmación del admin | BOB o USD según la cuenta del cliente — ambos campos disponibles |
| "Prefiero hablar directamente" | Cualquiera | Redirige a contacto (WhatsApp/Telegram/correo) | — |

Todas las opciones con igual facilidad de uso — se permite destacar/ordenar, nunca penalizar. Pago parcial/anticipo soportado vía tabla de pagos vinculada al proyecto, cada pago con su propio monto, método y — cuando aplica — su propia conversión de moneda (sección 13). Cada webhook verifica firma criptográfica del proveedor antes de procesar (sección 17).

---

## 13. Moneda

El sitio **muestra y cotiza únicamente en USD** — eso no cambia. Pero "mostrar en dólares" y "cobrar" son dos cosas distintas, y ahí hay un matiz que vale la pena separar bien:

- **Pagos internacionales (PayPal, Binance Pay) nunca salen de dólares** — no hay nada que convertir, por eso se eligieron esos rieles para ese público.
- **El QR boliviano sí necesita una conversión USD→BOB**, porque el riel bancario local solo mueve bolivianos — esto es una realidad del sistema financiero boliviano, no una elección de diseño. Esta conversión **se activa desde el lanzamiento**, usando la tabla `exchange_rates` ya definida: una tasa que el admin actualiza manualmente (con el valor del BCB como referencia sugerida vía job diario, nunca una llamada en vivo por transacción), con redondeo para evitar centavos. El admin puede además **sobreescribir la tasa para un pago puntual** si negoció un valor distinto con ese cliente — cada pago guarda la tasa exacta que se le aplicó, no una tasa global que cambia con el tiempo y confunde el historial.
- **La integración con `fawazahmed0/currency-api`** (soporte a cualquier moneda del mundo, no solo BOB, para mostrar precios en otras monedas a otros visitantes) **sigue diferida** — eso es un alcance distinto y más amplio que la conversión puntual USD↔BOB que se necesita ya para que el QR funcione.
- El dashboard de BI y todo reporte siempre calculan sobre `amount_usd` — el monto en moneda local de un pago es solo su registro de auditoría puntual, nunca entra a ninguna suma o promedio.

Mensaje de valor sobre tarifas basadas en Bolivia vía badge, nunca pop-up (sin cambios respecto a la versión anterior).

---

## 14. Chatbot / IA

Rol mixto: comercial + soporte/FAQ + demostración de expertise en IA. Proveedor principal **Groq**; respaldo en fase final. Orquestación probable vía AI SDK de Laravel 13 (tool-calling, vector store para RAG sobre contenido propio).

**Escalamiento a humano:** botón explícito "Hablar con Ysrael", siempre visible en el widget de chat (mecanismo principal y confiable) — el bot puede sugerirlo proactivamente si detecta la misma pregunta repetida 2-3 veces (capa opcional, no el mecanismo base; detección de frustración por sentimiento es poco confiable como base).

Al activarse, el cliente elige (o usa su preferencia ya declarada) el canal: **WhatsApp, Telegram o correo**. Una llamada adicional al AI SDK resume la conversación, y según el canal elegido se arma un enlace con ese resumen prellenado — `wa.me` para WhatsApp, `t.me/usuario` para Telegram (requiere tener un @usuario público de Telegram configurado), o `mailto:` para correo — los tres soportan texto prellenado y ninguno envía nada automáticamente: el cliente siempre da el último clic de confirmación desde su propia cuenta, lo que evita mensajes sin consentimiento y confirma intención real. El resumen queda editable antes de enviar.

**Importante sobre qué pasa después:** el chat del sitio no continúa — la conversación se traslada por completo al canal elegido, y a partir de ahí **responde el propio Ysrael**, manualmente, como cualquier conversación humana (no hay bot del otro lado). El widget del sitio queda inactivo para esa conversación una vez generado el enlace.

**Sin importar el canal que el cliente elija, se dispara además una notificación por correo al admin** (reutilizando el sistema de notificaciones de la sección 20) — así el aviso no depende de que Ysrael tenga el teléfono a mano en ese momento.

---

## 15. Blog y contenido

Panel de administración propio en Laravel. Cuatro pilares: casos de estudio (OdontoTeam, AIIS, esta plataforma) · contenido educativo para no-técnicos · IA aplicada · tutoriales técnicos. Comentarios solo para usuarios registrados. Bilingüe desde el lanzamiento.

---

## 16. Legal y fiscal

**Páginas legales:** Privacidad, Términos y Condiciones (incl. cancelación/reembolso), Cookies, Aviso Legal — redacción propia, revisión de abogado boliviano recomendada antes de ingresos significativos.

**Aviso de cookies:** dado que Umami es sin cookies por diseño y no hay redes publicitarias ni píxeles de terceros, el sitio probablemente **no necesita** el banner intrusivo tipo "acepta todas las cookies" — las cookies estrictamente necesarias (sesión de Laravel) están generalmente exentas del requisito de consentimiento. En su lugar: un aviso pequeño y no bloqueante en el footer (divulgación, no una puerta de consentimiento). Confirmar redacción exacta con el abogado que revise Términos.

**NIT:** no disponible actualmente; ley boliviana exige inscripción en el SIN para servicios habituales, el Régimen Simplificado no cubre desarrollo de software. Proyecto de ley SIETE-RG (marzo 2026) aún no vigente. Recomendación: consultar contador antes del lanzamiento. Sistema opera en **modo "recibo"** hoy; **modo "factura"** como configuración lista para cuando el NIT esté disponible.

**Eliminación de cuentas:** soft-delete, retención de **60 días por defecto** (valor exacto en `settings`, ajustable por el admin entre 30 y 90 — pero un solo número vive en el sistema en cualquier momento dado, nunca un rango que cada agente interprete distinto), luego anonimización (Laravel Observer) conservando solo agregados; registros de facturación con retención propia. Encuesta de salida opcional, no bloqueante.

**Portabilidad de datos:** cliente registrado puede exportar sus propios datos (cotizaciones, proyectos, contratos) desde su dashboard.

---

## 17. Seguridad

Sección dedicada — no solo mencionada de paso, dado el volumen de dinero y datos personales que la plataforma maneja.

- **Verificación de firma criptográfica en cada webhook de pago** (PayPal, Binance Pay, OpenBCB) — además de la idempotencia (sección 4), confirma que el webhook realmente vino del proveedor real, no de una simulación.
- **2FA obligatorio para la(s) cuenta(s) admin** — el resto de roles no lo necesita, pero la cuenta con acceso a finanzas, datos de clientes y contratos sí.
- **Rate limiting en intentos de login**, no solo en el cotizador — protección contra fuerza bruta.
- **Dependabot activo en GitHub** — escaneo automático de vulnerabilidades conocidas en dependencias.
- **Protección estructural por stack:** Eloquent (Laravel) contra inyección SQL, JSX (React) contra XSS — mitigado por el framework, no solo por disciplina manual.
- **RBAC vía Spatie Permission** (sección 8), extensible sin reescritura.
- **Turnstile** en formularios públicos y cotizador (sección 4).
- **Credenciales nunca en el repositorio** — `.env.example` con nombres de variable, `.env` real en `.gitignore` desde el primer commit.
- **HTTPS forzado en todo el sitio**, sin contenido mixto.
- Detalle de implementación completo en `SECURITY.md` (fase de documentos complementarios).

---

## 18. Panel de administración y Business Intelligence

**Gestión:** blog, **estructura completa del cotizador** — categorías, tipos de producto y sus extras, no solo el precio de lo que ya existe: crear una categoría nueva (ej. una futura línea de "Soluciones con IA") con sus propios tipos de producto y extras se hace enteramente desde aquí, sin código ni despliegue —, planes de mantenimiento, leads/cotizaciones, progreso de proyectos (incl. hitos), contratos (aprobar/enviar borradores), testimonios, cuentas eliminadas, enlaces de perfil, CV, configuración del sitio.

**Configuración del sitio** (`settings`, clave-valor, cacheada): contacto, datos de cuenta para QR/transferencia, tipo de cambio manual (futuro), textos de badges, próxima fecha de inicio disponible.

**Dashboard de gerencia (BI)** — filtra `is_test = false`:
Crecimiento de clientes · ventas por período vs. anterior · embudo de conversión · valor promedio de cotización/proyecto · pipeline activo · distribución por categoría de servicio · tasa de clientes recurrentes · atribución de contenido (Umami) · pronóstico de ingresos ponderado · abandono por paso del configurador · **comparación trimestral cotizado vs. real por categoría** (sección 9) · alertas automáticas (ventas, leads sin respuesta, recordatorio de revisión trimestral) · *(futuro)* lead scoring.

---

## 19. Autenticación

Email + contraseña, más Google/GitHub/Facebook (Laravel Socialite, gratuitos para autenticación estándar).

## 20. Notificaciones

Correo electrónico e in-app (campana en dashboard), ambas.

## 21. Contacto

Botón flotante: WhatsApp, Telegram, correo — también como opción de pago (sección 12) y como destino del escalamiento del chatbot (sección 14).

---

## 22. Naming y branding

Nombre personal del autor, no marca de empresa — sin tematización de terceros por riesgo de IP. "Índigo Profundo" como identidad de producto/sistema de diseño. Dominio con nombre propio, correo profesional propio. Logo: monograma o marca abstracta de refracción de vidrio.

---

## 23. Recursos visuales

**Foto personal:** recorte sin fondo (GrabCut), desvanecido hacia el mesh gradient, sin marco rectangular tradicional, leve tinte de paleta.

**CV descargable:** subido/reemplazable desde el admin (Spatie Media Library). Sin visor de PDF embebido (rompe la estética); tarjeta de descarga con ícono, nombre, fecha de actualización, tamaño, botón. Curación de contenido del CV: fuera de alcance de este documento.

---

## 24. SEO

Dado que el sitio depende de tráfico orgánico, esto no es un extra — es arquitectura desde el día uno, con lo más actual de Next.js 16:

- **Metadata API jerárquica**: `metadataBase` y `title.template` en el layout raíz, `generateMetadata` por página dinámica (posts de blog, casos de portafolio) leyendo desde la base de datos, nunca strings fijos.
- **JSON-LD estructurado**: esquemas `Organization`/`Person` en el layout global, `Service` en `/servicios` y el cotizador, `Article` en cada post del blog — renderizado en el servidor, nunca inyectado por JS del lado del cliente.
- **`sitemap.ts` y `robots.ts` generados por código** (no archivos XML estáticos), consultando la base de datos para incluir cada post/proyecto de portafolio publicado; `robots.ts` bloquea `/admin/`, `/dashboard/`, `/api/`.
- **`hreflang` + canonical autoreferenciado por idioma** — obligatorio dado el sitio bilingüe (sección 6), cada página en `/en/` y `/es/` se referencia mutuamente.
- **Core Web Vitals con los umbrales vigentes**: LCP ≤2.5s, CLS ≤0.1, **INP ≤200ms** (reemplazó a FID como métrica de interactividad) — conecta directo con la restricción de blur pesado del sistema de diseño (sección 5): cada superficie de vidrio adicional es un costo real medible contra estos números, no solo estético.
- **`next/font`** autoalojando Space Grotesk/Inter/JetBrains Mono — evita el salto de layout (CLS) de cargar fuentes de Google en vivo.
- **GEO (Generative Engine Optimization)**, más allá del SEO tradicional: el mismo JSON-LD de arriba, más estructura clara de preguntas/respuestas en el contenido educativo del blog, para que motores generativos (ChatGPT, Gemini, Perplexity) puedan citar el sitio directamente en sus respuestas — un canal de descubrimiento cada vez más relevante, no un capricho.
- Google Search Console configurado desde el lanzamiento, monitoreo de Core Web Vitals con datos de campo real, no solo pruebas sintéticas.

---

## 25. Flujo de trabajo y control de versiones

Git desde el primer commit, monorepo privado en GitHub. **Toda la documentación (`docs/`) se sube al repositorio.**

**Commits:** `tipo(área): descripción breve`. Tipos: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`, `ci`. Un commit por sub-tarea verificada; una rama por tarea (`feat/...`); PR aprobado por el agente revisor antes de mergear.

**Credenciales:** nunca en el repositorio; solo nombres de variable en `.env.example`.

**Memoria persistente entre sesiones de agentes:** OpenCode compacta automáticamente dentro de una sesión larga, pero no conserva memoria nativa entre sesiones separadas. La memoria persistente real son **`TASKS.md`, `DECISIONS.md` y `PLAN.md`**, versionados en git — checkboxes con ID único, referencia a fase en `PLAN.md`, marcados completos solo cuando el commit correspondiente ya pasó.

**Entorno de desarrollo confirmado** (sin cambios necesarios, evaluado con justificación): Fedora como SO, Warp como terminal (soporte de producción verificado en Fedora), pgAdmin para PostgreSQL. VS Code como editor por defecto; Zed queda anotado como alternativa más liviana a considerar si el rendimiento se siente ajustado una vez los ~10 contenedores de Docker estén corriendo en simultáneo — no es un cambio necesario hoy.

---

## 26. Checklist de lanzamiento

Ambientes verificados por separado · SPF/DKIM/DMARC configurados en el dominio · backups de base de datos automatizados · certificado SSL confirmado · 2FA activado en cuenta(s) admin · Dependabot activo.

---

## 27. Diferido explícitamente a la fase final (pre-desarrollo)

Configuración completa del sistema multi-agente en OpenCode y su comunicación vía MCP/skills · selección definitiva de documentos complementarios a generar · proveedores de respaldo del chatbot · carga de credenciales y secretos reales · contenido/curación final del CV.

## 28. Próximos pasos

Aprobado este documento, se genera el set complementario (`ARCHITECTURE.md`, `DATA_MODEL.md`, `API_SPEC.md`, `STYLEGUIDE.md`, `AGENTS.md`, `PLAN.md`, `TASKS.md`, `DECISIONS.md`, `CONSTRAINTS.md`, `TESTS.md`, `SECURITY.md`, `README.md`), con el mismo nivel de detalle que este documento.
