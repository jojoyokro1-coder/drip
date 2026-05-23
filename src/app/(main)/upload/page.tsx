"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Upload, X, Hash, ImagePlus, Loader2, ChevronLeft, Sparkles } from "lucide-react";

export default function UploadPage() {
  const router = useRouter();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [hashtagInput, setHashtagInput] = useState("");
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Fichier invalide. Seulement les images sont acceptées.");
      return;
    }
    setImage(file);
    setPreview(URL.createObjectURL(file));
    setError(null);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, []);

  const addHashtag = () => {
    const tag = hashtagInput.trim().replace(/^#/, "").toLowerCase();
    if (tag && !hashtags.includes(tag) && hashtags.length < 10) {
      setHashtags([...hashtags, tag]);
      setHashtagInput("");
    }
  };

  const removeHashtag = (tag: string) => {
    setHashtags(hashtags.filter((h) => h !== tag));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " " || e.key === ",") {
      e.preventDefault();
      addHashtag();
    }
  };

  const handleSubmit = async () => {
    if (!image || !user) return;
    setUploading(true);
    setError(null);

    try {
      const ext = image.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}.${ext}`;

      const { error: storageError } = await supabase.storage
        .from("looks")
        .upload(fileName, image, { cacheControl: "3600", upsert: false });

      if (storageError) throw storageError;

      const { data: urlData } = supabase.storage.from("looks").getPublicUrl(fileName);

      const fullDescription =
        description +
        (hashtags.length > 0 ? " " + hashtags.map((h) => `#${h}`).join(" ") : "");

      const { error: insertError } = await supabase.from("looks").insert({
        user_id: user.id,
        image_url: urlData.publicUrl,
        description: fullDescription,
        likes_count: 0,
      });

      if (insertError) throw insertError;

      router.push("/");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'upload.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#050508",
        color: "#fff",
        fontFamily: "'Space Grotesk', sans-serif",
        paddingBottom: "100px",
      }}
    >
      {/* Header */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: "rgba(5,5,8,0.85)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          padding: "16px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <button
          onClick={() => router.back()}
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "12px",
            padding: "8px 14px",
            color: "rgba(255,255,255,0.7)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "14px",
          }}
        >
          <ChevronLeft size={16} />
          Retour
        </button>

        <h1
          style={{
            fontFamily: "'Syne', sans-serif",
            fontWeight: 800,
            fontSize: "18px",
            letterSpacing: "-0.5px",
          }}
        >
          Poster un look
        </h1>

        <button
          onClick={handleSubmit}
          disabled={!image || uploading}
          style={{
            background: image && !uploading
              ? "linear-gradient(135deg, #FF3B5C, #ff6b84)"
              : "rgba(255,255,255,0.08)",
            border: "none",
            borderRadius: "12px",
            padding: "8px 18px",
            color: image && !uploading ? "#fff" : "rgba(255,255,255,0.3)",
            cursor: image && !uploading ? "pointer" : "not-allowed",
            fontWeight: 700,
            fontSize: "14px",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            transition: "all 0.2s",
            boxShadow: image && !uploading ? "0 4px 20px rgba(255,59,92,0.4)" : "none",
          }}
        >
          {uploading ? (
            <>
              <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
              Upload…
            </>
          ) : (
            <>
              <Sparkles size={14} />
              Publier
            </>
          )}
        </button>
      </div>

      <div style={{ padding: "24px 20px", maxWidth: "500px", margin: "0 auto" }}>
        {/* Zone de drop image */}
        {!preview ? (
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: `2px dashed ${isDragging ? "#FF3B5C" : "rgba(255,255,255,0.15)"}`,
              borderRadius: "24px",
              padding: "60px 24px",
              textAlign: "center",
              cursor: "pointer",
              background: isDragging
                ? "rgba(255,59,92,0.05)"
                : "rgba(255,255,255,0.02)",
              transition: "all 0.3s",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Grille décorative */}
            <div style={{
              position: "absolute", inset: 0, opacity: 0.03,
              backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }} />

            <div style={{
              width: "72px", height: "72px",
              background: "linear-gradient(135deg, rgba(255,59,92,0.2), rgba(255,59,92,0.05))",
              borderRadius: "20px",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 20px",
              border: "1px solid rgba(255,59,92,0.3)",
            }}>
              <ImagePlus size={32} color="#FF3B5C" />
            </div>

            <p style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "18px", marginBottom: "8px" }}>
              Glisse ton look ici
            </p>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "14px", marginBottom: "20px" }}>
              ou clique pour choisir un fichier
            </p>
            <span style={{
              background: "rgba(255,59,92,0.15)",
              border: "1px solid rgba(255,59,92,0.3)",
              borderRadius: "8px",
              padding: "4px 12px",
              fontSize: "12px",
              color: "#FF3B5C",
              fontWeight: 600,
            }}>
              JPG, PNG, WEBP — max 10MB
            </span>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
          </div>
        ) : (
          /* Preview */
          <div style={{ position: "relative", borderRadius: "24px", overflow: "hidden" }}>
            <img
              src={preview}
              alt="Preview"
              style={{ width: "100%", aspectRatio: "3/4", objectFit: "cover", display: "block" }}
            />
            <div style={{
              position: "absolute", inset: 0,
              background: "linear-gradient(to top, rgba(5,5,8,0.8) 0%, transparent 50%)",
            }} />
            <button
              onClick={() => { setImage(null); setPreview(null); }}
              style={{
                position: "absolute", top: "12px", right: "12px",
                background: "rgba(5,5,8,0.8)",
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: "50%",
                width: "36px", height: "36px",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", color: "#fff",
              }}
            >
              <X size={16} />
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                position: "absolute", bottom: "16px", right: "16px",
                background: "rgba(255,59,92,0.9)",
                border: "none", borderRadius: "12px",
                padding: "8px 14px",
                color: "#fff", fontSize: "13px", fontWeight: 600,
                cursor: "pointer", display: "flex", alignItems: "center", gap: "6px",
              }}
            >
              <Upload size={13} /> Changer
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
          </div>
        )}

        {/* Description */}
        <div style={{ marginTop: "24px" }}>
          <label style={{
            display: "block", fontSize: "13px", fontWeight: 600,
            color: "rgba(255,255,255,0.5)", marginBottom: "10px",
            textTransform: "uppercase", letterSpacing: "1px",
          }}>
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Décris ton look, l'occasion, les pièces clés…"
            maxLength={300}
            rows={4}
            style={{
              width: "100%", background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "16px", padding: "16px",
              color: "#fff", fontSize: "15px",
              fontFamily: "'Space Grotesk', sans-serif",
              resize: "none", outline: "none",
              boxSizing: "border-box",
              transition: "border-color 0.2s",
            }}
            onFocus={(e) => e.target.style.borderColor = "rgba(255,59,92,0.5)"}
            onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
          />
          <div style={{
            textAlign: "right", fontSize: "12px",
            color: description.length > 250 ? "#FFC107" : "rgba(255,255,255,0.3)",
            marginTop: "6px",
          }}>
            {description.length}/300
          </div>
        </div>

        {/* Hashtags */}
        <div style={{ marginTop: "20px" }}>
          <label style={{
            display: "block", fontSize: "13px", fontWeight: 600,
            color: "rgba(255,255,255,0.5)", marginBottom: "10px",
            textTransform: "uppercase", letterSpacing: "1px",
          }}>
            Hashtags
          </label>

          {/* Tags existants */}
          {hashtags.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "12px" }}>
              {hashtags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    background: "rgba(255,59,92,0.12)",
                    border: "1px solid rgba(255,59,92,0.3)",
                    borderRadius: "20px",
                    padding: "4px 12px",
                    fontSize: "13px", color: "#FF3B5C",
                    display: "flex", alignItems: "center", gap: "6px",
                    fontWeight: 600,
                  }}
                >
                  #{tag}
                  <button
                    onClick={() => removeHashtag(tag)}
                    style={{
                      background: "none", border: "none",
                      color: "rgba(255,59,92,0.6)",
                      cursor: "pointer", padding: "0",
                      display: "flex", alignItems: "center",
                    }}
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          )}

          <div style={{ display: "flex", gap: "10px" }}>
            <div style={{ position: "relative", flex: 1 }}>
              <Hash
                size={16}
                color="rgba(255,255,255,0.3)"
                style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }}
              />
              <input
                value={hashtagInput}
                onChange={(e) => setHashtagInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="streetwear, paris, vintage…"
                disabled={hashtags.length >= 10}
                style={{
                  width: "100%", background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "12px", padding: "12px 14px 12px 38px",
                  color: "#fff", fontSize: "14px",
                  fontFamily: "'Space Grotesk', sans-serif",
                  outline: "none", boxSizing: "border-box",
                }}
                onFocus={(e) => e.target.style.borderColor = "rgba(255,59,92,0.5)"}
                onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
              />
            </div>
            <button
              onClick={addHashtag}
              disabled={!hashtagInput.trim() || hashtags.length >= 10}
              style={{
                background: "rgba(255,59,92,0.15)",
                border: "1px solid rgba(255,59,92,0.3)",
                borderRadius: "12px",
                padding: "12px 16px",
                color: "#FF3B5C",
                cursor: "pointer",
                fontWeight: 700,
                fontSize: "14px",
                whiteSpace: "nowrap",
              }}
            >
              Ajouter
            </button>
          </div>
          <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.3)", marginTop: "8px" }}>
            {hashtags.length}/10 — Appuie sur Entrée pour ajouter
          </p>
        </div>

        {/* Erreur */}
        {error && (
          <div style={{
            marginTop: "20px",
            background: "rgba(255,59,92,0.1)",
            border: "1px solid rgba(255,59,92,0.3)",
            borderRadius: "12px",
            padding: "14px 16px",
            color: "#FF3B5C",
            fontSize: "14px",
          }}>
            {error}
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
