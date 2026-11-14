import { useAccessibility } from '../../contexts/AccessibilityContext'
import { speak } from '../../utils/speech'
import styles from './AccessibilitySettings.module.css'

const FONTS = [
  { value: 'default', label: 'Standard (Lexend)' },
  { value: 'atkinson', label: 'Atkinson Hyperlegible – extra-clear letters' },
  { value: 'opendyslexic', label: 'OpenDyslexic – heavier letter bottoms' }
]
const THEMES = [
  { value: 'default', label: 'Standard' },
  { value: 'cream', label: 'Cream paper' },
  { value: 'blue-tint', label: 'Soft blue' },
  { value: 'yellow-tint', label: 'Soft yellow' },
  { value: 'dark', label: 'Dark' },
  { value: 'high-contrast', label: 'High contrast (black & yellow)' }
]
const SPACING = [
  { value: 'normal', label: 'Normal' },
  { value: 'wide', label: 'Wide' },
  { value: 'wider', label: 'Extra wide' }
]
const LINES = [
  { value: 'normal', label: 'Normal' },
  { value: 'relaxed', label: 'Relaxed' },
  { value: 'loose', label: 'Loose' }
]

const Toggle = ({ id, label, hint, checked, onChange }) => (
  <div className={styles.toggleRow}>
    <input
      id={id}
      type="checkbox"
      role="switch"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      aria-describedby={hint ? `${id}-hint` : undefined}
    />
    <label htmlFor={id}>
      {label}
      {hint && (
        <span id={`${id}-hint`} className={styles.hint}>
          {hint}
        </span>
      )}
    </label>
  </div>
)

const ChoiceGroup = ({ name, legend, options, value, onChange }) => (
  <fieldset className={styles.group}>
    <legend>{legend}</legend>
    <div className={styles.choices}>
      {options.map((opt) => (
        <label key={opt.value} className={styles.choice}>
          <input
            type="radio"
            name={name}
            value={opt.value}
            checked={value === opt.value}
            onChange={() => onChange(opt.value)}
          />
          <span>{opt.label}</span>
        </label>
      ))}
    </div>
  </fieldset>
)

/**
 * Lets a student (or an adult helping them) adjust how words look and sound.
 * Changes apply immediately everywhere and are saved to the profile.
 */
const AccessibilitySettings = () => {
  const { settings, updateSettings, resetSettings, saveState } = useAccessibility()

  return (
    <section className={styles.panel} aria-labelledby="a11y-heading">
      <h1 id="a11y-heading">Reading &amp; display settings</h1>
      <p className={styles.intro}>
        Make the words easier for <strong>you</strong> to read. Changes happen
        right away.
      </p>

      <div className={styles.preview} aria-label="Preview">
        <span className={styles.previewWord}>said</span>
        <span className={styles.previewSentence}>
          She said the big dog was here.
        </span>
        <button
          type="button"
          onClick={() => speak('She said the big dog was here.')}
        >
          🔊 Hear it
        </button>
      </div>

      <ChoiceGroup
        name="font"
        legend="Letter style"
        options={FONTS}
        value={settings.font}
        onChange={(font) => updateSettings({ font })}
      />

      <fieldset className={styles.group}>
        <legend>Text size</legend>
        <div className={styles.sliderRow}>
          <button
            type="button"
            onClick={() =>
              updateSettings({
                textScale: Math.max(1, +(settings.textScale - 0.25).toFixed(2))
              })
            }
          >
            A− <span className="visually-hidden">Smaller text</span>
          </button>
          <label htmlFor="text-scale" className="visually-hidden">
            Text size
          </label>
          <input
            id="text-scale"
            type="range"
            min="1"
            max="2.5"
            step="0.25"
            value={settings.textScale}
            aria-valuetext={`${Math.round(settings.textScale * 100)} percent`}
            onChange={(e) => updateSettings({ textScale: Number(e.target.value) })}
          />
          <button
            type="button"
            onClick={() =>
              updateSettings({
                textScale: Math.min(2.5, +(settings.textScale + 0.25).toFixed(2))
              })
            }
          >
            A+ <span className="visually-hidden">Bigger text</span>
          </button>
          <output htmlFor="text-scale">
            {Math.round(settings.textScale * 100)}%
          </output>
        </div>
      </fieldset>

      <ChoiceGroup
        name="letterSpacing"
        legend="Space between letters"
        options={SPACING}
        value={settings.letterSpacing}
        onChange={(letterSpacing) => updateSettings({ letterSpacing })}
      />
      <ChoiceGroup
        name="lineSpacing"
        legend="Space between lines"
        options={LINES}
        value={settings.lineSpacing}
        onChange={(lineSpacing) => updateSettings({ lineSpacing })}
      />
      <ChoiceGroup
        name="theme"
        legend="Colours"
        options={THEMES}
        value={settings.theme}
        onChange={(theme) => updateSettings({ theme })}
      />

      <fieldset className={styles.group}>
        <legend>More options</legend>
        <Toggle
          id="a11y-read-aloud"
          label="Read instructions out loud"
          checked={settings.readAloudInstructions}
          onChange={(readAloudInstructions) => updateSettings({ readAloudInstructions })}
        />
        <Toggle
          id="a11y-sounds"
          label="Happy sounds when I get it right"
          checked={settings.soundEffects}
          onChange={(soundEffects) => updateSettings({ soundEffects })}
        />
        <Toggle
          id="a11y-motion"
          label="Less movement"
          hint="Turns off animations and sliding."
          checked={settings.reduceMotion}
          onChange={(reduceMotion) => updateSettings({ reduceMotion })}
        />
        <Toggle
          id="a11y-targets"
          label="Bigger buttons"
          hint="Easier to tap or click."
          checked={settings.largeTargets}
          onChange={(largeTargets) => updateSettings({ largeTargets })}
        />
        <Toggle
          id="a11y-focus"
          label="Focus mode"
          hint="Hides the menu and extras while practising."
          checked={settings.focusMode}
          onChange={(focusMode) => updateSettings({ focusMode })}
        />
      </fieldset>

      <div className={styles.footer}>
        <button type="button" onClick={resetSettings}>
          Reset to standard
        </button>
        <span role="status" aria-live="polite" className={styles.saveState}>
          {saveState === 'saving' && 'Saving…'}
          {saveState === 'saved' && 'Saved to your profile'}
          {saveState === 'error' && 'Saved on this device only'}
        </span>
      </div>
    </section>
  )
}

export default AccessibilitySettings
