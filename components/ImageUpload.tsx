import { useState, useRef } from 'react'
import { Upload, X, Image as ImageIcon, Loader } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface ImageUploadProps {
  currentImageUrl: string | null
  productId?: string
  onImageUploaded: (url: string) => void
}

export default function ImageUpload({ currentImageUrl, productId, onImageUploaded }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(currentImageUrl)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validierung
    if (!file.type.startsWith('image/')) {
      setError('Bitte nur Bilddateien hochladen!')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Bild zu groß! Maximal 5MB erlaubt.')
      return
    }

    setError(null)
    setUploading(true)

    try {
      // Preview erstellen
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(file)

      // Dateiname generieren
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `products/${fileName}`

      // Upload zu Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        throw uploadError
      }

      // Public URL generieren
      const { data: urlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath)

      const publicUrl = urlData.publicUrl
      
      // URL an Parent-Component übergeben
      onImageUploaded(publicUrl)
      setPreview(publicUrl)
      
    } catch (err) {
      console.error('Upload error:', err)
      setError('Upload fehlgeschlagen. Bitte erneut versuchen.')
      setPreview(currentImageUrl)
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = async () => {
    // Optional: Bild aus Supabase Storage löschen
    if (currentImageUrl && currentImageUrl.includes('supabase')) {
      try {
        const urlParts = currentImageUrl.split('/product-images/')
        if (urlParts.length > 1) {
          const filePath = urlParts[1]
          await supabase.storage.from('product-images').remove([filePath])
        }
      } catch (err) {
        console.error('Error deleting image:', err)
      }
    }

    setPreview(null)
    onImageUploaded('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div>
      <label className="block text-xs font-bold mb-2" style={{ color: '#8da399' }}>
        📷 PRODUKTBILD
      </label>

      <div className="space-y-3">
        {preview ? (
          <div className="relative group">
            <div className="relative w-full h-64 rounded-xl overflow-hidden border-2" 
              style={{ borderColor: '#e5e7eb' }}>
              <img
                src={preview}
                alt="Produkt Vorschau"
                className="w-full h-full object-cover"
              />
              
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handleClick}
                  disabled={uploading}
                  className="opacity-0 group-hover:opacity-100 transition-all px-4 py-2 rounded-lg bg-white text-gray-800 font-semibold flex items-center gap-2 hover:bg-gray-100"
                >
                  <Upload size={16} />
                  Ersetzen
                </button>
                <button
                  type="button"
                  onClick={handleRemove}
                  disabled={uploading}
                  className="opacity-0 group-hover:opacity-100 transition-all px-4 py-2 rounded-lg bg-red-500 text-white font-semibold flex items-center gap-2 hover:bg-red-600"
                >
                  <X size={16} />
                  Entfernen
                </button>
              </div>

              {uploading && (
                <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
                  <div className="text-center text-white">
                    <Loader size={40} className="animate-spin mx-auto mb-2" />
                    <div className="font-semibold">Wird hochgeladen...</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleClick}
            disabled={uploading}
            className="w-full h-64 rounded-xl border-2 border-dashed transition-all hover:border-opacity-100 flex flex-col items-center justify-center gap-3"
            style={{ 
              borderColor: '#4a5d54',
              backgroundColor: '#f9f8f4'
            }}
          >
            {uploading ? (
              <>
                <Loader size={48} className="animate-spin" style={{ color: '#4a5d54' }} />
                <div className="font-semibold" style={{ color: '#4a5d54' }}>
                  Wird hochgeladen...
                </div>
              </>
            ) : (
              <>
                <ImageIcon size={48} style={{ color: '#8da399' }} />
                <div className="font-bold text-lg" style={{ color: '#4a5d54' }}>
                  Produktbild hochladen
                </div>
                <div className="text-sm text-gray-400">
                  JPG, PNG oder WEBP • Max. 5MB
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  Klicken zum Auswählen
                </div>
              </>
            )}
          </button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileSelect}
          className="hidden"
        />

        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            ⚠️ {error}
          </div>
        )}

        <div className="text-xs text-gray-400 space-y-1">
          <div>💡 Tipp: Quadratische Bilder (1:1) funktionieren am besten</div>
          <div>📱 Optimale Größe: 800x800 Pixel</div>
          {!preview && (
            <div>🍦 Ohne Bild wird das Emoji-Icon verwendet</div>
          )}
        </div>
      </div>
    </div>
  )
}