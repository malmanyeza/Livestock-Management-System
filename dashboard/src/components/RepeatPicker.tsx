import { useState, useEffect } from 'react'
import { Repeat, Check, ChevronDown, Minus, Plus, X } from 'lucide-react'
import {
  RecurrenceRule,
  RepeatFrequency,
  CustomRepeatUnit,
  formatRecurrenceLabel,
} from '../utils/recurrence'

interface RepeatPickerProps {
  value: RecurrenceRule
  onChange: (rule: RecurrenceRule) => void
}

const PRESET_OPTIONS: { label: string; value: RepeatFrequency }[] = [
  { label: 'Does not repeat', value: 'none' },
  { label: 'Every day', value: 'daily' },
  { label: 'Every week', value: 'weekly' },
  { label: 'Every month', value: 'monthly' },
  { label: 'Every year', value: 'yearly' },
]

const CUSTOM_UNITS: { label: string; value: CustomRepeatUnit }[] = [
  { label: 'Day', value: 'day' },
  { label: 'Week', value: 'week' },
  { label: 'Month', value: 'month' },
  { label: 'Year', value: 'year' },
]

const WEEKDAYS: { label: string; value: number }[] = [
  { label: 'S', value: 0 },
  { label: 'M', value: 1 },
  { label: 'T', value: 2 },
  { label: 'W', value: 3 },
  { label: 'T', value: 4 },
  { label: 'F', value: 5 },
  { label: 'S', value: 6 },
]

