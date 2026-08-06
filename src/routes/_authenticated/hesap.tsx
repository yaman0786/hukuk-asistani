import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, RoundedBox, Text } from "@react-three/drei";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/hooks/useSubscription";
import { toast } from "sonner";
import { openCustomerPortal } from "@/lib/subscription.functions";
import { exportMyData, deleteMyAccount } from "@/lib/threads.functions";
import { useServerFn } from "@tanstack/react-start";

export const Route = createFileRoute("/_authenticated/hesap")({
  head: () => ({
    meta: [
      { title: "Hesabım — Hukuk Asistanı" },
      { name: "description", content: "Abonelik, fatura, veri ve hesap yönetimi." },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AccountPage,
});

function AccountPage() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | undefined>();
  const [email, setEmail] = useState<string | undefined>();
  const { sub, tier, loading } = useSubscription(userId);
  const portalFn = useServerFn(openCustomerPortal);
  const exportFn = useServerFn(exportMyData);
  const deleteAccountFn = useServerFn(deleteMyAccount);
  const [portalLoading, setPortalLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id);
      setEmail(data.user?.email ?? undefined);
    });
    const url = new URL(window.location.href);
    if (url.searchParams.get("checkout") === "success") {
      toast.success("Ödeme alındı — aboneliğiniz birkaç saniye içinde etkinleşecek.");
    }
  }, []);

  async function handlePortal() {
    setPortalLoading(true);
    try {
      const res = await portalFn();
      if (res.url) window.open(res.url, "_blank");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setPortalLoading(false);
    }
  }

  async function handleExport() {
    setExporting(true);
    try {
      const data = await exportFn();
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `hukuk-master-ai-veri-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("Verileriniz indirildi.");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setExporting(false);
    }
  }

  async function handleDeleteAccount() {
    const confirmText = window.prompt(
      'Hesabınızı ve tüm verilerinizi kalıcı olarak silmek üzeresiniz. Onaylamak için "SİL" yazın.',
    );
    if (confirmText !== "SİL") {
      toast.error("İşlem iptal edildi.");
      return;
    }
    setDeleting(true);
    try {
      await deleteAccountFn();
      await supabase.auth.signOut();
      toast.success("Hesabınız silindi.");
      navigate({ to: "/" });
    } catch (e) {
      toast.error((e as Error).message);
      setDeleting(false);
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  }

  return (
    <Canvas frameloop="demand" dpr={[0.75, 1.25]} camera={{ position: [0, 0.4, 9], fov: 42 }} gl={{ antialias: false, powerPreference: "low-power", alpha: true }}>
      <AccountMeshScene email={email ?? "Yükleniyor…"} tier={loading ? "Yükleniyor…" : tier} status={sub?.status ?? "Aktif"} onSignOut={handleSignOut} onPortal={handlePortal} onPlans={() => navigate({ to: "/fiyatlar" })} onExport={handleExport} onDelete={handleDeleteAccount} portalLoading={portalLoading} exporting={exporting} deleting={deleting} />
      <OrbitControls enablePan={false} enableZoom={false} enableDamping dampingFactor={0.08} />
    </Canvas>
  );
}

function AccountMeshScene(props: { email: string; tier: string; status: string; onSignOut: () => void; onPortal: () => void; onPlans: () => void; onExport: () => void; onDelete: () => void; portalLoading: boolean; exporting: boolean; deleting: boolean }) {
  const { invalidate } = useThree();
  const button = (label: string, position: [number, number, number], onClick: () => void, disabled = false, accent = "#2d6cff") => (
    <group position={position} onPointerDown={(event) => { event.stopPropagation(); if (!disabled) onClick(); invalidate(); }}>
      <RoundedBox args={[2.1, 0.42, 0.12]} radius={0.07} smoothness={2}><meshStandardMaterial color={disabled ? "#1e293b" : "#10295a"} emissive={accent} emissiveIntensity={disabled ? 0.05 : 0.3} metalness={0.65} roughness={0.22} /></RoundedBox>
      <Text position={[0, 0, 0.08]} fontSize={0.12} color={disabled ? "#70809b" : "#f8fafc"} anchorX="center" anchorY="middle">{label}</Text>
    </group>
  );
  const card = (title: string, lines: string[], position: [number, number, number], actions: ReactNode) => (
    <group position={position}>
      <RoundedBox args={[3.7, 2.25, 0.16]} radius={0.12} smoothness={3}><meshStandardMaterial color="#0b1830" emissive="#102b5c" emissiveIntensity={0.16} metalness={0.65} roughness={0.25} /></RoundedBox>
      <Text position={[-1.55, 0.83, 0.11]} fontSize={0.18} color="#e9c46a" anchorX="left" anchorY="middle">{title}</Text>
      {lines.map((line, index) => <Text key={line} position={[-1.55, 0.42 - index * 0.3, 0.11]} fontSize={0.13} color={index === 0 ? "#f8fafc" : "#9fb0cb"} anchorX="left" anchorY="middle" maxWidth={3.05}>{line}</Text>)}
      {actions}
    </group>
  );
  return <>
    <color attach="background" args={["#050b18"]} />
    <ambientLight intensity={0.55} /><pointLight position={[0, 4, 4]} intensity={14} color="#d8b455" /><pointLight position={[-5, 1, 3]} intensity={8} color="#315dff" />
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.3, 0]}><planeGeometry args={[16, 16]} /><meshStandardMaterial color="#071021" metalness={0.7} roughness={0.32} /></mesh>
    <gridHelper args={[14, 28, "#1b3a68", "#0d1e3b"]} position={[0, -1.28, 0]} />
    <Text position={[0, 3.15, 0]} fontSize={0.38} color="#f8fafc" anchorX="center" anchorY="middle">HESAP MERKEZİ</Text>
    <Text position={[0, 2.72, 0]} fontSize={0.14} color="#a9b4ca" anchorX="center" anchorY="middle">Güvenli hesap, abonelik ve veri kontrolü</Text>
    {card("PROFİL", ["E-posta", props.email], [-2.05, 1.0, 0], button("ÇIKIŞ YAP", [0, -0.72, 0.12], props.onSignOut))}
    {card("ABONELİK", ["Mevcut plan", props.tier, `Durum: ${props.status}`], [2.05, 1.0, 0], <group position={[0, -0.72, 0.12]}>{props.tier === "free" ? button("PLANLARI GÖR", [0, 0, 0], props.onPlans) : <>{button("PLAN DEĞİŞTİR", [-1.1, 0, 0], props.onPlans)}{button(props.portalLoading ? "AÇILIYOR" : "ÖDEME YÖNETİMİ", [1.1, 0, 0], props.onPortal, props.portalLoading)}</>}</group>)}
    {card("VERİLERİM", ["KVKK haklarınız", "Verilerinizi indirin veya hesabınızı kalıcı olarak yönetin."], [0, -1.55, 0], <group position={[0, -0.72, 0.12]}>{button(props.exporting ? "HAZIRLANIYOR" : "VERİLERİ İNDİR", [-1.1, 0, 0], props.onExport, props.exporting, "#34d399")}{button(props.deleting ? "SİLİNİYOR" : "HESABI SİL", [1.1, 0, 0], props.onDelete, props.deleting, "#ef4444")}</group>)}
  </>;
}
