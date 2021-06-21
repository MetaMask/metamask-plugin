import localforage from 'localforage';

export async function getStorageItem(key) {
  try {
    const serializedData = await localforage.getItem(key);
    if (serializedData === null) {
      return undefined;
    }

    return JSON.parse(serializedData);
  } catch (err) {
    return undefined;
  }
}

export async function setStorageItem(key, value) {
  try {
    const serializedData = JSON.stringify(value);
    await localforage.setItem(key, serializedData);
  } catch (err) {
    console.warn(err);
  }
}
