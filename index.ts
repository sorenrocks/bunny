import { serve, file } from "bun"

let data: { char: string; copy: string; favs: number }[] = []
await file("data/chars.csv")
  .text()
  .then((text) => {
    data = text
      .trim()
      .split("\n")
      .map((line) => {
        const [char, copy, favs, id] = line.split(",")
        return { char, copy, favs: parseInt(favs), id: parseInt(id) }
      })
  })
console.log(`loaded ${data.length} chars`)

serve({
  port: 3001,
  async fetch(req: Request) {
    const path = new URL(req.url).pathname

    // /img/:id
    if (path.startsWith("/img/")) {
      const id = path.slice(5)
      return new Response(file(`data/img/${id}.webp`))
    }

    // /chars/:current
    if (path.startsWith("/chars")) {
      const current = path.slice(7)

      const chars = []
      const used = new Set()
      if (current) used.add(data.findIndex((c) => c.char === current))

      while (chars.length < 10) {
        const idx = Math.floor(Math.random() * data.length)
        if (!used.has(idx)) {
          used.add(idx)
          chars.push(data[idx])
        }
      }

      return new Response(JSON.stringify(chars))
    }

    return new Response("not found", { status: 404 })
  },

  error(err: Error) {
    return new Response(err.message.toLowerCase(), { status: 500 })
  },
})
