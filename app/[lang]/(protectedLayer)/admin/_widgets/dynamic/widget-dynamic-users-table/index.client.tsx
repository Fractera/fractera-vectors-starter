"use client"

// ВИДЖЕТ «учётные записи» — динамический островок в статической странице.
//
// 🔒 ЭТО ЕДИНИЦА ВЛАДЕНИЯ. Всё, что отвечает на вопрос «как выглядит и ведёт
// себя ЭТА таблица», лежит в этой папке: выборка, скелетон, строка, редактор
// ролей, подвал, управление, слова. Снеси папку маршрута — виджет исчезнет
// целиком, не оставив ссылок; это и есть его приёмка.
//
// 🔒 ИЗОЛЯЦИЯ ФАЙЛОВ, А НЕ ЧУЖЕРОДНОСТЬ ВИДА (уточнено владельцем 2026-08-21).
// Фрагменты между виджетами не делятся — но ритм отступов, шапка таблицы,
// чередование строк и порядок управления берутся такими же, как у соседних
// таблиц продукта. Первая версия этой страницы была собрана в своём ритме и без
// заголовка: разметка формально верна, а рядом с соседями читается как кусок
// другого сайта.
//
// 🔒 ЗАКРЫТ ПО УМОЛЧАНИЮ, и здесь это дороже, чем у товаров: список людей —
// самая чувствительная выборка страницы. Пока человек не нажал, служба
// авторизации не спрошена вовсе. Но СКЕЛЕТОН ВИДЕН СРАЗУ: до нажатия стоит та
// же таблица, только без значений, — иначе страница выглядит недоделанной, а не
// ждущей.

import { EmptyState } from "@/components/ui/empty-state"
import { useUsersList } from "./use-list"
import { UsersRow } from "./row.client"
import { UsersTableSkeleton } from "./skeleton"
import { UsersToolbar } from "./toolbar.client"
import { UsersPager } from "./pager.client"
import type { UsersTableUi } from "./ui.i18n"
import { Table, TableHeader, TableBody, TableRow, TableHead } from "@/components/ui/table"

export function UsersTable({ lang, ui }: { lang: string; ui: UsersTableUi }) {
  const { revealed, loading, rows, total, page, pages, perPage, query, setQuery, load, changeSize } = useUsersList(ui)
  const cols = {
    colAccount: ui.colAccount,
    colRoles: ui.colRoles,
    colProvider: ui.colProvider,
    colCreated: ui.colCreated,
    colLastSeen: ui.colLastSeen,
  }

  return (
    <>
      <UsersToolbar
        ui={ui}
        revealed={revealed}
        loading={loading}
        query={query}
        onQuery={setQuery}
        onReveal={() => void load({ page: 1 })}
        onSearch={() => void load({ page: 1, q: query })}
      />

      {!revealed || loading ? (
        <>
          {/* Скелетон держит ТУ ЖЕ форму, что и ответ: те же колонки, те же
              заголовки. Форма загрузки, не совпадающая с формой ответа, даёт
              скачок разметки в момент прихода данных. */}
          <UsersTableSkeleton labels={cols} />
          {!revealed && <p data-block="ixsa0" className="mt-3 text-xs text-muted-foreground">{ui.revealHint}</p>}
        </>
      ) : rows.length === 0 ? (
        <EmptyState data-block="hjixw" title={ui.empty} />
      ) : (
        <>
          <div data-block="b6pcb" className="overflow-hidden rounded-xl border border-border">
            <Table data-block="ersn1" className="w-full text-xs">
              <TableHeader>
                <TableRow className="border-b border-border bg-muted/40">
                  <TableHead className="px-4 py-2.5 text-left font-medium text-muted-foreground">{ui.colAccount}</TableHead>
                  <TableHead className="px-4 py-2.5 text-left font-medium text-muted-foreground">{ui.colRoles}</TableHead>
                  <TableHead className="w-28 px-4 py-2.5 text-left font-medium text-muted-foreground">{ui.colProvider}</TableHead>
                  <TableHead className="w-28 px-4 py-2.5 text-left font-medium text-muted-foreground">{ui.colCreated}</TableHead>
                  <TableHead className="w-32 px-4 py-2.5 text-left font-medium text-muted-foreground">{ui.colLastSeen}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row, i) => (
                  // После сохранения список перечитывается заново, а не правится
                  // в памяти: роли меняет СЛУЖБА, и её ответ — единственная
                  // правда о том, что получилось.
                  <UsersRow
                    key={row.id}
                    row={row}
                    ui={ui}
                    lang={lang}
                    striped={i % 2 !== 0}
                    onSaved={() => load({ page, q: query })}
                  />
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Подвал — как у соседних списков: счёт слева, переходы справа, под
              таблицей. Человек листает после того, как дочитал строки. */}
          <UsersPager
            ui={ui}
            total={total}
            page={page}
            pages={pages}
            perPage={perPage}
            onPage={p => load({ page: p, q: query })}
            onSize={changeSize}
          />
        </>
      )}
    </>
  )
}
