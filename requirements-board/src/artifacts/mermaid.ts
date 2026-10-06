/**
 * Mermaid diagrams, drawn in the browser: the library loads only when one is shown. Labels are
 * plain SVG text (no HTML inside the drawing), so they can be selected, anchored and sanitised
 * like any SVG; IDs are seeded per diagram, so the same source draws the same SVG every time.
 */
type MermaidApi = typeof import('mermaid').default

let lib: Promise<MermaidApi> | null = null
let queue: Promise<unknown> = Promise.resolve()
const drawn = new Map<string, Promise<string>>()

const load = () => (lib ??= import('mermaid').then((m) => m.default))

/** The diagram as SVG text. Renders run one at a time, because mermaid's settings are global. */
export function renderMermaid(seed: string, source: string): Promise<string> {
  const key = `${seed}\u0000${source}`
  const hit = drawn.get(key)
  if (hit) return hit
  const job = queue.then(async () => {
    const mermaid = await load()
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: 'strict',
      htmlLabels: false,
      flowchart: { htmlLabels: false, useMaxWidth: false },
      deterministicIds: true,
      deterministicIDSeed: seed,
      theme: 'base',
      themeVariables: {
        fontFamily: 'Hanken Grotesk, system-ui, sans-serif',
        primaryColor: '#ffffff',
        primaryBorderColor: '#b9c7c2',
        primaryTextColor: '#1f2b30',
        lineColor: '#5f6e74',
        secondaryColor: '#f7faf9',
        tertiaryColor: '#edf2f0',
      },
    })
    await mermaid.parse(source)
    const { svg } = await mermaid.render(`mmd-${seed.replace(/[^\w-]/g, '')}`, source)
    return svg
  })
  queue = job.catch(() => undefined)
  drawn.set(key, job)
  job.catch(() => drawn.delete(key))
  return job
}
