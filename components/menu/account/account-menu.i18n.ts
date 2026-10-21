// Co-located account-control strings. They BELONG to the account feature and are imported
// by nothing else — delete components/menu/account/ and they go with it (co-location rule).
//
// Eight strings across the FULL 82-language catalogue (config/translations/
// language-metadata.ts), English fallback for anything unlisted. `account` is the label of
// the account button/drawer: it is chosen IDIOMATICALLY per locale (how each language
// actually names this control), NOT translated literally — e.g. en "My account",
// ru "Личный кабинет", de "Mein Konto", ja "マイアカウント". The same applies to the four
// layer headers: several languages use one word for "personal" and "staff" (es/ro
// "Personal" means the staff), so the personal layer is named "my space" there instead of
// translated word-for-word.
//
// 🪦 The key `projects` was removed 2026-08-11: it headed the Projects accordion, and the
// Projects layer was demolished in step 500. A dead key in an 82-language file costs a
// translation in every one of them, forever, for a screen nobody can open.

export type AccountLabels = {
  signIn: string;   // not authenticated → opens the auth flow
  account: string;  // authenticated → opens the account drawer (idiomatic per locale)
  signOut: string;  // bottom of the drawer
  // Headers of the four permission layers the drawer groups its sections by
  // (`PROTECTED_GROUP_ROLES` in lib/roles.ts). They belong HERE, in the full
  // 82-language catalogue, because the four layers are the product's own
  // architecture — every project built on this starter has them, and a layer
  // that speaks English on a Japanese site is a broken reusable element, not a
  // missing translation. The labels of the LINKS inside a section are the
  // opposite case: they name one project's pages and live with those pages.
  groupAccount: string;  // (account) — the visitor's own data
  groupStaff: string;    // (staff)   — other people's data, on duty
  groupFinance: string;  // (finance) — money
  groupAdmin: string;    // (admin)   — the project itself
  groupEmpty: string;    // layer the person belongs to, with no pages built yet
};

const ACCOUNT: Record<string, AccountLabels> = {
  en: { signIn: "Sign in", account: "My account", signOut: "Sign out", groupAccount: "Personal", groupStaff: "Staff", groupFinance: "Finance", groupAdmin: "Administration", groupEmpty: "No sections yet" },
  ru: { signIn: "Войти", account: "Личный кабинет", signOut: "Выйти", groupAccount: "Личное", groupStaff: "Персонал", groupFinance: "Финансы", groupAdmin: "Администрирование", groupEmpty: "Разделов пока нет" },
};

export function accountLabels(lang: string): AccountLabels {
  return ACCOUNT[lang] ?? ACCOUNT.en;
}
