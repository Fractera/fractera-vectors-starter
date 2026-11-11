// 579-1: что редактор своего оформления говорит вместо полей. Общие для четырёх страниц `admin/design/*`; выбирает сервер.
import type { AccessWords } from './settings-access'

const EN: AccessWords = {
  loading: 'Loading the design…',
  signin: 'Sign in as the architect to see and change the design of this element.',
  signinLink: 'Sign in',
  forbidden: 'You are signed in, but only the architect can see and change the design of this element.',
  unavailable: 'The sign-in service is not answering right now. Try again in a minute.',
  error: 'The design could not be read. Nothing was changed.',
}

const RU: AccessWords = {
  loading: 'Загружаю оформление…',
  signin: 'Войдите как архитектор, чтобы видеть и менять оформление этого элемента.',
  signinLink: 'Войти',
  forbidden: 'Вы вошли, но видеть и менять оформление этого элемента может только архитектор.',
  unavailable: 'Служба входа сейчас не отвечает. Попробуйте через минуту.',
  error: 'Оформление не удалось прочитать. Ничего не изменено.',
}

export const designAccessWords = (lang: string): AccessWords => (lang === 'ru' ? RU : EN)
