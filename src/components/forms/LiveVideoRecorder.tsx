"use client";

import { useEffect, useRef, useState } from "react";
import { uploadWithTicket } from "@/lib/image-upload";
import type { SurplusVideoMeta, VideoCapture } from "@/lib/forms/p0";

type Token = { id: string; code: string; expiresAt?: string };

function isMobileDevice() {
  const ua = navigator as Navigator & { userAgentData?: { mobile?: boolean } };
  return ua.userAgentData?.mobile === true || (window.matchMedia("(pointer: coarse)").matches && window.innerWidth < 900);
}

async function sha256(blob: Blob) {
  const digest = await crypto.subtle.digest("SHA-256", await blob.arrayBuffer());
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function LiveVideoRecorder({
  onChange,
  error,
}: {
  onChange: (value: { url: string; meta: SurplusVideoMeta } | null) => void;
  error?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [mobile, setMobile] = useState(false);
  const [token, setToken] = useState<Token | null>(null);
  const [tokenError, setTokenError] = useState("");
  const [phase, setPhase] = useState<"idle" | "live" | "preview" | "uploading" | "done">("idle");
  const [seconds, setSeconds] = useState(0);
  const [message, setMessage] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const chunks = useRef<Blob[]>([]);
  const started = useRef(0);
  const source = useRef<VideoCapture>("live_camera");

  useEffect(() => {
    setMobile(isMobileDevice());
  }, []);

  useEffect(() => {
    return () => {
      stream.current?.getTracks().forEach((track) => track.stop());
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  async function loadToken() {
    setTokenError("");
    const res = await fetch("/api/media/video-token", { method: "POST" });
    const data = (await res.json().catch(() => null)) as { ok?: boolean; id?: string; code?: string; error?: string } | null;
    if (!res.ok || !data?.id || !data.code) {
      setTokenError(data?.error || "Tekshiruv kodi olinmadi.");
      return null;
    }
    const next = { id: data.id, code: data.code };
    setToken(next);
    return next;
  }

  function stopTracks() {
    stream.current?.getTracks().forEach((track) => track.stop());
    stream.current = null;
  }

  async function startLive() {
    const next = token ?? (await loadToken());
    if (!next) return;
    setMessage("");
    try {
      const media = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true,
      });
      stream.current = media;
      if (videoRef.current) {
        videoRef.current.srcObject = media;
        videoRef.current.muted = true;
        await videoRef.current.play();
      }
      const mime = ["video/mp4", "video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"].find((item) => MediaRecorder.isTypeSupported(item));
      if (!mime) {
        stopTracks();
        setMessage("Bu brauzer jonli yozuvni qo‘llamaydi. Pastdagi kamera tugmasini bosing.");
        return;
      }
      const rec = new MediaRecorder(media, { mimeType: mime, videoBitsPerSecond: 2_500_000 });
      chunks.current = [];
      rec.ondataavailable = (event) => {
        if (event.data.size) chunks.current.push(event.data);
      };
      rec.onstop = () => finish(new Blob(chunks.current, { type: mime }), "live_camera", next);
      recorder.current = rec;
      started.current = Date.now();
      source.current = "live_camera";
      rec.start(1000);
      setPhase("live");
      setSeconds(0);
    } catch {
      setMessage("Kameraga ruxsat bering — videoni jonli yozish kerak. Sozlamalar → Kamera → Ruxsat berish.");
    }
  }

  useEffect(() => {
    if (phase !== "live") return;
    const timer = window.setInterval(() => {
      const elapsed = Date.now() - started.current;
      setSeconds(Math.floor(elapsed / 1000));
      if (elapsed >= 60_000) recorder.current?.stop();
    }, 250);
    return () => window.clearInterval(timer);
  }, [phase]);

  async function finish(blob: Blob, captureSource: VideoCapture, used: Token) {
    stopTracks();
    const durationMs = captureSource === "desktop_file" ? 0 : Date.now() - started.current;
    const measured = captureSource === "desktop_file" ? await probeDuration(blob) : durationMs;
    if (measured < 15_000) {
      setPhase("idle");
      setMessage("Video juda qisqa. Muddat va LOT’ni yaqindan ko‘rsatishga ulguring — kamida 15 soniya.");
      return;
    }
    if (measured > 60_000 || blob.size > 50 * 1024 * 1024) {
      setPhase("idle");
      setMessage("Video 15–60 soniya va 50 MB dan oshmasin.");
      return;
    }
    const url = URL.createObjectURL(blob);
    setPreviewUrl(url);
    setPhase("preview");
    setMessage("");
    (blob as Blob & { durationMs?: number }).durationMs = measured;
    pending.current = { blob, captureSource, token: used, durationMs: measured };
  }

  const pending = useRef<{ blob: Blob; captureSource: VideoCapture; token: Token; durationMs: number } | null>(null);

  async function accept() {
    const item = pending.current;
    if (!item) return;
    setPhase("uploading");
    try {
      const type = item.blob.type || "video/webm";
      const file = new File([item.blob], `surplus.${type.includes("mp4") ? "mp4" : "webm"}`, { type });
      const url = await uploadWithTicket("/api/uploads", { purpose: "listing" }, file);
      const hash = await sha256(item.blob);
      const meta: SurplusVideoMeta = {
        tokenId: item.token.id,
        code: item.token.code,
        captureSource: item.captureSource,
        durationMs: item.durationMs,
        sizeBytes: item.blob.size,
        sha256: hash,
        mobile,
      };
      const res = await fetch("/api/media/video-complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...meta, videoUrl: url }),
      });
      const data = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
      if (!res.ok || !data?.ok) {
        setPhase("preview");
        setMessage(data?.error || "Video tasdiqlanmadi.");
        return;
      }
      onChange({ url, meta });
      setPhase("done");
      setMessage(item.captureSource === "desktop_file" ? "Fayl yuklandi. U qo‘lda tekshiriladi, «Jonli video» belgisi berilmaydi." : "Video qabul qilindi. Moderator muddat va LOT’ni solishtiradi.");
    } catch (error) {
      setPhase("preview");
      setMessage(error instanceof Error ? error.message : "Video yuklanmadi.");
    }
  }

  async function onFile(file: File | null, captureSource: VideoCapture) {
    if (!file) return;
    if (mobile && captureSource === "desktop_file") {
      setMessage("Telefonda galereyadan video tanlab bo‘lmaydi. Jonli kamerani oching.");
      return;
    }
    const next = token ?? (await loadToken());
    if (!next) return;
    source.current = captureSource;
    started.current = file.lastModified;
    await finish(file, captureSource, next);
  }

  return (
    <div className="space-y-2" data-testid="surplus-video">
      <p className="text-[12.5px] leading-snug text-[#6b7280]">Videoda mahsulot, yaroqlilik muddati, LOT va qadoq butunligi ko‘rinsin. Kodni aytib yoki ekranga tutib yozing.</p>
      {token ? <p className="text-[22px] font-black tracking-wide text-[#0F766E]" data-testid="surplus-video-code">Tekshiruv kodi #{token.code}</p> : null}
      {tokenError ? <p className="text-[13px] font-medium text-[#9a3412]">{tokenError}</p> : null}
      {phase === "live" ? (
        <div className="relative overflow-hidden rounded-2xl bg-black">
          <video ref={videoRef} className="aspect-[4/3] w-full object-cover" playsInline muted autoPlay />
          <div className="absolute inset-x-0 top-0 flex items-center justify-between bg-black/50 px-3 py-2 text-[13px] text-white">
            <b>{seconds}s / 60s</b>
            {token ? <b>#{token.code}</b> : null}
            <span>Umumiy → Muddat → LOT → Qadoq</span>
          </div>
          <button type="button" className="absolute inset-x-4 bottom-4 h-12 rounded-full bg-[#dc2626] text-[15px] font-bold text-white disabled:opacity-60" onClick={() => recorder.current?.stop()} disabled={seconds < 15}>
            {seconds < 15 ? "Kamida 15 s" : "To‘xtatish"}
          </button>
        </div>
      ) : null}
      {previewUrl && phase !== "live" ? <video className="aspect-[4/3] w-full rounded-2xl bg-black" src={previewUrl} controls playsInline /> : null}
      <div className="flex flex-wrap gap-2">
        {phase !== "live" ? (
          <button type="button" className="h-12 rounded-xl bg-[#0F766E] px-4 text-[14px] font-semibold text-white" onClick={() => void startLive()}>
            Videoni yozish
          </button>
        ) : null}
        {mobile ? (
          <label className="inline-flex h-12 items-center rounded-xl border border-[#d7dee8] px-4 text-[14px] font-semibold">
            Kamera (zaxira)
            <input
              type="file"
              accept="video/*"
              capture="environment"
              hidden
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                event.target.value = "";
                void onFile(file, "capture_input");
              }}
            />
          </label>
        ) : (
          <label className="inline-flex h-12 items-center rounded-xl border border-[#d7dee8] px-4 text-[14px] font-semibold">
            Fayldan yuklash
            <input
              type="file"
              accept="video/mp4,video/quicktime,video/webm"
              hidden
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                event.target.value = "";
                void onFile(file, "desktop_file");
              }}
            />
          </label>
        )}
        {phase === "preview" ? (
          <>
            <button type="button" className="h-12 rounded-xl bg-[#0F766E] px-4 text-[14px] font-semibold text-white" onClick={() => void accept()}>Ishlatish</button>
            <button type="button" className="h-12 rounded-xl border border-[#d7dee8] px-4 text-[14px] font-semibold" onClick={() => { setPhase("idle"); setPreviewUrl(""); pending.current = null; }}>Qayta yozish</button>
          </>
        ) : null}
      </div>
      {phase === "uploading" ? <p>Yuklanmoqda…</p> : null}
      {phase === "done" ? <p data-testid="surplus-video-ready">Video tayyor.</p> : null}
      {message ? <p className="text-[13px] font-medium text-[#9a3412]">{message}</p> : null}
      {error ? <p className="text-[13px] font-medium text-[#9a3412]">{error}</p> : null}
    </div>
  );
}

function probeDuration(blob: Blob) {
  return new Promise<number>((resolve) => {
    const url = URL.createObjectURL(blob);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      const ms = Number.isFinite(video.duration) ? Math.round(video.duration * 1000) : 0;
      URL.revokeObjectURL(url);
      resolve(ms);
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(0);
    };
    video.src = url;
  });
}
