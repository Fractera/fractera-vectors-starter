// 550: векторное хранилище — обработчики прежнего `server.js` слоя данных ДОСЛОВНО (вырезка строк, см. scratchpad gen-store.cjs);
// заменены только сантехника: uuid → randomUUID, multer → uploadSingle, pipe(res) → res.sendStream.
// 🪦 Слова ниже «in the SAME SQLite file as the rows it annotates» — устройство до 550: теперь у склада свой файл (app.mjs).
// 654-3: чьи векторы — у каждого элемента свои коллекции (блок «WHOSE VECTORS» ниже); обработчики четырёх дверей знают вызывающего.
import { randomUUID } from 'node:crypto'
import { embed, embeddingsStatus } from './context.mjs'

// 626-3: `store` — { model, dims, setAside } decided by app.mjs from what the node's `embeddings` names (the model of every vector here).
export async function registerVectors(app, appDb, store) {
  const EMBED_MODEL = store.model
  const EMBED_DIMS = store.dims
  // ── Vector store (step 500) ────────────────────────
  // The third warehouse of the data layer, next to rows (/db) and objects (/media).
  // It replaces LightRAG (:9621), which was a graph-RAG framework installed to make
  // the Hermes agent smarter; Hermes is gone, so the graph half went with it and only
  // the vector half is kept — in the SAME SQLite file as the rows it annotates, so it
  // shares one backup, one auth posture and one wipe semantics.
  //
  // Similarity search runs on a REAL index: an sqlite-vec `vec0` virtual table that
  // returns only the k nearest rows, so the cost of a query stops growing with the
  // size of the store. Until step 500 the extension was loaded but never used — every
  // search read the whole collection into JS. That was invisible at one search per
  // question and ruinous under agentic retrieval, which issues five to ten searches
  // per question.
  //
  // Three modes, decided once at startup and reported honestly by /vectors/status:
  //   'partitioned' — vec0 with `collection` as a partition key: a filtered search
  //                   touches only its own collection. The correct mode.
  //   'flat'        — vec0 without partitions (older extension): the KNN is global,
  //                   so a filtered search over-fetches and then filters.
  //   'scan'        — no extension at all: the old linear scan, kept so the store
  //                   still WORKS rather than failing. Logged at startup, never
  //                   dressed up as an index.
  //
  // Ranking note: vec0 selects candidates by its own distance; the exact cosine score
  // is then computed for those k rows only. The response keeps the same meaning it
  // always had, at k-sized cost instead of table-sized.
  // Модель встраиваний и её размерность — те, что называет элемент узла `embeddings` (626-3: MiniLM-L12, 384, на этом
  // компьютере). До 626 склад считал OpenAI `text-embedding-3-large` (3072), выбранной замером 2026-09-13 (small 1536 не
  // отделял верное от чужого на русском корпусе).
  //
  // 🛑 СМЕНА МОДЕЛИ НА ЖИВОМ СКЛАДЕ РАВНА ПОТЕРЕ ДАННЫХ: размерность входит в индекс, и прежние векторы станут нечитаемы.
  // Поэтому склад с другой записанной моделью откладывается целиком (app.mjs, «начать с чистого листа» — владелец
  // 2026-11-02), а не переписывается.
  let vecExtension = false
  try {
    const { load } = await import('sqlite-vec')
    load(appDb)
    vecExtension = true
  } catch {
    vecExtension = false
  }
  
  appDb.exec(`
    CREATE TABLE IF NOT EXISTS vectors (
      id         TEXT PRIMARY KEY NOT NULL,
      collection TEXT NOT NULL,
      ref_table  TEXT,
      ref_id     TEXT,
      text       TEXT NOT NULL,
      embedding  BLOB NOT NULL,
      dims       INTEGER NOT NULL,
      model      TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS vectors_collection_idx ON vectors (collection);
    CREATE INDEX IF NOT EXISTS vectors_ref_idx        ON vectors (ref_table, ref_id);
  `)
  
  // vec0 addresses rows by an INTEGER rowid, while `vectors.id` is a TEXT uuid. The
  // implicit SQLite rowid is NOT safe to use as that link: VACUUM may renumber it on
  // a table whose primary key is not an INTEGER, which would silently point every
  // index entry at the wrong text. So the link is an explicit column we own.
  const hasSeq = appDb.prepare('PRAGMA table_info(vectors)').all().some((c) => c.name === 'seq')
  if (!hasSeq) {
    appDb.exec('ALTER TABLE vectors ADD COLUMN seq INTEGER')
    appDb.exec('CREATE UNIQUE INDEX IF NOT EXISTS vectors_seq_idx ON vectors (seq)')
    let n = 0
    const stmt = appDb.prepare('UPDATE vectors SET seq = ? WHERE id = ?')
    for (const r of appDb.prepare('SELECT id FROM vectors ORDER BY created_at').all()) stmt.run(++n, r.id)
  }
  
  // Index mode. Partition keys arrived in sqlite-vec 0.1.6; an older extension throws
  // on the CREATE, so we step down instead of failing. Nothing here is fatal: a store
  // with no index still answers, just linearly.
  // Two traps live here, both found by running it rather than reading it:
  //
  //   1. The key column is declared EXPLICITLY. Naming `rowid` in the column list
  //      makes vec0 shift the bindings and drop the TEXT collection into the
  //      primary-key slot.
  //   2. The key must be bound as a BigInt. better-sqlite3 binds a plain JS number
  //      as REAL, and vec0 accepts only SQLITE_INTEGER for a primary key — so
  //      `run(1, ...)` is rejected while `run(1n, ...)` is accepted. Both failures
  //      raise the same message: "Only integers are allowed for primary key values".
  let annMode = 'scan'
  if (vecExtension) {
    // The index is derived data, so a table of the wrong shape (an older layout, a
    // changed dimension) is dropped rather than migrated — the rebuild below refills it.
    const cols = (() => {
      try { return appDb.prepare('PRAGMA table_info(vectors_ann)').all().map((c) => c.name) } catch { return [] }
    })()
    if (cols.length && !cols.includes('seq')) {
      try { appDb.exec('DROP TABLE vectors_ann') } catch { /* recreated below */ }
    }
    try {
      appDb.exec(`CREATE VIRTUAL TABLE IF NOT EXISTS vectors_ann USING vec0(
        seq INTEGER PRIMARY KEY,
        collection TEXT PARTITION KEY,
        embedding FLOAT[${EMBED_DIMS}]
      )`)
      annMode = 'partitioned'
    } catch {
      try {
        appDb.exec(`CREATE VIRTUAL TABLE IF NOT EXISTS vectors_ann USING vec0(
          seq INTEGER PRIMARY KEY,
          embedding FLOAT[${EMBED_DIMS}]
        )`)
        annMode = 'flat'
      } catch {
        annMode = 'scan'
      }
    }
  }
  
  // A failing index must never pass for a working one. The first failure is logged
  // with its real message and the store DROPS to 'scan': slow and correct beats fast
  // and empty. Swallowing these errors is exactly how the broken layout above shipped
  // looking healthy — writes returned ok, searches returned nothing.
  function annDegrade(where, e) {
    if (annMode === 'scan') return
    annMode = 'scan'
    console.error(`Vectors: index disabled after ${where} failed — ${String(e.message ?? e)}. Falling back to linear scan.`)
  }
  function annDelete(seq) {
    if (annMode === 'scan' || seq == null) return
    try { appDb.prepare('DELETE FROM vectors_ann WHERE seq = ?').run(BigInt(seq)) } catch (e) { annDegrade('index delete', e) }
  }
  function annInsert(seq, collection, blob) {
    if (annMode === 'scan' || seq == null) return
    try {
      if (annMode === 'partitioned') {
        appDb.prepare('INSERT INTO vectors_ann (seq, collection, embedding) VALUES (?, ?, ?)').run(BigInt(seq), collection, blob)
      } else {
        appDb.prepare('INSERT INTO vectors_ann (seq, embedding) VALUES (?, ?)').run(BigInt(seq), blob)
      }
    } catch (e) { annDegrade('index write', e) }
  }
  
  // Backfill: the index is derived data, so it is rebuilt whenever it is emptier than
  // the table. Covers the first start after this upgrade, a wiped index file and the
  // case where the extension only became available later.
  if (annMode !== 'scan') {
    try {
      const { n: indexed } = appDb.prepare('SELECT COUNT(*) AS n FROM vectors_ann').get()
      const { n: stored }  = appDb.prepare('SELECT COUNT(*) AS n FROM vectors').get()
      if (indexed < stored) {
        appDb.exec('DELETE FROM vectors_ann')
        for (const r of appDb.prepare('SELECT seq, collection, embedding FROM vectors WHERE seq IS NOT NULL').all()) {
          annInsert(r.seq, r.collection, r.embedding)
        }
        if (annMode !== 'scan') console.log(`Vectors: rebuilt index for ${stored} record(s)`)
      }
    } catch (e) {
      annDegrade('index rebuild', e)
    }
  }
  
  function toBlob(vec) {
    return Buffer.from(new Float32Array(vec).buffer)
  }
  function fromBlob(buf) {
    return new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4)
  }
  function cosine(a, b) {
    let dot = 0, na = 0, nb = 0
    for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i] }
    if (na === 0 || nb === 0) return 0
    return dot / (Math.sqrt(na) * Math.sqrt(nb))
  }

  // ── WHOSE VECTORS (node step 654-3) ───────────────────────────────────────────
  // The owner of the node, 2026-11-05: «объектное хранилище должно быть обновлено не только для использования глубинной памятью но и
  // для использования просто внутри элемента» — the same rule for every store, in both node types. A call with an element's own key
  // (`req.element`, the shared lock `auth.mjs`) works on that element's names only: its collection `faq` is kept as `el/<id>/faq`, its
  // record `x` as `el/<id>/x`. The vec0 partition stays the collection, so a search still touches one collection, and every answer gives
  // the element its own names back, never the prefix. An element id holds no slash (`element-key.mjs`), so no name an element can make
  // falls under another element's prefix: `../` is only three letters of its own name.
  // The node (its key, a privileged session) works as before and sees everything under the full names; it names an element's collection
  // in full (`el/root/faq`) and deletes any record. It never WRITES under `el/`: that prefix is the elements', and a record of the node
  // there would be found by an element as its own.
  const EL = 'el/'
  const spaceOf = (req) => (req.element ? `${EL}${req.element}/` : null)
  // The names under one prefix as a range the index on `collection` serves: `el/root/` ≤ name < `el/root0` (`0` follows `/`).
  const rangeOf = (space) => [space, `${space.slice(0, -1)}0`]
  const ELEMENT_NAMES = 'an element names its own collections and records without "el/": the store keeps them under el/<element id>/ by itself'
  const NODE_NAMES = 'names beginning with "el/" are the elements\' own (el/<element id>/<name>); the node keeps its vectors under other names'
  const reserved = (res, reason) => res.status(400).json({ error: 'reserved-prefix', reason })
  const ownCollections = (space) =>
    appDb.prepare('SELECT DISTINCT collection FROM vectors WHERE collection >= ? AND collection < ?').all(...rangeOf(space)).map((r) => r.collection)

  // ── POST /vectors — upsert one record ─────────────────────────────────────────
  // Body: { id?, collection, text, embedding?, refTable?, refId? }
  // Without `embedding` the text is embedded here; with it, no model is called.

  app.post('/vectors', async (req, res) => {
    const { id, collection, text, embedding, refTable = null, refId = null } = req.body ?? {}
    if (!collection || typeof collection !== 'string') return res.status(400).json({ error: 'collection is required' })
    if (!text || typeof text !== 'string')             return res.status(400).json({ error: 'text is required' })
    // 654-3: an element writes under its own prefix only — the same id replaces only its own record; the node never under `el/`.
    const space = spaceOf(req)
    if (space && id != null && (typeof id !== 'string' || !id)) return res.status(400).json({ error: 'id must be a non-empty string' })
    if (collection.startsWith(EL) || (typeof id === 'string' && id.startsWith(EL))) return reserved(res, space ? ELEMENT_NAMES : NODE_NAMES)
    try {
      const vec = Array.isArray(embedding) ? embedding : await embed(text)
      if (vec.length !== EMBED_DIMS) {
        return res.status(400).json({ error: `expected ${EMBED_DIMS} dims, got ${vec.length}` })
      }
      const given = id ?? randomUUID()
      const rowId = space ? space + given : given
      const kept  = space ? space + collection : collection
      const blob  = toBlob(vec)
      // Table and index move together or not at all: a half-written pair would make
      // a record findable that no longer exists, or hide one that does.
      const write = appDb.transaction(() => {
        const prev = appDb.prepare('SELECT seq FROM vectors WHERE id = ?').get(rowId)
        const seq = prev?.seq ?? ((appDb.prepare('SELECT MAX(seq) AS m FROM vectors').get().m ?? 0) + 1)
        appDb.prepare(`
          INSERT INTO vectors (id, collection, ref_table, ref_id, text, embedding, dims, model, seq)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            collection = excluded.collection, ref_table = excluded.ref_table, ref_id = excluded.ref_id,
            text = excluded.text, embedding = excluded.embedding, dims = excluded.dims, model = excluded.model
        `).run(rowId, kept, refTable, refId, text, blob, vec.length, EMBED_MODEL, seq)
        annDelete(seq)                       // upsert = replace, so the old vector goes first
        annInsert(seq, kept, blob)
        return seq
      })
      write()
      res.json({ ok: true, id: given, dims: vec.length, model: EMBED_MODEL, index: annMode })
    } catch (e) {
      res.status(500).json({ error: String(e.message ?? e) })
    }
  })

  // ── POST /vectors/search ──────────────────────────────────────────────────────
  // Body: { collection?, query? | embedding?, k? } → nearest records with a score.

  const PICK = 'SELECT v.id, v.collection, v.ref_table, v.ref_id, v.text, v.embedding FROM vectors_ann a JOIN vectors v ON v.seq = a.seq'
  const SCAN = 'SELECT id, collection, ref_table, ref_id, text, embedding FROM vectors'

  /** The nearest rows of one collection: the index while it works, the linear scan otherwise. */
  function nearestIn(collection, probe, want) {
    let rows
    if (annMode === 'partitioned') {
      rows = appDb.prepare(`${PICK} WHERE a.embedding MATCH ? AND a.collection = ? AND k = ?`).all(toBlob(probe), collection, want)
    } else if (annMode === 'flat') {
      // No partitions: the KNN is global, so ask for a wider slice and keep the
      // rows that belong to the requested collection. Honest but approximate —
      // that is why 'partitioned' is the mode we want.
      rows = appDb.prepare(`${PICK} WHERE a.embedding MATCH ? AND k = ?`).all(toBlob(probe), Math.min(500, want * 20))
        .filter((r) => r.collection === collection)
    } else {
      // No index: the old linear scan. Still correct, just proportional to the store.
      rows = appDb.prepare(`${SCAN} WHERE collection = ?`).all(collection)
    }
    // An index that returns nothing while the store holds rows is broken, not empty.
    // Rather than hand the caller a confident "no results", drop to the scan and say so.
    if (annMode !== 'scan' && rows.length === 0) {
      const { n } = appDb.prepare('SELECT COUNT(*) AS n FROM vectors WHERE collection = ?').get(collection)
      if (n > 0) {
        annDegrade('index search', new Error(`returned 0 of ${n} candidate row(s)`))
        rows = appDb.prepare(`${SCAN} WHERE collection = ?`).all(collection)
      }
    }
    return rows
  }

  /** The nearest rows of the whole store — the node's search with no collection named. */
  function nearestAll(probe, want) {
    let rows = annMode !== 'scan'
      ? appDb.prepare(`${PICK} WHERE a.embedding MATCH ? AND k = ?`).all(toBlob(probe), want)
      : appDb.prepare(SCAN).all()
    if (annMode !== 'scan' && rows.length === 0) {
      const { n } = appDb.prepare('SELECT COUNT(*) AS n FROM vectors').get()
      if (n > 0) {
        annDegrade('index search', new Error(`returned 0 of ${n} candidate row(s)`))
        rows = appDb.prepare(SCAN).all()
      }
    }
    return rows
  }

  app.post('/vectors/search', async (req, res) => {
    const { collection = null, query, embedding, k = 5 } = req.body ?? {}
    if (!query && !Array.isArray(embedding)) return res.status(400).json({ error: 'query or embedding is required' })
    // 654-3: an element searches its own collections only — the one it names, or, with none named, each of its own in turn, the
    // findings merged by score (until 654-3 a search with no collection read every collection of the node). The node as before.
    const space = spaceOf(req)
    if (space && collection && typeof collection !== 'string') return res.status(400).json({ error: 'collection must be a string' })
    if (space && collection && collection.startsWith(EL)) return reserved(res, ELEMENT_NAMES)
    try {
      const probe = Array.isArray(embedding) ? Float32Array.from(embedding) : Float32Array.from(await embed(query))
      const want  = Math.max(1, Math.min(100, Number(k) || 5))
      const targets = collection ? [space ? space + collection : collection] : space ? ownCollections(space) : null
      const rows = targets === null ? nearestAll(probe, want) : targets.flatMap((c) => nearestIn(c, probe, want))

      // Exact cosine on the candidates only — same score the caller always got. An element gets its own names back, and never a row
      // outside its prefix, whatever the store holds.
      const mine = (r) => !space || (String(r.id).startsWith(space) && String(r.collection).startsWith(space))
      const scored = rows
        .filter(mine)
        .map((r) => ({
          id: space ? String(r.id).slice(space.length) : r.id,
          collection: space ? r.collection.slice(space.length) : r.collection,
          refTable: r.ref_table, refId: r.ref_id, text: r.text,
          score: cosine(probe, fromBlob(r.embedding)),
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, want)
      res.json({ ok: true, scanned: rows.length, index: annMode, indexed: annMode !== 'scan', results: scored })
    } catch (e) {
      res.status(500).json({ error: String(e.message ?? e) })
    }
  })

  // ── DELETE /vectors/:id ───────────────────────────────────────────────────────

  app.delete('/vectors/:id', (req, res) => {
    // 654-3: an element deletes only its own record — another's answers 404, the same as a missing one; the node deletes any record,
    // an element's named in full, and keeps its old answer for a missing one (`deleted: 0`).
    const space = spaceOf(req)
    if (space && req.params.id.startsWith(EL)) return reserved(res, ELEMENT_NAMES)
    const drop = appDb.transaction((id) => {
      const row = appDb.prepare('SELECT seq FROM vectors WHERE id = ?').get(id)
      const info = appDb.prepare('DELETE FROM vectors WHERE id = ?').run(id)
      if (row) annDelete(row.seq)
      return info.changes
    })
    const deleted = drop(space ? space + req.params.id : req.params.id)
    if (space && !deleted) return res.status(404).json({ ok: false, error: 'Not found' })
    res.json({ ok: true, deleted })
  })

  // ── GET /vectors/status — is the store usable at all ──────────────────────────

  app.get('/vectors/status', async (req, res) => {
    // 654-3: an element counts its own records; a store set aside by a model change is the node's business.
    const space = spaceOf(req)
    const { n } = space
      ? appDb.prepare('SELECT COUNT(*) AS n FROM vectors WHERE collection >= ? AND collection < ?').get(...rangeOf(space))
      : appDb.prepare('SELECT COUNT(*) AS n FROM vectors').get()
    let live = null
    let liveError = null
    try { live = await embeddingsStatus() } catch (e) { liveError = String(e.message ?? e) }
    res.json({
      ok: true,
      // 626-3: «настроен» — модель векторов узла отвечает и она та же, что у склада; спрашивается при каждом вызове.
      configured: Boolean(live?.ready && live.model === EMBED_MODEL),
      model: EMBED_MODEL,
      dims: EMBED_DIMS,
      embeddings: live ? { model: live.model, ready: live.ready, status: live.status } : { error: liveError },
      ...(space ? {} : { setAside: store.setAside ?? null }),
      index: annMode,          // 'partitioned' | 'flat' | 'scan'
      indexed: annMode !== 'scan',
      extension: vecExtension, // loaded, which is not the same as used
      count: n,                // 654-3: an element's — its own records
    })
  })
  
}
