import { serve, file } from "bun"

const withCors = (res: Response) => {
  res.headers.set("access-control-allow-origin", "*")
  return res
}

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

let info: { updated: Date; count: number }
await file("data/info.json")
  .json()
  .then(
    (json) =>
      (info = {
        updated: new Date(json.updated),
        count: data.length,
      }),
  )

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

      while (chars.length < 20) {
        const idx = Math.floor(Math.random() * data.length)
        if (!used.has(idx)) {
          used.add(idx)
          chars.push(data[idx])
        }
      }

      return withCors(new Response(JSON.stringify(chars)))
    }

    // /info
    if (path === "/info") {
      return withCors(new Response(JSON.stringify(info)))
    }

    return new Response("not found", { status: 404 })
  },

  error(err: Error) {
    return new Response(err.message.toLowerCase(), { status: 500 })
  },
})
