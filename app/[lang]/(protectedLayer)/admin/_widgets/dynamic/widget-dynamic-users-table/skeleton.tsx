import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"

// Скелетон ЭТОЙ таблицы — пять колонок, ровно её собственные.
//
// 🪦 Здесь стояло «четыре колонки». Шаг 532 добавил «Последний вход», и рама
// поехала за таблицей ТЕМ ЖЕ коммитом — иначе разметка дёргалась бы на одну
// колонку в момент ответа, то есть ровно тем дефектом, ради которого скелетон
// и держат своим.
//
// 🔒 ПОЧЕМУ НЕ ОБЩИЙ (шаг 521, названо владельцем критическим). Общий скелетон
// заранее решает, что все таблицы одной формы, и чужая рама во время загрузки
// означала бы, что разметка дёрнется, когда придёт ответ. Сегодняшняя правка —
// прямое доказательство: колонка прибавилась у одной таблицы из пяти.
//
// Рама и заголовки статические: они известны до всякого запроса и рисуются без
// JavaScript — вместо пустого «Загрузка…».
const ROWS = 5

export function UsersTableSkeleton(
  { labels }: {
    labels: {
      colAccount: string
      colRoles: string
      colProvider: string
      colCreated: string
      colLastSeen: string
    }
  },
) {
  return (
    <div data-block="gmegg" className="overflow-hidden rounded-xl border border-border">
      <Table data-block="v7enf" className="w-full text-xs">
        <TableHeader>
          <TableRow className="border-b border-border bg-muted/40">
            <TableHead className="px-4 py-2.5 text-left font-medium text-muted-foreground">{labels.colAccount}</TableHead>
            <TableHead className="px-4 py-2.5 text-left font-medium text-muted-foreground">{labels.colRoles}</TableHead>
            <TableHead className="px-4 py-2.5 text-left font-medium text-muted-foreground">{labels.colProvider}</TableHead>
            <TableHead className="px-4 py-2.5 text-left font-medium text-muted-foreground">{labels.colCreated}</TableHead>
            <TableHead className="px-4 py-2.5 text-left font-medium text-muted-foreground">{labels.colLastSeen}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: ROWS }, (_, i) => (
            <TableRow key={i} className={`border-b border-border last:border-0 ${i % 2 !== 0 ? "bg-muted/20" : ""}`}>
              <TableCell className="px-4 py-2.5"><Skeleton className="h-4 w-48" /></TableCell>
              <TableCell className="px-4 py-2.5"><Skeleton className="h-4 w-24" /></TableCell>
              <TableCell className="px-4 py-2.5"><Skeleton className="h-4 w-16" /></TableCell>
              <TableCell className="px-4 py-2.5"><Skeleton className="h-4 w-20" /></TableCell>
              <TableCell className="px-4 py-2.5"><Skeleton className="h-4 w-28" /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
