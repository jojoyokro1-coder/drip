"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ChevronLeft, Camera, Loader2, Check, AlertCircle, User, FileText } from "lucide-react";

export default function EditProfilePage() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("username, bio, avatar_url")
        .eq("id", user.id)
        .single();
      if (data) {
        setUsername(data.username || "");
        setBio(data.bio || "");
        setAvatarUrl(data.avatar_url);
      }
      setLoading(false);
    };
    fetchProfile();
  }, [user]);

  const handleAvatarChange = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      let finalAvatarUrl = avatarUrl;

      if (avatarFile) {
        const ext = avatarFile.name.split(".").pop();
        const fileName = `${user.id}/avatar.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(fileName, avatarFile, { upsert: true });
        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(fileName);
        finalAvatarUrl = urlData.publicUrl + `?t=${Date.now()}`;
      }

      // Vérifier unicité du username
      if (username) {
        const { data: existing } = await supabase
          .from("profiles")
          .select("id")
          .eq("username", username)
          .neq("id", user.id)
          .single();
        if (existing) throw new Error("Ce nom d'utilisateur est déjà pris.");
      }

      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          username: username.trim(),
          bio: bio.trim(),
          avatar_url: finalAvatarUrl,
        })
        .eq("id", user.id);

      if (updateError) throw updateError;

      setSuccess(true);
      setTimeout(() => {
        if (username) router.push(`/profile/${username}`);
      }, 1200);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur lors de la mise à jour.");
    } finally {
      setSaving(false);
    }
  };

  const currentAvatar = avatarPreview || avatarUrl;

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh", background: "#050508",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Loader2 size={32} color="#FF3B5C" style={{ animation: "spin 1s linear infinite" }} />
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "#050508",
      color: "#fff",
      fontFamily: "'Space Grotesk', sans-serif",
      paddingBottom: "100px",
    }}>
      {/* Header */}
      <div style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(5,5,8,0.85)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        padding: "16px 20px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <button
          onClick={() => router.back()}
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "12px", padding: "8px 14px",
            color: "rgba(255,255,255,0.7)", cursor: "pointer",
            display: "flex", alignItems: "center", gap: "6px", fontSize: "14px",
          }}
        >
          <ChevronLeft size={16} /> Retour
        </button>

        <h1 style={{
          fontFamily: "'Syne', sans-serif",
          fontWeight: 800, fontSize: "18px", letterSpacing: "-0.5px",
        }}>
          Modifier le profil
        </h1>

        <button
          onClick={handleSave}
          disabled={saving || success}
          style={{
            background: success
              ? "linear-gradient(135deg, #22c55e, #16a34a)"
              : "linear-gradient(135deg, #FF3B5C, #ff6b84)",
            border: "none", borderRadius: "12px",
            padding: "8px 18px",
            color: "#fff", fontWeight: 700, fontSize: "14px",
            cursor: saving ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", gap: "6px",
            transition: "all 0.3s",
            boxShadow: success
              ? "0 4px 20px rgba(34,197,94,0.4)"
              : "0 4px 20px rgba(255,59,92,0.4)",
          }}
        >
          {saving ? (
            <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
          ) : success ? (
            <Check size={14} />
          ) : null}
          {saving ? "Sauvegarde…" : success ? "Sauvegardé !" : "Sauvegarder"}
        </button>
      </div>

      <div style={{ padding: "32px 20px", maxWidth: "500px", margin: "0 auto" }}>

        {/* Avatar */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "40px" }}>
          <div style={{ position: "relative" }}>
            {/* Glow */}
            <div style={{
              position: "absolute", inset: "-4px",
              background: "linear-gradient(135deg, #FF3B5C, #7c3aed)",
              borderRadius: "50%", filter: "blur(8px)", opacity: 0.5,
            }} />

            <div style={{
              position: "relative",
              width: "100px", height: "100px",
              borderRadius: "50%",
              border: "2px solid rgba(255,255,255,0.1)",
              overflow: "hidden",
              background: "rgba(255,255,255,0.05)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {currentAvatar ? (
                <img src={currentAvatar} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <User size={40} color="rgba(255,255,255,0.3)" />
              )}
            </div>

            <button
              onClick={() => avatarInputRef.current?.click()}
              style={{
                position: "absolute", bottom: "0", right: "0",
                width: "32px", height: "32px",
                background: "linear-gradient(135deg, #FF3B5C, #ff6b84)",
                border: "2px solid #050508",
                borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(255,59,92,0.5)",
              }}
            >
              <Camera size={14} color="#fff" />
            </button>

            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => e.target.files?.[0] && handleAvatarChange(e.target.files[0])}
            />
          </div>

          <p style={{ marginTop: "14px", fontSize: "13px", color: "rgba(255,255,255,0.4)" }}>
            Clique sur l'icône pour changer ta photo
          </p>
        </div>

        {/* Champs */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

          {/* Username */}
          <div>
            <label style={{
              display: "flex", alignItems: "center", gap: "8px",
              fontSize: "13px", fontWeight: 600,
              color: "rgba(255,255,255,0.5)",
              marginBottom: "10px",
              textTransform: "uppercase", letterSpacing: "1px",
            }}>
              <User size={13} />
              Nom d'utilisateur
            </label>
            <div style={{ position: "relative" }}>
              <span style={{
                position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)",
                color: "rgba(255,255,255,0.3)", fontSize: "15px", fontWeight: 600,
              }}>
                @
              </span>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ""))}
                placeholder="ton_username"
                maxLength={30}
                style={{
                  width: "100%", background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "16px", padding: "14px 16px 14px 34px",
                  color: "#fff", fontSize: "15px",
                  fontFamily: "'Space Grotesk', sans-serif",
                  outline: "none", boxSizing: "border-box",
                  transition: "border-color 0.2s",
                }}
                onFocus={(e) => e.target.style.borderColor = "rgba(255,59,92,0.5)"}
                onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
              />
            </div>
            <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.3)", marginTop: "6px" }}>
              Lettres minuscules, chiffres, . et _ uniquement
            </p>
          </div>

          {/* Bio */}
          <div>
            <label style={{
              display: "flex", alignItems: "center", gap: "8px",
              fontSize: "13px", fontWeight: 600,
              color: "rgba(255,255,255,0.5)",
              marginBottom: "10px",
              textTransform: "uppercase", letterSpacing: "1px",
            }}>
              <FileText size={13} />
              Bio
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Dis-nous qui tu es, ton style, tes influences…"
              maxLength={150}
              rows={4}
              style={{
                width: "100%", background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "16px", padding: "14px 16px",
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
              color: bio.length > 120 ? "#FFC107" : "rgba(255,255,255,0.3)",
              marginTop: "6px",
            }}>
              {bio.length}/150
            </div>
          </div>
        </div>

        {/* Message erreur */}
        {error && (
          <div style={{
            marginTop: "20px",
            background: "rgba(255,59,92,0.1)",
            border: "1px solid rgba(255,59,92,0.3)",
            borderRadius: "12px", padding: "14px 16px",
            color: "#FF3B5C", fontSize: "14px",
            display: "flex", alignItems: "center", gap: "10px",
          }}>
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {/* Danger zone */}
        <div style={{
          marginTop: "48px",
          padding: "20px",
          background: "rgba(255,59,92,0.04)",
          border: "1px solid rgba(255,59,92,0.15)",
          borderRadius: "16px",
        }}>
          <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "15px", color: "#FF3B5C", marginBottom: "8px" }}>
            Zone de danger
          </h3>
          <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.4)", marginBottom: "16px" }}>
            Ces actions sont irréversibles. Réfléchis bien.
          </p>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button
              onClick={async () => {
                await signOut();
                router.push("/login");
              }}
              style={{
                background: "linear-gradient(135deg, #FF3B5C, #c0135e)",
                border: "none",
                borderRadius: "10px",
                padding: "10px 16px",
                color: "#fff",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: 600,
                boxShadow: "0 4px 12px rgba(255,59,92,0.3)",
              }}
            >
              Se déconnecter
            </button>
            <button
              onClick={async () => {
                if (confirm("Supprimer ton compte ? Cette action est définitive.")) {
                  await supabase.auth.signOut();
                  router.push("/login");
                }
              }}
              style={{
                background: "transparent",
                border: "1px solid rgba(255,59,92,0.3)",
                borderRadius: "10px",
                padding: "10px 16px",
                color: "#FF3B5C",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: 600,
              }}
            >
              Supprimer mon compte
            </button>
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
