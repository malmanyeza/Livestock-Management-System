import { useEffect, useState, useMemo, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import {
  MapPin, Phone, MessageCircle, Search, Plus, X,
  Tag, Milk, Wheat, AlertTriangle, ChevronDown, Check,
  Trash2, Upload, Image as ImageIcon, Loader2
} from 'lucide-react'

// ─── Colour tokens ─────────────────────────────────────────────────────────────
const C = {
  primary50:  '#F0F9EB', primary100: '#DCEFC5', primary300: '#AAD775',
  primary500: '#7AC142', primary600: '#639A34',
  success50:  '#E6F9F1', success100: '#C2F0DC', success500: '#43B97C', success600: '#359563',
  warning50:  '#FFFAEB', warning100: '#FFE6A3', warning500: '#FFC107', warning600: '#D6A206',
  error50:    '#FDEDEC', error100:   '#F5B7B1', error500:   '#E74C3C', error700: '#922B21',
  neutral50:  '#F8F9FA', neutral100: '#E9ECEF', neutral200: '#DEE2E6',
  neutral300: '#CED4DA', neutral400: '#ADB5BD', neutral500: '#6C757D', neutral600: '#495057',
  neutral700: '#343A40', neutral800: '#23272B', neutral900: '#121416',
  white:      '#FFFFFF',
}

// ─── Types ─────────────────────────────────────────────────────────────────────
type BuyCategory = 'Livestock' | 'Milk' | 'Feed Products'
type TabKey      = 'buy' | 'sell' | 'lost'

interface DbListing {
  id: string
  created_at: string
  user_id: string
  category: string
  title: string
  price: string | null
  location: string | null
  description: string | null
  image_url: string | null
  details: Record<string, string> | null
  seller_name: string | null
  seller_phone: string | null
}

const BUY_CATEGORIES: BuyCategory[] = ['Livestock', 'Milk', 'Feed Products']

const CATEGORY_ICONS: Record<BuyCategory, React.FC<any>> = {
  'Livestock':     Tag,
  'Milk':          Milk,
  'Feed Products': Wheat,
}

// Fields shown in the create form per category
const CATEGORY_FIELDS: Record<BuyCategory, { label: string; key: string; placeholder: string }[]> = {
  'Livestock': [
    { label: 'Breed',       key: 'breed',  placeholder: 'e.g. Brahman, Mashona' },
    { label: 'Age',         key: 'age',    placeholder: 'e.g. 3 years' },
    { label: 'Weight (kg)', key: 'weight', placeholder: 'e.g. 750' },
  ],
  'Milk': [
    { label: 'Milk Type',   key: 'type',   placeholder: 'e.g. Raw, Pasteurized, Organic' },
    { label: 'Volume/Unit', key: 'volume', placeholder: 'e.g. 5 liters, 2L bottle' },
    { label: 'Availability', key: 'avail', placeholder: 'e.g. Daily, Tue & Fri' },
  ],
  'Feed Products': [
    { label: 'Feed Type',     key: 'type',     placeholder: 'e.g. Cattle Feed, Poultry Feed' },
    { label: 'Bag Weight',    key: 'weight',   placeholder: 'e.g. 50 kg' },
    { label: 'Minimum Order', key: 'minOrder', placeholder: 'e.g. 5 bags' },
  ],
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
async function uploadImage(file: File, userId: string): Promise<string> {
  const ext  = file.name.split('.').pop()
  const path = `${userId}/${crypto.randomUUID()}.${ext}`
  const { error } = await supabase.storage
    .from('marketplace-images')
    .upload(path, file, { cacheControl: '3600', upsert: false })
  if (error) {
    console.error('Image upload error:', error)
    if (error.message?.toLowerCase().includes('bucket not found')) {
      throw new Error(
        'Storage bucket "marketplace-images" not found. ' +
        'Please create a public bucket named marketplace-images in your Supabase dashboard (Storage → New bucket).'
      )
    }
    throw new Error(`Image upload failed: ${error.message}`)
  }
  const { data } = supabase.storage.from('marketplace-images').getPublicUrl(path)
  return data.publicUrl
}

async function deleteImage(imageUrl: string) {
  // Extract the path after the bucket name
  const match = imageUrl.match(/marketplace-images\/(.+)$/)
  if (!match) return
  await supabase.storage.from('marketplace-images').remove([match[1]])
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="rounded-2xl overflow-hidden border animate-pulse" style={{ backgroundColor: C.white, borderColor: C.neutral100 }}>
      <div className="w-full h-48" style={{ backgroundColor: C.neutral100 }} />
      <div className="p-4 space-y-3">
        <div className="h-4 rounded-lg w-3/4" style={{ backgroundColor: C.neutral100 }} />
        <div className="h-4 rounded-lg w-1/3" style={{ backgroundColor: C.neutral100 }} />
        <div className="flex gap-2">
          <div className="h-6 rounded-lg w-20" style={{ backgroundColor: C.neutral100 }} />
          <div className="h-6 rounded-lg w-20" style={{ backgroundColor: C.neutral100 }} />
        </div>
        <div className="h-3 rounded-lg w-full" style={{ backgroundColor: C.neutral100 }} />
        <div className="h-3 rounded-lg w-5/6" style={{ backgroundColor: C.neutral100 }} />
      </div>
    </div>
  )
}

function ContactModal({ listing, onClose }: { listing: DbListing; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl" style={{ backgroundColor: C.white }}>
        <div className="px-6 pt-6 pb-4 border-b flex items-center justify-between" style={{ borderColor: C.neutral100 }}>
          <h3 className="text-base font-bold" style={{ color: C.neutral900 }}>Contact Seller</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-neutral-100 transition-colors">
            <X size={18} style={{ color: C.neutral500 }} />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <p className="text-sm font-semibold" style={{ color: C.neutral700 }}>{listing.title}</p>
          <div className="rounded-xl p-4 space-y-3" style={{ backgroundColor: C.neutral50, border: `1px solid ${C.neutral200}` }}>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: C.neutral500 }}>Seller</p>
              <p className="font-bold text-sm" style={{ color: C.neutral900 }}>{listing.seller_name || 'Unknown'}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: C.neutral500 }}>Phone</p>
              <p className="font-semibold text-sm" style={{ color: C.primary600 }}>{listing.seller_phone || '—'}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <a href={`tel:${listing.seller_phone}`}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
              style={{ backgroundColor: C.primary500 }}>
              <Phone size={15} /> Call
            </a>
            <a href={`sms:${listing.seller_phone}`}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold border transition-all hover:bg-neutral-50"
              style={{ borderColor: C.primary300, color: C.primary600 }}>
              <MessageCircle size={15} /> Message
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

