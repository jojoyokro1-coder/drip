"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { compressImageFile } from "@/lib/image-compression";
import { Upload, X, Hash, ImagePlus, Loader2, ChevronLeft, PlusCircle, Sparkles, Camera, Images } from "lucide-react";

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

export default function UploadPage() {
  const router = useRouter();
  const { user, session, loading: authLoading } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
  }, []);

  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [hashtagInput, setHashtagInput] = useState("");
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      try { sessionStorage.setItem('drip_login_redirect', '/upload'); } catch { /* ignore */ }
      router.replace("/login");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    const pending = sessionStorage.getItem('drip_pending_upload');
    if (pending) {
      sessionStorage.removeItem('drip_pending_upload');
      sessionStorage.removeItem('drip_pending_upload_type');
      setPreview(pending);
      fetch(pending).then(r => r.blob()).then(blob => {
        const file = new File([blob], 'pending_upload', { type: blob.type });
        setImage(file);
      });
    }
  }, []);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Fichier invalide. Seulement les images sont acceptées.");
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setError("Image trop lourde. La taille maximum est de 10MB.");
      return;
    }

    try {
      const optimizedFile = await compressImageFile(file);
      setImage(optimizedFile);
      setPreview(URL.createObjectURL(optimizedFile));
      setError(null);
    } catch {
      setImage(file);
      setPreview(URL.createObjectURL(file));
      setError(null);
    }
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

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
    if (authLoading || uploading) return;

    if (!user) {
      setError("Connecte-toi pour poster un look.");
      try { sessionStorage.setItem('drip_login_redirect', '/upload'); } catch { /* ignore */ }
      router.push("/login");
      return;
    }

    if (!image) {
      setError("Ajoute une image avant de publier.");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const activeSession =
        session ??
        (await supabase.auth.getSession().then(({ data }) => data.session).catch(() => null));

      if (!activeSession?.access_token) {
        throw new Error("Session invalide. Reconnecte-toi pour publier.");
      }

      const fullDescription =
        description +
        (hashtags.length > 0 ? " " + hashtags.map((h) => `#${h}`).join(" ") : "");

      const formData = new FormData();
      formData.append("image", image);
      formData.append("description", fullDescription);

      const response = await fetch("/api/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${activeSession.access_token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.error || "Erreur lors de l'upload.");
      }

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
        minHeight: "100dvh",
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
          disabled={!image || uploading || authLoading || !user}
          style={{
            background: image && !uploading && !authLoading && user
              ? "linear-gradient(135deg, #FF3B5C, #c0135e)"
              : "rgba(255,255,255,0.08)",
            border: "none",
            borderRadius: "14px",
            padding: "10px 20px",
            minHeight: "44px",
            color: image && !uploading && !authLoading && user ? "#fff" : "rgba(255,255,255,0.3)",
            cursor: image && !uploading && !authLoading && user ? "pointer" : "not-allowed",
            fontFamily: "'Syne', sans-serif",
            fontWeight: 700,
            fontSize: "14px",
            letterSpacing: "0.02em",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            transition: "all 0.2s",
            boxShadow: image && !uploading && !authLoading && user ? "0 0 28px rgba(255,59,92,0.46)" : "none",
            WebkitTapHighlightColor: "transparent",
          }}
        >
          {uploading ? (
            <>
              <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
              Publication…
            </>
          ) : (
            <>
              <PlusCircle size={16} />
              Publier
            </>
          )}
        </button>
      </div>

      <div style={{ padding: "24px 20px", maxWidth: "500px", margin: "0 auto" }}>
        {/* Zone upload */}
        {!preview ? (
          isMobile ? (
            /* ── Mobile : deux boutons natifs ── */
            <div style={{
              border: "2px dashed rgba(255,255,255,0.15)",
              borderRadius: "24px",
              padding: "48px 24px",
              textAlign: "center",
              background: "rgba(255,255,255,0.02)",
              position: "relative", overflow: "hidden",
            }}>
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
                Ajoute ton look
              </p>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "14px", marginBottom: "28px" }}>
                Prends une photo ou choisis depuis ta galerie
              </p>

              {/* Boutons mobile */}
              <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
                <button
                  onClick={() => cameraInputRef.current?.click()}
                  style={{
                    display: "flex", alignItems: "center", gap: "8px",
                    background: "linear-gradient(135deg, #FF3B5C, #c0135e)",
                    border: "none", borderRadius: "14px",
                    padding: "12px 20px",
                    color: "#fff", fontWeight: 700, fontSize: "14px",
                    fontFamily: "'Space Grotesk', sans-serif",
                    cursor: "pointer",
                    boxShadow: "0 4px 20px rgba(255,59,92,0.4)",
                  }}
                >
                  <Camera size={18} />
                  Caméra
                </button>
                <button
                  onClick={() => galleryInputRef.current?.click()}
                  style={{
                    display: "flex", alignItems: "center", gap: "8px",
                    background: "rgba(255,255,255,0.07)",
                    border: "1px solid rgba(255,255,255,0.15)",
                    borderRadius: "14px",
                    padding: "12px 20px",
                    color: "rgba(255,255,255,0.8)", fontWeight: 600, fontSize: "14px",
                    fontFamily: "'Space Grotesk', sans-serif",
                    cursor: "pointer",
                  }}
                >
                  <Images size={18} />
                  Galerie
                </button>
              </div>

              {/* Input caméra (capture) */}
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                style={{ display: "none" }}
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
              {/* Input galerie (pas de capture) */}
              <input
                ref={galleryInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
            </div>
          ) : (
            /* ── Desktop : drag & drop classique ── */
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
                background: isDragging ? "rgba(255,59,92,0.05)" : "rgba(255,255,255,0.02)",
                transition: "all 0.3s",
                position: "relative", overflow: "hidden",
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
          )
        ) : (
          /* Preview */
          <div style={{ position: "relative", borderRadius: "24px", overflow: "hidden", aspectRatio: "3 / 4" }}>
            <Image
              src={preview}
              alt="Preview"
              fill
              sizes="(max-width: 560px) 100vw, 500px"
              unoptimized
              style={{ objectFit: "cover" }}
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

            {isMobile ? (
              /* Mobile : caméra + galerie */
              <div style={{ position: "absolute", bottom: "16px", right: "16px", display: "flex", gap: "8px" }}>
                <button
                  onClick={() => cameraInputRef.current?.click()}
                  style={{
                    background: "rgba(5,5,8,0.85)", border: "1px solid rgba(255,255,255,0.2)",
                    borderRadius: "12px", padding: "8px 12px",
                    color: "#fff", fontSize: "13px", fontWeight: 600,
                    cursor: "pointer", display: "flex", alignItems: "center", gap: "5px",
                  }}
                >
                  <Camera size={13} /> Photo
                </button>
                <button
                  onClick={() => galleryInputRef.current?.click()}
                  style={{
                    background: "rgba(255,59,92,0.9)", border: "none",
                    borderRadius: "12px", padding: "8px 12px",
                    color: "#fff", fontSize: "13px", fontWeight: 600,
                    cursor: "pointer", display: "flex", alignItems: "center", gap: "5px",
                  }}
                >
                  <Images size={13} /> Galerie
                </button>
              </div>
            ) : (
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
            )}

            {/* Inputs cachés réutilisés */}
            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
            <input ref={galleryInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
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
