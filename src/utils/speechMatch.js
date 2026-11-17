/**
 * Matching what a speech recognizer heard against the target word.
 * Shared by the browser on-device engine and the Vosk engine.
 */

// Words a child can say identically but a recognizer may spell differently.
const SOUND_ALIKES = [
  ['to', 'two', 'too', '2'],
  ['there', 'their', "they're"],
  ['for', 'four', 'fore', '4'],
  ['one', 'won', '1'],
  ['write', 'right', 'rite'],
  ['know', 'no'],
  ['knew', 'new'],
  ['by', 'buy', 'bye'],
  ['i', 'eye'],
  ['be', 'bee'],
  ['see', 'sea'],
  ['would', 'wood'],
  ['here', 'hear'],
  ['its', "it's"],
  ['your', "you're"],
  ['our', 'hour'],
  ['son', 'sun'],
  ['eight', 'ate', '8'],
  ['road', 'rode'],
  ['whole', 'hole'],
  ['made', 'maid'],
  ['some', 'sum'],
  ['which', 'witch'],
  ['week', 'weak'],
  ['sea', 'see'],
  ['red', 'read'],
  ['three', '3'],
  ['five', '5'],
  ['six', '6'],
  ['seven', '7'],
  ['nine', '9'],
  ['ten', '10'],
  ['hundred', '100']
]

export const normalize = (text) =>
  String(text || '')
    .toLowerCase()
    .replace(/[’`]/g, "'")
    .replace(/[^a-z0-9' ]+/g, ' ')
    .trim()

export function acceptableForms(target) {
  const key = normalize(target)
  const forms = new Set([key])
  for (const group of SOUND_ALIKES) {
    if (group.includes(key)) group.forEach((w) => forms.add(w))
  }
  return forms
}

/**
 * Did any of the recognizer's guesses contain the target word
 * (or a word that sounds exactly the same)?
 */
export function heardWord(target, transcripts = []) {
  const forms = acceptableForms(target)
  const multiWord = normalize(target).includes(' ')
  return transcripts.some((t) => {
    const text = normalize(t)
    if (multiWord) return text.includes(normalize(target))
    return text.split(/\s+/).some((token) => forms.has(token))
  })
}
