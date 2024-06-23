import { $ } from 'bun'

const glob = new Bun.Glob("./src/**.ts").scan()

let files = []
for await (const e of glob) {
    files.push(e)
}

const build = await Bun.build({
    entrypoints: files,
    outdir: './scripts',
    target: 'browser',
    sourcemap: "inline"
})
