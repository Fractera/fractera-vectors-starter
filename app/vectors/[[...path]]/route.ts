// @api vector store of the node: upsert, nearest search, delete, status
import { handle } from "@/lib/data-store/app.mjs"

// 550: дверь прежнего слоя данных (`server.js`) — тот же путь, тот же замок и ответ; логика — lib/data-store.
export const dynamic = "force-dynamic"
export const runtime = "nodejs"
export const GET = handle
export const HEAD = handle
export const POST = handle
export const PUT = handle
export const PATCH = handle
export const DELETE = handle
export const OPTIONS = handle
