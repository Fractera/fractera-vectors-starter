// A COLLECTION: a folder of pages that lists itself.
//
// 🔒 WHY THIS EXISTS. A page used to be spread over three places: a hand-written
// array of routes, a key in a central dictionary, and the page file itself.
// Adding one page meant four edits that had to agree; forgetting one of them
// fails silently — half the change is visible, half is not. That is this
// project's most expensive defect class, and it is structural, not a discipline
// problem.
//
// With a collection, a page is ONE FOLDER. The build scans the tree and writes
// the list; the menu, the index page and the route all read that list. Nothing
// is maintained by hand, so nothing can drift.
//
// 🔒 WHY IT IS A PRIMITIVE AND NOT A FEATURE OF THE ARCHITECT LAYER. The same
// shape serves any group of pages — a blog, a documentation tab, a settings
// group. The architect layer is simply its first consumer. Read `README.md`
// next to this file before adding a page or a level.
//
// 🛑 DEPTH IS NOT A PARAMETER. A group and a section are built the same way; only
// their depth differs. The scanner never learns the words "group" or "section" —
// it writes a list into every folder whose children carry `_data/index.ts`.

/** Facts about a page that are the same in every language. */
export type WorkspacePageMeta = {
  /**
   * The folder name. Written out because the list is read as data, and a record
   * that cannot say its own address is useless to whoever renders it.
   *
   * 🛑 MUST MATCH THE FOLDER. The generator does not rewrite it: a silent fix
   * would hide a copy-paste mistake that then shows up as a dead link.
   */
  slug: string
  /**
   * Position among its siblings, ascending.
   *
   * 🔒 EXPLICIT ON PURPOSE. A blog orders its posts by date; these pages have no
   * date, so without this field the order would be the alphabet of folder names
   * — and renaming a folder would silently reshuffle a menu.
   */
  order: number
  /**
   * The page exists and is reachable, but no menu lists it.
   *
   * 🔒 ADDED FOR STEPS OF A PROCESS (274-4). A wizard step is a screen, so it needs an address of its
   * own — otherwise it cannot be prerendered, linked, or returned to. But it is not a place: people
   * enter it from a button and leave when the process ends. Listing four such steps in the left menu
   * would present them as four independent sections, which misdescribes the product.
   *
   * 🛑 THIS IS NOT A LOCK. Hiding a page from the menu hides it from the eye, never from the network:
   * whatever a page must not show belongs behind `requireRoles`, not behind this flag.
   */
  hidden?: boolean
}

/** One theme of a page: a heading with its own anchor, its text, and its label in the top row. */
export type WorkspaceTopic = {
  /**
   * The anchor, written by hand.
   *
   * 🛑 NEVER DERIVED FROM THE HEADING: a generated anchor for a non-latin heading
   * is an unreadable hash, and it breaks the moment the wording is edited.
   */
  anchor: string
  /** Short label for the top row — the page's own navigation. */
  tab: string
  title: string
  text: string
  points?: string[]
}

/** Everything a page says, in one language. */
export type WorkspacePageWords = {
  /** The page's own name — used by the menu, the index card and the heading. */
  title: string
  /** One sentence under the title. Optional: a page may be a bare list. */
  lead?: string
  /** Themes of the page. Absent — the page has no top row, which is a legal state. */
  topics?: WorkspaceTopic[]
}

/**
 * A page as the tree stores it: facts, the base language, and per-language
 * overrides.
 *
 * 🔒 `en` IS THE BASE AND IS NOT OPTIONAL. A language we do not have falls back
 * to it, so a missing translation degrades to a readable page instead of a hole.
 */
export type WorkspacePageData = {
  meta: WorkspacePageMeta
  en: WorkspacePageWords
  overrides?: Record<string, WorkspacePageWords>
}

/**
 * A page together with its own children — one branch of the tree.
 *
 * 🔒 THIS IS WHAT MAKES A SECOND LEVEL COST NOTHING. A menu of groups, each
 * unfolding into its sections, is built from ONE generated import instead of one
 * import per group — so adding a group changes no source file at all.
 *
 * `children` is empty for a group that has none, and that is a legal state, not
 * an unfinished one: a group of a single page has nothing to unfold.
 */
export type CollectionBranch = {
  page: WorkspacePageData
  children: readonly WorkspacePageData[]
}

/** The words of a page in one language, falling back to `en`. */
export function wordsOf(page: WorkspacePageData, lang: string): WorkspacePageWords {
  return page.overrides?.[lang] ?? page.en
}

/**
 * Pages of a collection in the order a human should see them.
 *
 * Sorted by `order`, ties broken by `slug` so the result never depends on the
 * order in which the filesystem happened to hand over the folders.
 *
 * 🔒 `meta.hidden` PAGES ARE LEFT OUT HERE, IN THE ONE PLACE THAT ORDERS PAGES (274-4). Every menu and
 * index builds its rows from this function, so one filter covers them all; a second list of "and also
 * skip these" would drift from the first the day somebody adds a step.
 */
export function pagesInOrder(pages: readonly WorkspacePageData[]): WorkspacePageData[] {
  return [...pages]
    .filter((p) => !p.meta.hidden)
    .sort((a, b) => a.meta.order - b.meta.order || a.meta.slug.localeCompare(b.meta.slug))
}
