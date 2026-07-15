# OPENCODE_SETUP.md — Guía paso a paso

Basado en la documentación oficial de OpenCode (opencode.ai/docs), verificada el 13 de julio de 2026. Escrita asumiendo tu punto de partida real: OpenCode ya instalado, carpeta y repositorio ya creados y conectados por SSH, sin commits todavía.

---

## Paso 1 — Conectar tus proveedores gratuitos

```bash
opencode
```
Dentro de la interfaz:
```
/connect
```
Busca **Groq**, pega tu API key. Repite `/connect` para cada uno de los otros cinco: **DeepSeek**, **Z.AI** (para GLM), **NVIDIA**, **OpenRouter**, **Cerebras** — mismo patrón de 4 pasos para cada uno, todos soportados de forma nativa.

Después de conectar cada uno:
```
/models
```
y selecciona el modelo específico que quieras de ese proveedor. **No fijes un ID de modelo exacto a mano en ningún archivo** — los catálogos cambian; `/models` siempre te muestra lo que existe hoy.

## Paso 2 — Ubicar los archivos en tu carpeta real

En `/home/ysrael_mauricio/Documents/Projects/Portfolio_SaaS`:

```
Portfolio_SaaS/
├── opencode.json          ← el archivo principal
├── agent-prompts/         ← carpeta con los 8 prompts
│   ├── orchestrator.txt
│   ├── backend.txt
│   ├── frontend.txt
│   ├── database.txt
│   ├── reviewer.txt
│   ├── security.txt
│   ├── docs-tests.txt
│   └── devops.txt
├── .opencode/
│   └── skills/
│       └── payment-provider-pattern/
│           └── SKILL.md
├── docs/                  ← tus 13 documentos de especificación
└── AGENTS.md              ← en la raíz
```

`opencode.json` referencia los prompts como `{file:./agent-prompts/orchestrator.txt}` — ruta relativa a donde está `opencode.json`, por eso ambos van juntos en la raíz.

## Paso 3 — Validar que `opencode.json` es JSON correcto

```bash
cd /home/ysrael_mauricio/Documents/Projects/Portfolio_SaaS
python3 -m json.tool opencode.json > /dev/null && echo "JSON válido"
```
Si falla, hay una coma de más o de menos — corrígelo antes de seguir. Un JSON inválido hace que OpenCode ignore silenciosamente toda la configuración de agentes.

## Paso 4 — Primer commit

Ya tienes el repositorio y la conexión SSH — esto es lo que falta para que deje de estar vacío.

```bash
cd /home/ysrael_mauricio/Documents/Projects/Portfolio_SaaS

# Seguro correr esto aunque ya se haya hecho antes — no rompe nada si el repo ya existe
git init
git branch -M main

# Confirma si el remoto ya está configurado:
git remote -v
# Si no muestra nada, agrégalo:
git remote add origin git@github.com:YsraelMauricio/Portfolio_SaaS.git
```

Todavía no existe ningún `.gitignore` — normalmente lo genera el scaffolding de cada framework (`laravel new`, `create-next-app`), pero eso es la Fase 0, más adelante. Sin uno, este primer commit podría arrastrar archivos de sistema operativo o del editor sin querer. Uno mínimo, solo para este momento — cuando llegue el scaffolding real, ese `.gitignore` va dentro de `frontend/`/`backend/` como indica `ARCHITECTURE.md` §2, este de la raíz se queda solo para lo que nunca pertenece a ninguna subcarpeta:

```bash
cat > .gitignore << 'EOF'
.DS_Store
.vscode/
.idea/
*.swp
EOF
git add .gitignore
git commit -m "chore: gitignore inicial de la raiz"
```

Dos commits, no uno — separados por tipo, siguiendo la misma convención que ya define `PROJECT_SPEC.md` §25 (la que vas a pedirle a los agentes que seguirán después):

```bash
git add docs/ AGENTS.md README.md
git commit -m "docs: especificacion completa del proyecto y documentos complementarios"

git add opencode.json agent-prompts/ .opencode/
git commit -m "chore: configuracion inicial de agentes de opencode"

git push -u origin main
```

