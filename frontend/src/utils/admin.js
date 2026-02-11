const ADMIN_STORAGE_KEY = 'admin'
const ADMIN_VALUE = 'matt'

export function isAdmin() {
  if (typeof localStorage === 'undefined') return false
  return localStorage.getItem(ADMIN_STORAGE_KEY) === ADMIN_VALUE
}

export function setAdmin() {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(ADMIN_STORAGE_KEY, ADMIN_VALUE)
}

export function clearAdmin() {
  if (typeof localStorage === 'undefined') return
  localStorage.removeItem(ADMIN_STORAGE_KEY)
}