function CreateListingModal({
  category, userId, onClose, onCreated,
}: {
  category: BuyCategory | 'Lost' | 'Found'
  userId: string
  onClose: () => void
  onCreated: () => void
}) {
  const { targetUserId } = useAuth()
  const [form, setForm]           = useState<Record<string, string>>({})
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [preview, setPreview]     = useState<string | null>(null)
  const [saving, setSaving]       = useState(false)
  const [done, setDone]           = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [registeredAnimals, setRegisteredAnimals] = useState<any[]>([])
  const [animalSearch, setAnimalSearch] = useState('')

  const isBuyCategory = category === 'Livestock' || category === 'Milk' || category === 'Feed Products'
  const detailFields  = isBuyCategory ? CATEGORY_FIELDS[category as BuyCategory] : []

  useEffect(() => {
    if (category === 'Livestock') {
      const fetchAnimals = async () => {
        const { data, error } = await supabase
          .from('animals')
          .select('*')
          .eq('user_id', targetUserId || userId)
          .order('tag')
        if (!error && data) {
          setRegisteredAnimals(data)
        }
      }
      fetchAnimals()
    }
  }, [category, userId, targetUserId])

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setImageFile(f)
    setPreview(URL.createObjectURL(f))
  }

  const handleSubmit = async () => {
    if (!form.title?.trim()) { setError('Title is required.'); return }
    setSaving(true); setError(null)
    try {
      let image_url: string | null = null
      if (imageFile) {
        image_url = await uploadImage(imageFile, userId)
      }

      // Build details object from extra fields
      const details: Record<string, string> = {}
      detailFields.forEach(f => { if (form[f.key]) details[f.label] = form[f.key] })

      if (form.animalTag) {
        details['Animal Tag'] = form.animalTag
      }

      const { error: dbErr } = await supabase.from('marketplace_listings').insert({
        user_id:      userId,
        category,
        title:        form.title.trim(),
        price:        form.price ? `$${form.price}` : null,
        location:     form.location?.trim() || null,
        description:  form.description?.trim() || null,
        image_url,
        details:      Object.keys(details).length > 0 ? details : null,
        seller_name:  form.sellerName?.trim() || null,
        seller_phone: form.sellerPhone?.trim() || null,
      })
      if (dbErr) throw dbErr
      setDone(true)
      setTimeout(() => { onCreated(); onClose() }, 1400)
    } catch (err: any) {
      setError(err.message || 'Failed to create listing.')
    } finally {
      setSaving(false)
    }
  }

  const isLF = category === 'Lost' || category === 'Found'
  const accentColor = isLF ? (category === 'Lost' ? C.error500 : C.success600) : C.primary600

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}>
      <div className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl flex flex-col"
        style={{ backgroundColor: C.white, maxHeight: '92vh' }}>

        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b flex items-center justify-between" style={{ borderColor: C.neutral100 }}>
          <div>
            <h3 className="text-lg font-bold" style={{ color: C.neutral900 }}>
              {isLF ? `Report ${category} Animal` : 'Create Listing'}
            </h3>
            <p className="text-xs mt-0.5" style={{ color: C.neutral500 }}>
              {isLF ? 'Help reunite lost animals with their owners' : `Category: ${category}`}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-neutral-100 transition-colors">
            <X size={18} style={{ color: C.neutral500 }} />
          </button>
        </div>

        {done ? (
          <div className="flex flex-col items-center justify-center py-16 px-6">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
              style={{ backgroundColor: isLF ? (category === 'Lost' ? C.error50 : C.success50) : C.primary50 }}>
              <Check size={32} style={{ color: accentColor }} />
            </div>
            <p className="text-base font-bold" style={{ color: C.neutral900 }}>
              {isLF ? 'Report Submitted!' : 'Listing Created!'}
            </p>
            <p className="text-sm mt-1 text-center" style={{ color: C.neutral500 }}>
              {isLF ? 'Other farmers in your area will be notified.' : 'Your listing is now live on the marketplace.'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
              {error && (
                <div className="rounded-xl px-4 py-3 text-sm font-medium" style={{ backgroundColor: C.error50, color: C.error700 }}>
                  {error}
                </div>
              )}

              {/* Image upload */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: C.neutral500 }}>
                  Photo
                </label>
                <input type="file" accept="image/*" ref={fileRef} className="hidden" onChange={handleFile} />
                {preview ? (
                  <div className="relative rounded-xl overflow-hidden" style={{ height: 180 }}>
                    <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      onClick={() => { setImageFile(null); setPreview(null) }}
                      className="absolute top-2 right-2 p-1.5 rounded-full shadow-md"
                      style={{ backgroundColor: C.white }}>
                      <X size={14} style={{ color: C.neutral600 }} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="w-full flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed py-8 transition-colors hover:border-primary-300"
                    style={{ borderColor: C.neutral200, backgroundColor: C.neutral50 }}>
                    <ImageIcon size={28} style={{ color: C.neutral400 }} />
                    <span className="text-sm font-medium" style={{ color: C.neutral500 }}>Click to upload image</span>
                    <span className="text-xs" style={{ color: C.neutral400 }}>PNG, JPG up to 5 MB</span>
                  </button>
                )}
              </div>

              {/* Select Registered Animal */}
              {category === 'Livestock' && (
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: C.neutral500 }}>
                    Select Animal from Register
                  </label>
                  {registeredAnimals.length > 0 ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="🔍 Search animal by tag, breed or type..."
                        value={animalSearch}
                        onChange={e => setAnimalSearch(e.target.value)}
                        className="w-full rounded-xl px-4 py-2 text-xs outline-none border transition-colors"
                        style={{ borderColor: C.neutral200, color: C.neutral900, backgroundColor: C.white }}
                        onFocus={e => e.target.style.borderColor = accentColor}
                        onBlur={e => e.target.style.borderColor = C.neutral200}
                      />
                      <div className="relative">
                        <select
                          value={form.animalTag || ''}
                          onChange={e => {
                            const tag = e.target.value
                            const selected = registeredAnimals.find(a => a.tag === tag)
                            if (selected) {
                              setForm(p => ({
                                ...p,
                                title: `${selected.breed} (${selected.tag})`,
                                breed: selected.breed || '',
                                age: selected.age || '',
                                weight: selected.weaning_weight ? String(selected.weaning_weight) : '',
                                animalTag: selected.tag
                              }))
                            } else {
                              setForm(p => ({
                                ...p,
                                title: '',
                                breed: '',
                                age: '',
                                weight: '',
                                animalTag: ''
                              }))
                            }
                          }}
                          className="w-full rounded-xl px-4 py-2.5 text-sm outline-none border appearance-none cursor-pointer"
                          style={{ borderColor: C.neutral200, color: C.neutral900, backgroundColor: C.neutral50 }}
                          onFocus={e => e.target.style.borderColor = accentColor}
                          onBlur={e => e.target.style.borderColor = C.neutral200}
                        >
                          <option value="">-- Choose an Animal (optional) --</option>
                          {registeredAnimals
                            .filter(a =>
                              a.tag.toLowerCase().includes(animalSearch.toLowerCase()) ||
                              (a.breed && a.breed.toLowerCase().includes(animalSearch.toLowerCase())) ||
                              (a.stock_type && a.stock_type.toLowerCase().includes(animalSearch.toLowerCase()))
                            )
                            .map(a => (
                              <option key={a.id} value={a.tag}>
                                {a.tag} - {a.breed} ({a.stock_type})
                              </option>
                            ))}
                        </select>
                        <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: C.neutral500 }} />
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl px-4 py-3 text-sm border border-dashed flex flex-col gap-1" style={{ borderColor: C.neutral300, backgroundColor: C.neutral50 }}>
                      <span className="font-semibold text-xs text-neutral-500">No registered animals found.</span>
                      <span className="text-xs text-neutral-400">
                        Go to the <a href="/register" className="underline font-semibold" style={{ color: C.primary600 }}>Herd Register</a> to register your livestock first.
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: C.neutral500 }}>
                  {isLF ? 'Animal Tag / ID *' : 'Title *'}
                </label>
                <input value={form.title || ''} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  placeholder={isLF ? 'e.g. TAG123' : 'e.g. Brahman Bull, 3 years'}
                  className="w-full rounded-xl px-4 py-2.5 text-sm outline-none border transition-colors"
                  style={{ borderColor: C.neutral200, color: C.neutral900, backgroundColor: C.neutral50 }}
                  onFocus={e => e.target.style.borderColor = accentColor}
                  onBlur={e => e.target.style.borderColor = C.neutral200} />
              </div>

              {/* Category-specific detail fields */}
              {detailFields.map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: C.neutral500 }}>{f.label}</label>
                  <input value={form[f.key] || ''} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    className="w-full rounded-xl px-4 py-2.5 text-sm outline-none border transition-colors"
                    style={{ borderColor: C.neutral200, color: C.neutral900, backgroundColor: C.neutral50 }}
                    onFocus={e => e.target.style.borderColor = accentColor}
                    onBlur={e => e.target.style.borderColor = C.neutral200} />
                </div>
              ))}

              {/* Price (not for Lost & Found) */}
              {!isLF && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: C.neutral500 }}>Price (USD)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: C.neutral400 }}>$</span>
                    <input type="number" min="0" step="0.01" value={form.price || ''}
                      onChange={e => setForm(p => ({ ...p, price: e.target.value }))}
                      placeholder="0.00"
                      className="w-full rounded-xl pl-8 pr-4 py-2.5 text-sm outline-none border transition-colors"
                      style={{ borderColor: C.neutral200, color: C.neutral900, backgroundColor: C.neutral50 }}
                      onFocus={e => e.target.style.borderColor = accentColor}
                      onBlur={e => e.target.style.borderColor = C.neutral200} />
                  </div>
                </div>
              )}

              {/* Location */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: C.neutral500 }}>Location</label>
                <input value={form.location || ''} onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
                  placeholder="e.g. Harare, Zimbabwe"
                  className="w-full rounded-xl px-4 py-2.5 text-sm outline-none border transition-colors"
                  style={{ borderColor: C.neutral200, color: C.neutral900, backgroundColor: C.neutral50 }}
                  onFocus={e => e.target.style.borderColor = accentColor}
                  onBlur={e => e.target.style.borderColor = C.neutral200} />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: C.neutral500 }}>Description</label>
                <textarea rows={3} value={form.description || ''}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  placeholder={isLF ? 'Describe the animal: colour, markings, breed…' : 'Describe your listing in detail…'}
                  className="w-full rounded-xl px-4 py-2.5 text-sm outline-none border transition-colors resize-none"
                  style={{ borderColor: C.neutral200, color: C.neutral900, backgroundColor: C.neutral50 }}
                  onFocus={e => e.target.style.borderColor = accentColor}
                  onBlur={e => e.target.style.borderColor = C.neutral200} />
              </div>

              {/* Seller contact */}
              <div className="rounded-xl p-4 space-y-3" style={{ backgroundColor: C.neutral50, border: `1px solid ${C.neutral100}` }}>
                <p className="text-xs font-bold uppercase tracking-wider" style={{ color: C.neutral500 }}>Your Contact Info</p>
                <input value={form.sellerName || ''} onChange={e => setForm(p => ({ ...p, sellerName: e.target.value }))}
                  placeholder="Your name"
                  className="w-full rounded-xl px-4 py-2.5 text-sm outline-none border transition-colors"
                  style={{ borderColor: C.neutral200, color: C.neutral900, backgroundColor: C.white }}
                  onFocus={e => e.target.style.borderColor = accentColor}
                  onBlur={e => e.target.style.borderColor = C.neutral200} />
                <input value={form.sellerPhone || ''} onChange={e => setForm(p => ({ ...p, sellerPhone: e.target.value }))}
                  placeholder="Phone number e.g. +263 77 123 4567"
                  className="w-full rounded-xl px-4 py-2.5 text-sm outline-none border transition-colors"
                  style={{ borderColor: C.neutral200, color: C.neutral900, backgroundColor: C.white }}
                  onFocus={e => e.target.style.borderColor = accentColor}
                  onBlur={e => e.target.style.borderColor = C.neutral200} />
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 px-6 py-4 border-t" style={{ borderColor: C.neutral100 }}>
              <button onClick={onClose} disabled={saving}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                style={{ backgroundColor: C.neutral100, color: C.neutral700 }}>
                Cancel
              </button>
              <button onClick={handleSubmit} disabled={saving || !form.title?.trim()}
                className="flex-[1.5] flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: accentColor }}>
                {saving ? <><Loader2 size={15} className="animate-spin" /> Uploading…</> : (
                  <><Upload size={15} /> {isLF ? 'Submit Report' : 'Publish Listing'}</>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function MarkAsSoldModal({
  listing,
  animalTag,
  onClose,
  onSold,
}: {
  listing: DbListing
  animalTag: string
  onClose: () => void
  onSold: () => void
}) {
  const [price, setPrice] = useState(() => {
    return listing.price ? listing.price.replace(/[^0-9.]/g, '') : ''
  })
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0])
  const [description, setDescription] = useState(`Sale of animal ${animalTag} via Marketplace`)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleConfirm = async () => {
    const parsedPrice = parseFloat(price)
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      setError('Please enter a valid sale price.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      // 1. Create sale record in transaction_records
      const transactionPayload = {
        user_id: listing.user_id,
        date: date,
        type: 'Sale',
        amount: parsedPrice,
        description: description,
        category: 'Livestock'
      }
      const { error: txErr } = await supabase.from('transaction_records').insert(transactionPayload)
      if (txErr) throw txErr

      // 2. Delete the animal from animals register
      const { error: animalErr } = await supabase
        .from('animals')
        .delete()
        .eq('tag', animalTag)
        .eq('user_id', listing.user_id)
      if (animalErr) throw animalErr

      // 3. Delete the listing from marketplace
      const { error: listingErr } = await supabase
        .from('marketplace_listings')
        .delete()
        .eq('id', listing.id)
      if (listingErr) throw listingErr

      onSold()
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to complete sale action.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl" style={{ backgroundColor: C.white }}>
        <div className="px-6 pt-6 pb-4 border-b flex items-center justify-between" style={{ borderColor: C.neutral100 }}>
          <h3 className="text-base font-bold" style={{ color: C.neutral900 }}>Mark Animal as Sold</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-neutral-100 transition-colors">
            <X size={18} style={{ color: C.neutral500 }} />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <p className="text-sm" style={{ color: C.neutral600 }}>
            Marking <strong style={{ color: C.neutral900 }}>{listing.title}</strong> (Tag: {animalTag}) as sold will remove it from your register and log a sale transaction.
          </p>

          {error && (
            <div className="rounded-xl px-4 py-3 text-sm font-medium" style={{ backgroundColor: C.error50, color: C.error700 }}>
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: C.neutral500 }}>Sale Price (USD) *</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: C.neutral400 }}>$</span>
              <input type="number" min="0" step="0.01" value={price}
                onChange={e => setPrice(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-xl pl-8 pr-4 py-2.5 text-sm outline-none border transition-colors focus:border-green-500"
                style={{ borderColor: C.neutral200, color: C.neutral900, backgroundColor: C.neutral50 }} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: C.neutral500 }}>Sale Date *</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="w-full rounded-xl px-4 py-2.5 text-sm outline-none border transition-colors focus:border-green-500"
              style={{ borderColor: C.neutral200, color: C.neutral900, backgroundColor: C.neutral50 }} />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: C.neutral500 }}>Transaction Description</label>
            <input value={description} onChange={e => setDescription(e.target.value)}
              placeholder="e.g. Sold Brahman Bull to John Doe"
              className="w-full rounded-xl px-4 py-2.5 text-sm outline-none border transition-colors focus:border-green-500"
              style={{ borderColor: C.neutral200, color: C.neutral900, backgroundColor: C.neutral50 }} />
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={onClose} disabled={saving}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors"
              style={{ backgroundColor: C.neutral100, color: C.neutral700 }}>
              Cancel
            </button>
            <button onClick={handleConfirm} disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: C.success500 }}>
              {saving ? <Loader2 size={15} className="animate-spin" /> : 'Confirm Sale'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ListingCard({
  listing, isOwn, onContact, onDelete,
}: {
  listing: DbListing
  isOwn: boolean
  onContact: () => void
  onDelete: () => void
}) {
  const [imgErr, setImgErr]       = useState(false)
  const [deleting, setDeleting]   = useState(false)
  const [confirmDel, setConfirmDel] = useState(false)
  const [showSoldModal, setShowSoldModal] = useState(false)

  const animalTag = listing.category === 'Livestock' && listing.details && listing.details['Animal Tag']

  const handleDelete = async () => {
    if (!confirmDel) { setConfirmDel(true); return }
    setDeleting(true)
    if (listing.image_url) await deleteImage(listing.image_url)
    await supabase.from('marketplace_listings').delete().eq('id', listing.id)
    onDelete()
  }

  return (
    <div className="rounded-2xl overflow-hidden border flex flex-col transition-all hover:shadow-lg hover:-translate-y-0.5 duration-200"
      style={{ backgroundColor: C.white, borderColor: C.neutral100 }}>
      {/* Image */}
      <div className="relative overflow-hidden flex-shrink-0" style={{ height: 200 }}>
        {listing.image_url && !imgErr ? (
          <img src={listing.image_url} alt={listing.title}
            className="w-full h-full object-cover"
            onError={() => setImgErr(true)} />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: C.neutral100 }}>
            <ImageIcon size={40} style={{ color: C.neutral400 }} />
          </div>
        )}
        {/* Owner delete button */}
        {isOwn && (
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold shadow-md transition-all hover:opacity-90"
            style={{ backgroundColor: confirmDel ? C.error500 : C.white, color: confirmDel ? C.white : C.error500 }}>
            {deleting
              ? <Loader2 size={13} className="animate-spin" />
              : <Trash2 size={13} />}
            {confirmDel ? 'Confirm?' : 'Delete'}
          </button>
        )}
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-base leading-tight" style={{ color: C.neutral900 }}>{listing.title}</h4>
            {listing.price && (
              <p className="text-lg font-extrabold mt-0.5" style={{ color: C.primary600 }}>{listing.price}</p>
            )}
          </div>
          {isOwn && animalTag ? (
            <button onClick={() => setShowSoldModal(true)}
              className="flex-shrink-0 px-4 py-2 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95"
              style={{ backgroundColor: C.success500 }}>
              Mark Sold
            </button>
          ) : (
            <button onClick={onContact}
              className="flex-shrink-0 px-4 py-2 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95"
              style={{ backgroundColor: C.primary500 }}>
              Contact
            </button>
          )}
        </div>

        {/* Detail chips */}
        {listing.details && Object.keys(listing.details).length > 0 && (
          <div className="flex gap-2 flex-wrap mb-3">
            {Object.entries(listing.details).map(([k, v]) => (
              <div key={k} className="px-2.5 py-1 rounded-lg text-xs" style={{ backgroundColor: C.neutral100, color: C.neutral600 }}>
                <span className="font-semibold">{k}:</span> {v}
              </div>
            ))}
          </div>
        )}

        {listing.description && (
          <p className="text-sm leading-relaxed mb-3 line-clamp-2 flex-1" style={{ color: C.neutral600 }}>{listing.description}</p>
        )}

        <div className="flex items-center justify-between pt-3 border-t mt-auto" style={{ borderColor: C.neutral100 }}>
          {listing.location && (
            <div className="flex items-center gap-1.5">
              <MapPin size={13} style={{ color: C.neutral500 }} />
              <span className="text-xs" style={{ color: C.neutral500 }}>{listing.location}</span>
            </div>
          )}
          {listing.seller_name && (
            <span className="text-xs font-medium" style={{ color: C.neutral500 }}>by {listing.seller_name}</span>
          )}
        </div>
      </div>

      {showSoldModal && animalTag && (
        <MarkAsSoldModal
          listing={listing}
          animalTag={animalTag}
          onClose={() => setShowSoldModal(false)}
          onSold={onDelete}
        />
      )}
    </div>
  )
}

