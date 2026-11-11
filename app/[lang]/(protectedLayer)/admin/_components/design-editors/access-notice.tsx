import type { Access, AccessWords } from './settings-access'

// Что показать вместо редактора, когда дверь его не отдала. Состояние названо словами — не пустым экраном.
export function AccessNotice({ access, words, loginHref }: {
  access: Access
  words: AccessWords
  loginHref?: string
}) {
  if (access === 'ok') return null
  const text =
    access === 'loading' ? words.loading
    : access === 'signin' ? words.signin
    : access === 'forbidden' ? words.forbidden
    : access === 'unavailable' ? words.unavailable
    : words.error
  return (
    <div data-block="zsl0a" className="flex flex-col gap-2 rounded-xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground" role="status">
      <p data-block="d4lk1">
        {text}{' '}
        {access === 'signin' && loginHref && (
          <a href={loginHref} className="font-medium text-primary hover:underline">{words.signinLink}</a>
        )}
      </p>
    </div>
  )
}
