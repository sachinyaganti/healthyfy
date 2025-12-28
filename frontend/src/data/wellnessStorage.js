import { loadJson, saveJson, scopedKey } from '../utils/storage.js'

// User-scoped localStorage collections.
// In Step 2/3, these collections map to backend REST APIs + MySQL tables.

export function loadUserCollection(userId, collectionName) {
  return loadJson(scopedKey(userId, collectionName), [])
}

export function saveUserCollection(userId, collectionName, items) {
  saveJson(scopedKey(userId, collectionName), items)
}

export function appendUserCollectionItem(userId, collectionName, item) {
  const items = loadUserCollection(userId, collectionName)
  items.unshift(item)
  saveUserCollection(userId, collectionName, items)
  return items
}

export function removeUserCollectionItem(userId, collectionName, id) {
  const items = loadUserCollection(userId, collectionName)
  const next = items.filter((x) => x.id !== id)
  saveUserCollection(userId, collectionName, next)
  return next
}