function LostFoundCard({
  item, isOwn, onContact, onDelete,
}: {
  item: DbListing
  isOwn: boolean
  onContact: () => void
  onDelete: () => void
}) {
  const isLost = item.category === 'Lost'
  const [confirmDel, setConfirmDel] = useState(false)
  const [deleting, setDeleting]     = useState(false)

  const badge = isLost
    ? { bg: C.error100,   color: C.error700,   label: 'LOST' }
    : { bg: C.success100, color: C.success600,  label: 'FOUND' }

  const handleDelete = async () => {
    if (!confirmDel) { setConfirmDel(true); return }
    setDeleting(true)
    if (item.image_url) await deleteImage(item.image_url)
    await supabase.from('marketplace_listings').delete().eq('id', item.id)
    onDelete()
  }

  return (
    <div className="rounded-2xl overflow-hidden border transition-all hover:shadow-lg duration-200"
      style={{ backgroundColor: C.white, borderColor: C.neutral100 }}>
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: C.neutral100 }}>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
          style={{ backgroundColor: badge.bg, color: badge.color }}>
          <AlertTriangle size={11} /> {badge.label}
        </span>
        <div className="flex items-center gap-3">
          <span className="text-xs" style={{ color: C.neutral500 }}>
            {new Date(item.created_at).toLocaleDateString()}
          </span>
          {isOwn && (
            <button onClick={handleDelete} disabled={deleting}
              className="flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg transition-all"
              style={{ backgroundColor: confirmDel ? C.error500 : C.error50, color: confirmDel ? C.white : C.error500 }}>
              {deleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
              {confirmDel ? 'Confirm?' : 'Delete'}
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-4 p-4">
        {item.image_url ? (
          <img src={item.image_url} alt={item.title} className="w-24 h-24 rounded-xl object-cover flex-shrink-0" />
        ) : (
          <div className="w-24 h-24 rounded-xl flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: C.neutral100 }}>
            <ImageIcon size={28} style={{ color: C.neutral400 }} />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm mb-1" style={{ color: C.neutral900 }}>Tag: {item.title}</p>
          {item.description && (
            <p className="text-sm leading-relaxed line-clamp-2 mb-2" style={{ color: C.neutral600 }}>{item.description}</p>
          )}
          {item.location && (
            <div className="flex items-center gap-1.5">
              <MapPin size={13} style={{ color: C.neutral500 }} />
              <span className="text-xs" style={{ color: C.neutral500 }}>{item.location}</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-3 px-4 pb-4">
        <button onClick={onContact}
          className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-semibold border transition-all hover:bg-neutral-50"
          style={{ borderColor: C.primary300, color: C.primary600 }}>
          <Phone size={14} /> Call
        </button>
        <button onClick={onContact}
          className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-semibold border transition-all hover:bg-neutral-50"
          style={{ borderColor: C.primary300, color: C.primary600 }}>
          <MessageCircle size={14} /> Message
        </button>
      </div>
    </div>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function Marketplace() {
  const { session } = useAuth()
  const userId = session?.user.id

  const [listings, setListings]     = useState<DbListing[]>([])
  const [loading, setLoading]       = useState(true)
  const [activeTab, setActiveTab]   = useState<TabKey>('buy')
  const [buyCategory, setBuyCategory] = useState<BuyCategory>('Livestock')
  const [sellCategory, setSellCategory] = useState<BuyCategory>('Livestock')
  const [search, setSearch]         = useState('')
  const [buyDropOpen, setBuyDropOpen] = useState(false)
  const [sellDropOpen, setSellDropOpen] = useState(false)
  const [contactItem, setContactItem] = useState<DbListing | null>(null)
  const [createCategory, setCreateCategory] = useState<BuyCategory | 'Lost' | 'Found' | null>(null)

  const fetchListings = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('marketplace_listings')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error) setListings(data ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchListings() }, [])

  // ── Filtered slices ─────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return listings.filter(l =>
      (l.title?.toLowerCase().includes(q) ||
       l.description?.toLowerCase().includes(q) ||
       l.location?.toLowerCase().includes(q) ||
       l.seller_name?.toLowerCase().includes(q))
    )
  }, [listings, search])

  const buyListings  = filtered.filter(l => l.category === buyCategory)
  const lostListings = filtered.filter(l => l.category === 'Lost' || l.category === 'Found')

  const sellCount = listings.filter(l =>
    l.user_id === userId &&
    l.category !== 'Lost' && l.category !== 'Found'
  ).length

  const currentCategory = activeTab === 'buy' ? buyCategory : sellCategory
  const CatIcon = CATEGORY_ICONS[currentCategory]

  const openDropdown = (tab: TabKey, e: React.MouseEvent) => {
    e.stopPropagation()
    setActiveTab(tab)
    setSearch('')
    if (tab === 'buy')  { setBuyDropOpen(o => !o); setSellDropOpen(false) }
    if (tab === 'sell') { setSellDropOpen(o => !o); setBuyDropOpen(false) }
    if (tab === 'lost') { setBuyDropOpen(false); setSellDropOpen(false) }
  }

  return (
    <div className="space-y-5 max-w-[1400px] mx-auto" onClick={() => { setBuyDropOpen(false); setSellDropOpen(false) }}>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold" style={{ color: C.neutral900 }}>Marketplace</h2>
          <p className="text-sm mt-0.5" style={{ color: C.neutral500 }}>Buy, sell, and trade livestock, milk, and feed products.</p>
        </div>

        <div className="flex gap-2 flex-shrink-0">
          {activeTab !== 'lost' && (
            <button
              onClick={e => { e.stopPropagation(); setCreateCategory(activeTab === 'buy' ? buyCategory : sellCategory) }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white shadow-sm hover:opacity-90 active:scale-[0.98] transition-all"
              style={{ backgroundColor: C.primary500 }}>
              <Plus size={16} /> Create Listing
            </button>
          )}
          {activeTab === 'lost' && (
            <>
              <button onClick={e => { e.stopPropagation(); setCreateCategory('Lost') }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white hover:opacity-90 transition-all"
                style={{ backgroundColor: C.error500 }}>
                <AlertTriangle size={15} /> Report Lost
              </button>
              <button onClick={e => { e.stopPropagation(); setCreateCategory('Found') }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border hover:bg-neutral-50 transition-all"
                style={{ borderColor: C.success500, color: C.success600 }}>
                <Check size={15} /> Report Found
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ backgroundColor: C.neutral100 }}>
        {([
          { key: 'buy'  as TabKey, label: 'Buy',           hasDropdown: true },
          { key: 'sell' as TabKey, label: 'My Listings',   hasDropdown: false },
          { key: 'lost' as TabKey, label: 'Lost & Found',  hasDropdown: false },
        ]).map(tab => {
          const isActive = activeTab === tab.key
          const isOpen   = tab.key === 'buy' ? buyDropOpen : tab.key === 'sell' ? sellDropOpen : false
          const badge    = tab.key === 'sell' ? sellCount : (tab.key === 'lost' ? lostListings.length : null)

          return (
            <div key={tab.key} className="relative flex-1">
              <button
                onClick={e => openDropdown(tab.key, e)}
                className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all"
                style={isActive
                  ? { backgroundColor: C.white, color: C.primary600, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }
                  : { backgroundColor: 'transparent', color: C.neutral500 }}>
                {tab.label}
                {badge !== null && badge > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-xs font-bold"
                    style={{ backgroundColor: isActive ? C.primary100 : C.neutral200, color: isActive ? C.primary600 : C.neutral600 }}>
                    {badge}
                  </span>
                )}
                {tab.hasDropdown && (
                  <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                )}
              </button>

              {/* Buy category dropdown */}
              {tab.hasDropdown && isOpen && isActive && (
                <div className="absolute top-full left-0 right-0 mt-1 rounded-xl overflow-hidden shadow-lg z-20"
                  style={{ backgroundColor: C.white, border: `1px solid ${C.neutral200}` }}
                  onClick={e => e.stopPropagation()}>
                  {BUY_CATEGORIES.map(cat => {
                    const Icon = CATEGORY_ICONS[cat]
                    const selected = buyCategory === cat
                    return (
                      <button key={cat}
                        onClick={() => { setBuyCategory(cat); setBuyDropOpen(false) }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium border-b last:border-b-0 transition-colors hover:bg-neutral-50"
                        style={{ borderColor: C.neutral100, color: selected ? C.primary600 : C.neutral700 }}>
                        <Icon size={15} style={{ color: selected ? C.primary500 : C.neutral500 }} />
                        {cat}
                        {selected && <Check size={14} className="ml-auto" style={{ color: C.primary500 }} />}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Search bar (buy + lost tabs) */}
      {activeTab !== 'sell' && (
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: C.neutral400 }} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder={activeTab === 'lost' ? 'Search by tag, location…' : `Search ${buyCategory.toLowerCase()}…`}
              className="w-full rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none border transition-colors"
              style={{ borderColor: C.neutral200, backgroundColor: C.white, color: C.neutral900 }}
              onFocus={e => e.target.style.borderColor = C.primary500}
              onBlur={e => e.target.style.borderColor = C.neutral200} />
          </div>
          {activeTab === 'buy' && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl border"
              style={{ backgroundColor: C.primary50, borderColor: C.primary100 }}>
              <CatIcon size={14} style={{ color: C.primary600 }} />
              <span className="text-sm font-semibold whitespace-nowrap" style={{ color: C.primary600 }}>{currentCategory}</span>
            </div>
          )}
        </div>
      )}

      {/* ── BUY TAB ── */}
      {activeTab === 'buy' && (
        loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {[1,2,3,4,5,6].map(i => <SkeletonCard key={i} />)}
          </div>
        ) : buyListings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 rounded-2xl border"
            style={{ backgroundColor: C.white, borderColor: C.neutral100 }}>
            <CatIcon size={42} style={{ color: C.neutral300 }} />
            <p className="text-base font-semibold mt-3" style={{ color: C.neutral500 }}>No {buyCategory} listings yet</p>
            <p className="text-sm mt-1" style={{ color: C.neutral400 }}>Be the first to create a listing!</p>
            <button onClick={() => setCreateCategory(buyCategory)}
              className="mt-4 flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white hover:opacity-90 transition-all"
              style={{ backgroundColor: C.primary500 }}>
              <Plus size={15} /> Create Listing
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {buyListings.map(l => (
              <ListingCard key={l.id} listing={l}
                isOwn={l.user_id === userId}
                onContact={() => setContactItem(l)}
                onDelete={fetchListings} />
            ))}
          </div>
        )
      )}

      {/* ── MY LISTINGS TAB ── */}
      {activeTab === 'sell' && (() => {
        const myListings = listings.filter(l =>
          l.user_id === userId && l.category !== 'Lost' && l.category !== 'Found'
        )
        return (
          <div className="space-y-5">
            {/* Category selector for create */}
            <div className="rounded-2xl p-5 border flex flex-col sm:flex-row items-start sm:items-center gap-4"
              style={{ backgroundColor: C.primary50, borderColor: C.primary100 }}>
              <div className="flex-1">
                <p className="font-bold text-sm" style={{ color: C.neutral900 }}>List something for sale</p>
                <p className="text-xs mt-0.5" style={{ color: C.neutral500 }}>Select a category and create a new listing</p>
              </div>
              <div className="flex gap-2 flex-wrap">
                {BUY_CATEGORIES.map(cat => {
                  const Icon = CATEGORY_ICONS[cat]
                  return (
                    <button key={cat} onClick={() => setCreateCategory(cat)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold border transition-all hover:opacity-90"
                      style={{ backgroundColor: C.white, borderColor: C.primary300, color: C.primary600 }}>
                      <Icon size={14} /> {cat}
                    </button>
                  )
                })}
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {[1,2,3].map(i => <SkeletonCard key={i} />)}
              </div>
            ) : myListings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 rounded-2xl border"
                style={{ backgroundColor: C.white, borderColor: C.neutral100 }}>
                <Plus size={40} style={{ color: C.neutral300 }} />
                <p className="text-base font-semibold mt-3" style={{ color: C.neutral500 }}>No listings yet</p>
                <p className="text-sm mt-1" style={{ color: C.neutral400 }}>Create your first listing above</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {myListings.map(l => (
                  <ListingCard key={l.id} listing={l}
                    isOwn={true}
                    onContact={() => setContactItem(l)}
                    onDelete={fetchListings} />
                ))}
              </div>
            )}
          </div>
        )
      })()}

      {/* ── LOST & FOUND TAB ── */}
      {activeTab === 'lost' && (
        <div className="space-y-5">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl p-4 border text-center" style={{ backgroundColor: C.error50, borderColor: C.error100 }}>
              <p className="text-2xl font-extrabold" style={{ color: C.error500 }}>
                {lostListings.filter(l => l.category === 'Lost').length}
              </p>
              <p className="text-xs font-semibold mt-0.5" style={{ color: C.error700 }}>Animals Lost</p>
            </div>
            <div className="rounded-2xl p-4 border text-center" style={{ backgroundColor: C.success50, borderColor: C.success100 }}>
              <p className="text-2xl font-extrabold" style={{ color: C.success600 }}>
                {lostListings.filter(l => l.category === 'Found').length}
              </p>
              <p className="text-xs font-semibold mt-0.5" style={{ color: C.success600 }}>Animals Found</p>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {[1,2].map(i => <SkeletonCard key={i} />)}
            </div>
          ) : lostListings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 rounded-2xl border"
              style={{ backgroundColor: C.white, borderColor: C.neutral100 }}>
              <AlertTriangle size={40} style={{ color: C.neutral300 }} />
              <p className="text-sm font-medium mt-3" style={{ color: C.neutral500 }}>No reports yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {lostListings.map(item => (
                <LostFoundCard key={item.id} item={item}
                  isOwn={item.user_id === userId}
                  onContact={() => setContactItem(item)}
                  onDelete={fetchListings} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Modals ── */}
      {contactItem && (
        <ContactModal listing={contactItem} onClose={() => setContactItem(null)} />
      )}
      {createCategory && userId && (
        <CreateListingModal
          category={createCategory}
          userId={userId}
          onClose={() => setCreateCategory(null)}
          onCreated={fetchListings}
        />
      )}
    </div>
  )
}
