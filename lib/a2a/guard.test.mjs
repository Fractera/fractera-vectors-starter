// Samples for the outbound A2A guard (step 419-1): every rule fires on its own sample and stays silent on clean text.
// Run: node lib/a2a/guard.test.mjs  — exit code 1 on any miss.
import { checkOutbound, checkOutboundData, DEFAULT_POLICY } from './guard.mjs'

const policy = { rules: { ...DEFAULT_POLICY.rules }, ownerWords: ['проект Гермес', 'salary'] }
let failures = 0
const expect = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want)
  if (!ok) failures++
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${ok ? '' : `\n     got  ${JSON.stringify(got)}\n     want ${JSON.stringify(want)}`}`)
}
const v = (text, p = policy) => { const r = checkOutbound(text, p); return [r.verdict, r.rules] }

// Fires on its own sample
expect('card with spaces', v('Карта 4111 1111 1111 1111, оплатите'), ['deny', ['card']])
expect('card with dashes', v('card: 5500-0000-0000-0004'), ['deny', ['card']])
expect('card glued', v('pay with 378282246310005 please'), ['deny', ['card']])
expect('cvv by word', v('CVV: 123'), ['deny', ['cvv']])
expect('cvv after card', v('4111 1111 1111 1111 exp 12/29 737'), ['deny', ['card', 'cvv']])
expect('openai key', v('ключ OPENAI: sk-proj-AbCdEf0123456789xyzXYZ0123'), ['deny', ['secret']])
expect('env line', v('OPENAI_API_KEY=abc123def456'), ['deny', ['secret']])
expect('github token', v('ghp_0123456789abcdefABCDEF0123456789abcd'), ['deny', ['secret']])
expect('telegram bot token', v('bot 8123456789:AAH-abcdefghijklmnopqrstuvwxyz01234'), ['deny', ['secret']])
expect('aws key', v('AKIAIOSFODNN7EXAMPLE'), ['deny', ['secret']])
expect('private key', v('-----BEGIN RSA PRIVATE KEY-----\nMIIE\n-----END RSA PRIVATE KEY-----'), ['deny', ['secret']])
expect('long hex 64', v('a'.repeat(0) + 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'), ['deny', ['secret']])
expect('owner words', v('Это про проект Гермес, никому'), ['deny', ['owner-words']])
expect('owner words any case', v('My SALARY is'), ['deny', ['owner-words']])
const phone = checkOutbound('Звоните +7 (916) 123-45-67', policy)
expect('phone masked', [phone.verdict, phone.rules, phone.text], ['mask', ['phone'], 'Звоните [hidden]'])
const mail = checkOutbound('пишите ivan.petrov@example.com завтра', policy)
expect('email masked', [mail.verdict, mail.rules, mail.text], ['mask', ['email'], 'пишите [hidden] завтра'])
expect('deny beats mask', v('ivan@example.com sk-ant-0123456789abcdefghij'), ['deny', ['secret', 'email']])
expect('denied text is empty', checkOutbound('CVV 123', policy).text, '')

// Silent on clean text
expect('plain answer', v('Сайт aifa.dev отвечает, страница /ru/about обновлена.'), ['allow', []])
expect('date and time', v('2026-10-06 22:02, задача закрыта'), ['allow', []])
expect('uuid task id', v('Задача 0199a3b2-7c41-7d2e-9f10-3b4c5d6e7f80 COMPLETED'), ['allow', []])
expect('element task id', v('roman-0199a3b2-7c41-7d2e-9f10-3b4c5d6e7f80'), ['allow', []])
expect('git commit id 40', v('коммит 797f101a2b3c4d5e6f708192a3b4c5d6e7f80912'), ['allow', []])
expect('order number not luhn', v('Заказ 1234567812345678'), ['allow', []])
expect('price', v('Цена 1 200 $, скидка 15 %'), ['allow', []])
expect('port and version', v('порт 24687, шаблон v0.3.68'), ['allow', []])
expect('word key alone', v('the key idea is simple; token of thanks'), ['allow', []])
expect('url with path', v('https://github.com/fractera/web4/blob/main/README.md'), ['allow', []])

// Policy
expect('rule off', v('CVV: 123', { rules: { ...policy.rules, cvv: 'off' }, ownerWords: [] }), ['allow', []])
expect('email set to deny', v('a@b.io', { rules: { ...policy.rules, email: 'deny' }, ownerWords: [] }), ['deny', ['email']])

// JSON data
const d = checkOutboundData({ ok: true, contact: { mail: 'x@y.com' }, list: ['fine'] }, policy)
expect('data masked', [d.verdict, d.data], ['mask', { ok: true, contact: { mail: '[hidden]' }, list: ['fine'] }])
expect('data denied', checkOutboundData({ env: { k: 'sk-0123456789abcdefghijkl' } }, policy).verdict, 'deny')
expect('data clean', checkOutboundData({ n: 5, s: 'hello' }, policy).verdict, 'allow')

console.log(failures ? `\n${failures} FAILED` : '\nall passed')
process.exit(failures ? 1 : 0)
