'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, Upload, X, ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

export default function UploadPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, router, user]);

  if (authLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a]">
        <Loader2 className="h-8 w-8 animate-spin text-[#FF3B5C]" />
      </div>
    );
  }

  const handleFileSelect = (file: File) => {
    // Validate type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Type de fichier non supporté');
      return;
    }

    // Validate size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Fichier trop volumineux (max 5MB)');
      return;
    }

    setImage(file);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!image) {
      toast.error('Sélectionne une image');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('image', image);
      formData.append('description', description);

      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      toast.success('Look publié !');
      router.push('/');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error instanceof Error ? error.message : 'Erreur lors de l\'upload');
    } finally {
      setLoading(false);
    }
  };

  const clearImage = () => {
    setImage(null);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] px-4 py-8">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => router.back()}
            className="p-2 text-[#888] hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
          <h1 className="text-xl font-bold font-[family-name:var(--font-syne)] text-white">
            Nouveau Look
          </h1>
          <div className="w-10" />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Image Upload */}
          <div>
            {preview ? (
              <div className="relative aspect-[3/4] rounded-xl overflow-hidden">
                <Image
                  src={preview}
                  alt="Preview"
                  fill
                  className="object-cover"
                />
                <button
                  type="button"
                  onClick={clearImage}
                  className="absolute top-3 right-3 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            ) : (
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`aspect-[3/4] rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors ${
                  dragOver
                    ? 'border-[#FF3B5C] bg-[#FF3B5C]/10'
                    : 'border-[#2a2a2a] hover:border-[#888]'
                }`}
              >
                <div className="text-[#888] flex flex-col items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-[#141414] flex items-center justify-center">
                    {dragOver ? (
                      <Upload size={32} className="text-[#FF3B5C]" />
                    ) : (
                      <ImageIcon size={32} />
                    )}
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-white">Glisse ta photo ici</p>
                    <p className="text-sm text-[#888] mt-1">ou clique pour sélectionner</p>
                  </div>
                  <p className="text-xs text-[#555]">JPG, PNG, WebP - Max 5MB</p>
                </div>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
              className="hidden"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm text-[#888] font-medium">
              Description <span className="text-[#555]">(optionnel)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              rows={3}
              className="w-full px-4 py-3 bg-[#141414] border border-[#2a2a2a] rounded-xl text-white placeholder-[#555] focus:outline-none focus:border-[#FF3B5C] resize-none font-[family-name:var(--font-space-grotesk)]"
              placeholder="Décris ton look... #streetwear #fashion"
            />
            <p className="text-xs text-[#555] text-right">{description.length}/500</p>
          </div>

          {/* Hashtags Preview */}
          {description.match(/#\w+/g) && (
            <div className="flex flex-wrap gap-2">
              {description.match(/#\w+/g)?.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-[#FF3B5C]/20 text-[#FF3B5C] rounded-full text-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !image}
            className="w-full py-4 bg-[#FF3B5C] text-white font-semibold rounded-xl hover:bg-[#e63552] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-[family-name:var(--font-syne)]"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                Publication...
              </>
            ) : (
              'Publier'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