## Paso 5 — Correr `/init`

Con el primer commit ya hecho, ahora sí tiene sentido correrlo — y es seguro: la documentación oficial confirma que `/init` **mejora un `AGENTS.md` existente en su lugar, nunca lo reemplaza a ciegas**. En este punto puede escanear comandos reales si ya agregaste algo de scaffolding (Fase 0 de `TASKS.md`); si todavía no hay código, no pasa nada, solo no tendrá mucho que escanear todavía — puedes volver a correrlo más adelante, después de la Fase 0, para que sume comandos de build/lint/test reales.

```
/init
```

## Paso 6 — Confirmar que los agentes cargaron bien

```
/agent
```
Deberías ver **orchestrator** como agente primario, y **backend, frontend, database, reviewer, security, docs-tests, devops** listados como subagentes disponibles vía `@`.

Prueba una delegación real:
```
@backend lee DATA_MODEL.md y confírmame que lo entiendes
```
Si responde citando contenido real de `DATA_MODEL.md`, la carga de contexto e `instructions` está funcionando.

## Paso 7 — El día a día

- Hablas con **orchestrator** (agente primario, por defecto). Tab para cambiar de agente primario si algún día agregas otro.
- El orchestrator delega automáticamente a los subagentes según su `description`, o tú los invocas manualmente con `@nombre`.
- Cuando un subagente arranca una tarea, se abre una sesión hija — usa `<Leader>+Down` para entrar a esa sesión y ver el trabajo en detalle, `Up` para volver a la conversación principal con el orchestrator.
- El `permission.task` del orchestrator en `opencode.json` es lo que le impide invocar cualquier subagente que no esté en la lista explícita — si algún día agregas un noveno agente, tienes que sumarlo ahí también, o el orchestrator no podrá delegarle nada.

## Nota sobre MCP servers

Ya tienes Context7 configurado de forma global, se aplica a este proyecto automáticamente, sin nada que agregar aquí. Para algo específico de este proyecto (ej. un MCP de Postgres) que quieras sumar más adelante, usa `/connect` interactivo en ese momento, en vez de que yo te fije un nombre de paquete que no pude verificar con la misma certeza que todo lo demás en esta guía.

## Nota sobre `npx skills` (instalador de terceros, distinto al mecanismo nativo de arriba)

Si encuentras un skill ya armado en skills.sh o en un repo de GitHub, el comando se corre **desde la raíz de tu proyecto — es indiferente en qué subcarpeta hayas estado dentro de ahí**, igual que `npm install`. La herramienta decide dónde copiarlo según el agente que le indiques (`-a opencode` → `.opencode/skill/`, la misma ruta que ya usa `payment-provider-pattern`). No hace falta crear ninguna carpeta antes.

```bash
# Desde la raíz de Portfolio_SaaS, sin importar en qué subcarpeta hayas estado trabajando:
npx skills add vercel-labs/skills --skill find-skills -a opencode
```

## Nota sobre distribuir agentes entre tus 6 proveedores

Ahora mismo, ningún agente en `opencode.json` fija un `model` explícito — todos heredan el del `orchestrator` (un subagente usa el modelo del agente primario que lo invocó, salvo que se le fije uno propio). Si quieres repartir la carga entre tus seis proveedores — no solo tenerlos todos conectados, sino que cada rol use uno distinto — se hace agregando `"model": "proveedor/id-exacto"` dentro de la definición de ese agente en `opencode.json` — por ejemplo, darle a `security` un modelo distinto al del resto, dado que es la revisión más sensible. El ID exacto lo confirmas con `/models` en el momento, no lo fijes de memoria.

## Verificación final

- [ ] Los seis proveedores aparecen en `opencode auth list`
- [ ] `python3 -m json.tool opencode.json` no da error
- [ ] Tres commits existen (`git log --oneline`) y `git push` llegó a GitHub
- [ ] `/agent` muestra los 8 agentes
- [ ] `@backend` responde citando contenido real de `DATA_MODEL.md`