export function RepeatPicker({ value, onChange }: RepeatPickerProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [customOpen, setCustomOpen] = useState(false)

  const [customInterval, setCustomInterval] = useState(1)
  const [customUnit, setCustomUnit] = useState<CustomRepeatUnit>('week')
  const [customDays, setCustomDays] = useState<number[]>([])
  const [hasEndDate, setHasEndDate] = useState(false)
  const [endDateInput, setEndDateInput] = useState('')
  const [customError, setCustomError] = useState('')

  useEffect(() => {
    if (customOpen) {
      setCustomInterval(value?.interval && value.interval >= 1 ? value.interval : 1)
      setCustomUnit(value?.unit || 'week')
      setCustomDays(value?.daysOfWeek ? [...value.daysOfWeek] : [])
      setHasEndDate(Boolean(value?.endDate))
      setEndDateInput(value?.endDate || '')
      setCustomError('')
    }
  }, [customOpen, value])

  const currentFreq = value?.frequency || 'none'

  const handleSelectPreset = (frequency: RepeatFrequency) => {
    onChange({ frequency })
    setMenuOpen(false)
  }

  const toggleDay = (dayVal: number) => {
    setCustomDays((prev) =>
      prev.includes(dayVal) ? prev.filter((d) => d !== dayVal) : [...prev, dayVal]
    )
  }

  const handleSaveCustom = () => {
    if (customInterval < 1) {
      setCustomError('Interval must be at least 1.')
      return
    }
    if (hasEndDate && !/^\d{4}-\d{2}-\d{2}$/.test(endDateInput.trim())) {
      setCustomError('Please select a valid end date.')
      return
    }

    onChange({
      frequency: 'custom',
      interval: customInterval,
      unit: customUnit,
      daysOfWeek: customUnit === 'week' && customDays.length > 0 ? customDays : undefined,
      endDate: hasEndDate ? endDateInput.trim() : undefined,
    })
    setCustomOpen(false)
  }

  return (
    <div className="relative">
      <label className="block text-xs font-semibold mb-1 uppercase tracking-wider text-neutral-500">
        Repeat
      </label>

      <button
        type="button"
        onClick={() => setMenuOpen((o) => !o)}
        className="w-full flex items-center justify-between rounded-xl px-4 py-2.5 text-sm border bg-neutral-50 border-neutral-200 text-neutral-900 hover:border-[#7AC142] transition-colors"
      >
        <span className="flex items-center gap-2.5 truncate">
          <Repeat size={15} className="text-neutral-500 shrink-0" />
          <span className="truncate">{formatRecurrenceLabel(value)}</span>
        </span>
        <ChevronDown size={14} className="text-neutral-500 shrink-0" />
      </button>

      {menuOpen && (
        <div className="absolute left-0 right-0 mt-1.5 z-30 rounded-xl bg-white border border-neutral-200 shadow-xl py-1.5 overflow-hidden">
          {PRESET_OPTIONS.map((opt) => {
            const isSelected = currentFreq === opt.value
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleSelectPreset(opt.value)}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-left transition-colors ${
                  isSelected
                    ? 'bg-[#F0F9EB] text-[#639A34] font-semibold'
                    : 'text-neutral-800 hover:bg-neutral-50'
                }`}
              >
                <span className="w-4 flex items-center justify-center shrink-0">
                  {isSelected && <Check size={15} />}
                </span>
                <span>{opt.label}</span>
              </button>
            )
          })}

          <div className="my-1 border-t border-neutral-100" />

          <button
            type="button"
            onClick={() => {
              setMenuOpen(false)
              setCustomOpen(true)
            }}
            className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-left transition-colors ${
              currentFreq === 'custom'
                ? 'bg-[#F0F9EB] text-[#639A34] font-semibold'
                : 'text-neutral-800 hover:bg-neutral-50'
            }`}
          >
            <span className="w-4 flex items-center justify-center shrink-0">
              {currentFreq === 'custom' && <Check size={15} />}
            </span>
            <span>Custom...</span>
          </button>
        </div>
      )}

      {customOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
        >
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
              <h4 className="text-base font-bold text-neutral-900">Custom Recurrence</h4>
              <button
                type="button"
                onClick={() => setCustomOpen(false)}
                className="p-1 rounded-lg hover:bg-neutral-100 text-neutral-500"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {customError && (
                <p className="text-xs px-3 py-2 rounded-lg bg-red-50 text-red-600">{customError}</p>
              )}

              <div>
                <label className="block text-xs font-semibold mb-2 uppercase tracking-wider text-neutral-500">
                  Repeats every
                </label>
                <div className="flex items-center gap-3 mb-3">
                  <button
                    type="button"
                    onClick={() => setCustomInterval((v) => Math.max(1, v - 1))}
                    className="w-9 h-9 rounded-lg border border-neutral-200 flex items-center justify-center hover:bg-neutral-50"
                  >
                    <Minus size={16} />
                  </button>
                  <input
                    type="number"
                    min={1}
                    max={365}
                    value={customInterval}
                    onChange={(e) => setCustomInterval(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="w-16 h-9 text-center font-semibold rounded-lg border border-neutral-200 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setCustomInterval((v) => Math.min(365, v + 1))}
                    className="w-9 h-9 rounded-lg border border-neutral-200 flex items-center justify-center hover:bg-neutral-50"
                  >
                    <Plus size={16} />
                  </button>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {CUSTOM_UNITS.map((u) => {
                    const active = customUnit === u.value
                    return (
                      <button
                        key={u.value}
                        type="button"
                        onClick={() => setCustomUnit(u.value)}
                        className={`py-2 rounded-lg text-xs font-semibold border transition-colors ${
                          active
                            ? 'bg-[#7AC142] border-[#7AC142] text-white'
                            : 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                        }`}
                      >
                        {customInterval === 1 ? u.label : `${u.label}s`}
                      </button>
                    )
                  })}
                </div>
              </div>

              {customUnit === 'week' && (
                <div>
                  <label className="block text-xs font-semibold mb-2 uppercase tracking-wider text-neutral-500">
                    Repeat on (optional)
                  </label>
                  <div className="flex justify-between gap-1">
                    {WEEKDAYS.map((day) => {
                      const active = customDays.includes(day.value)
                      return (
                        <button
                          key={day.value}
                          type="button"
                          onClick={() => toggleDay(day.value)}
                          className={`w-9 h-9 rounded-full text-xs font-bold border transition-colors ${
                            active
                              ? 'bg-[#7AC142] border-[#7AC142] text-white'
                              : 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                          }`}
                        >
                          {day.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold mb-2 uppercase tracking-wider text-neutral-500">
                  Ends
                </label>
                <div className="flex gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => setHasEndDate(false)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold border ${
                      !hasEndDate
                        ? 'bg-[#7AC142] border-[#7AC142] text-white'
                        : 'bg-white border-neutral-200 text-neutral-700'
                    }`}
                  >
                    Never
                  </button>
                  <button
                    type="button"
                    onClick={() => setHasEndDate(true)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold border ${
                      hasEndDate
                        ? 'bg-[#7AC142] border-[#7AC142] text-white'
                        : 'bg-white border-neutral-200 text-neutral-700'
                    }`}
                  >
                    On date
                  </button>
                </div>
                {hasEndDate && (
                  <input
                    type="date"
                    value={endDateInput}
                    onChange={(e) => setEndDateInput(e.target.value)}
                    className="w-full rounded-xl px-3.5 py-2 text-sm border border-neutral-200 bg-neutral-50"
                  />
                )}
              </div>
            </div>

            <div className="flex gap-3 px-5 py-4 border-t border-neutral-100">
              <button
                type="button"
                onClick={() => setCustomOpen(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveCustom}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-[#7AC142] hover:opacity-95"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

