// THE RULE «OUR ARCHITECTURE, NEVER THEIRS» — its one source (node steps 590-2, 590-3). The owner of the node, 2026-10-23: «это должно быть
// прописано на уровне каждого документа как правило которые нельзя отменить». The words are the same in every template and in root;
// a study happens in the study pass of a custom element (node step 594); `scripts/check-architecture-rule.mjs` refuses a build when a document of the path from a study to
// code lost it or changed it — each document carries it word for word under the line <!-- RULE: our-architecture -->. Change the words
// here only by the owner's decision, and every document with them.
export const OUR_ARCHITECTURE =
  '🔒 Our architecture, never theirs — non-cancellable (owner of the node, 2026-10-23: «категорически запрещено в процессе проектирования ' +
  'переносить не оптимизированную механику в наш проект … элементы интерфейса и бизнес логики мы пере используем а техническую ' +
  'архитектуру сохраняем собственную»). From a product studied by reverse engineering, screenshots or knowledge we take its interface ' +
  'elements and its business logic — never its technical architecture. Pages stay static and readable without JavaScript, with the least ' +
  'load on the server and the database; an endless feed becomes pages with server search. Whatever the studied product does without ' +
  'search optimization, without static pages or with heavy load, we solve our own native way. Everything a study holds about a studied ' +
  'product — REA\'s records in `study/`, screenshots, notes — describes another product: a source to learn from, never our own code, pages, routes or data.'

/** The rule as a guard compares it: one line, single spaces. */
export const flat = (text) => String(text ?? '').replace(/\s+/g, ' ').trim()
