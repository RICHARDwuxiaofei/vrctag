import { materialPlan } from "./materials";
import { StrictMode, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { Preview } from "./Preview";
import {
  defaults,
  statuses,
  resolvedDot,
  type Config,
  type Design,
  type Status,
} from "./model";
import "./style.css";
function download(data: BlobPart, name: string, type: string) {
  const url = URL.createObjectURL(new Blob([data], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
function FilamentColor({
  slot,
  color,
  onChange,
}: {
  slot: number;
  color: string;
  onChange: (v: string) => void;
}) {
  const [draft, setDraft] = useState(color);
  useEffect(() => setDraft(color), [color]);
  const apply = (v: string) => {
    setDraft(v);
    if (/^#[0-9a-f]{6}$/i.test(v)) onChange(v);
  };
  return (
    <label>
      槽 {slot + 1}
      <input
        aria-label={`耗材槽 ${slot + 1} 颜色`}
        type="color"
        value={color}
        onInput={(e) => apply(e.currentTarget.value)}
        onChange={(e) => apply(e.target.value)}
      />
      <input
        aria-label={`耗材槽 ${slot + 1} HEX`}
        value={draft}
        maxLength={7}
        onChange={(e) => apply(e.target.value)}
      />
      {!/^#[0-9a-f]{6}$/i.test(draft) && <small>输入 #RRGGBB 后应用</small>}
    </label>
  );
}
function App() {
  const [config, setConfig] = useState<Config>({ ...defaults });
  const [design, setDesign] = useState<Design | null>(null);
  const [avatar, setAvatar] = useState("");
  const [pronounMode, setPronounMode] = useState("None");
  const [busy, setBusy] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [modelError, setModelError] = useState("");
  const [avatarError, setAvatarError] = useState("");
  const [exportError, setExportError] = useState("");
  const [notice, setNotice] = useState("");
  const [view, setView] = useState(0);
  const [showPrintColors, setShowPrintColors] = useState(false);
  const [workerGeneration, setWorkerGeneration] = useState(0);
  const [completedKey, setCompletedKey] = useState("");
  const worker = useRef<Worker | null>(null);
  const revision = useRef(0),
    sequence = useRef(0),
    avatarGeneration = useRef(0);
  const exportRequest = useRef<{ id: number; config: Config } | null>(null);
  const upload = useRef<HTMLInputElement>(null);
  const [avatarName, setAvatarName] = useState("未上传头像");
  const configKey = JSON.stringify(config);
  const patch = (next: Partial<Config>) => {
    revision.current = ++sequence.current;
    setBusy(true);
    setNotice("");
    setModelError("");
    setExportError("");
    setConfig((c) => ({ ...c, ...next }));
  };
  useEffect(() => {
    const w = new Worker(new URL("./studio.worker.ts", import.meta.url), {
      type: "module",
    });
    worker.current = w;
    let active = true;
    w.onmessage = (e) => {
      if (!active) return;
      const r = e.data;
      if (r.type === "export") {
        const pending = exportRequest.current;
        if (!pending || pending.id !== r.id) return;
        exportRequest.current = null;
        setExporting(false);
        if (r.error) setExportError(r.error);
        else {
          const name = pending.config.displayName
            .replace(/[^\p{L}\p{N}_-]/gu, "_")
            .slice(0, 40);
          download(r.data, `vrc-tag-${name}.3mf`, "model/3mf");
          setNotice(
            `${pending.config.displayName} 的 3MF 已生成，使用点击下载时的配置。请核对耗材映射。`,
          );
        }
        return;
      }
      if (r.id !== revision.current) return;
      setBusy(false);
      setCompletedKey(r.key ?? "");
      if (r.error) {
        setModelError(r.error);
        setDesign(null);
      } else {
        setModelError("");
        setDesign(r.design);
      }
    };
    w.onerror = () => {
      if (!active) return;
      setModelError("建模线程异常，请点击重新加载建模资源。");
      setBusy(false);
      if (exportRequest.current) setExportError("导出中断，请重试。");
      exportRequest.current = null;
      setExporting(false);
    };
    return () => {
      active = false;
      w.terminate();
      exportRequest.current = null;
      worker.current = null;
    };
  }, [workerGeneration]);
  useEffect(() => {
    const id = ++sequence.current;
    revision.current = id;
    setBusy(true);
    const timer = setTimeout(
      () => worker.current?.postMessage({ id, type: "build", config }),
      160,
    );
    return () => clearTimeout(timer);
  }, [config, workerGeneration]);
  const beginExport = () => {
    if (
      exportRequest.current ||
      busy ||
      completedKey !== configKey ||
      !design?.parts.length ||
      design.errors.length ||
      modelError
    )
      return;
    const id = ++sequence.current,
      snapshot = structuredClone(config);
    exportRequest.current = { id, config: snapshot };
    setExportError("");
    setExporting(true);
    worker.current?.postMessage({ id, type: "export", config: snapshot });
  };
  async function loadAvatar(file?: File) {
    if (!file) return;
    const generation = ++avatarGeneration.current;
    setAvatarError("");
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setAvatarError("请选择 PNG、JPEG 或 WebP 图片。");
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setAvatarError("图片过大，请选择 15 MB 以内的图片。");
      return;
    }
    let bitmap: ImageBitmap | undefined;
    try {
      bitmap = await createImageBitmap(file);
      if (generation !== avatarGeneration.current) {
        bitmap.close();
        return;
      }
      if (bitmap.width * bitmap.height > 40000000) {
        bitmap.close();
        setAvatarError("图片像素过大，请缩小至 4000 万像素以内。");
        return;
      }
      const size = Math.min(bitmap.width, bitmap.height);
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 512;
      canvas
        .getContext("2d")!
        .drawImage(
          bitmap,
          (bitmap.width - size) / 2,
          (bitmap.height - size) / 2,
          size,
          size,
          0,
          0,
          512,
          512,
        );
      bitmap.close();
      setAvatar(canvas.toDataURL("image/png"));
      setAvatarName(file.name);
      setAvatarError("");
    } catch {
      if (generation === avatarGeneration.current)
        setAvatarError("无法读取这张图片，请使用其他图片。");
    } finally {
      bitmap?.close();
    }
  }
  const reset = () => {
    revision.current = ++sequence.current;
    avatarGeneration.current++;
    exportRequest.current = null;
    setExporting(false);
    setBusy(true);
    setConfig({ ...defaults });
    setPronounMode("None");
    setShowPrintColors(false);
    setAvatar("");
    setAvatarName("未上传头像");
    setNotice("");
    setAvatarError("");
    setModelError("");
    setExportError("");
    if (upload.current) upload.current.value = "";
  };
  const errors = design?.errors ?? [];
  const valid =
    !!design?.parts.length &&
    !errors.length &&
    !modelError &&
    completedKey === configKey;
  const plan = design?.parts.length ? materialPlan(config, design.parts) : null;
  const previewDesign =
    showPrintColors && design && plan
      ? {
          ...design,
          parts: design.parts.map((p, i) => ({
            ...p,
            color: plan.parts[i].color,
          })),
        }
      : design;
  return (
    <>
      <header className="topbar">
        <a className="brand" href="./">
          <span className="brand-mark">v.</span>
          <span>
            VRC Tag <strong>Studio</strong>
            <small>THE PERSONAL NAMEPLATE WORKSHOP</small>
          </span>
        </a>
        <span className="privacy">
          <i /> 浏览器本地制作 <span>· 无需登录</span>
        </span>
      </header>
      <main>
        <section className="intro">
          <div>
            <div className="eyebrow">YOUR NAME. YOUR PRESENCE.</div>
            <h1>
              把你的名字，<em>带到现实。</em>
            </h1>
            <p>从一次相遇，到一枚可以握住的名牌。</p>
          </div>
          <div className="edition">
            STUDIO / 01<span>DESIGNED FOR MULTICOLOR PRINTING</span>
          </div>
        </section>
        <div className="workspace">
          <aside className="editor">
            <div className="panel-title">
              <h2>设计你的名牌</h2>
              <span>01 — EDIT</span>
            </div>
            <section className="control-section">
              <div className="section-heading">
                <span>身份</span>
                <small>IDENTITY</small>
              </div>
              <label htmlFor="displayName">
                Display Name <span>显示名称</span>
              </label>
              <input
                id="displayName"
                value={config.displayName}
                maxLength={120}
                onChange={(e) => patch({ displayName: e.target.value })}
              />
              <div className="friend-row">
                <div>
                  <label htmlFor="friend">
                    Friend <span>好友外观</span>
                  </label>
                  <small>让名字闪耀一点金色</small>
                </div>
                <input
                  id="friend"
                  type="checkbox"
                  role="switch"
                  checked={config.friend}
                  onChange={(e) => patch({ friend: e.target.checked })}
                />
              </div>
              <label htmlFor="pronouns">
                Pronouns <span>名字下方的小字</span>
              </label>
              <select
                id="pronouns"
                value={pronounMode}
                onChange={(e) => {
                  const v = e.target.value;
                  setPronounMode(v);
                  patch({ pronouns: v === "None" || v === "Custom" ? "" : v });
                }}
              >
                <option value="None">None / Unlisted · 不显示</option>
                <option>He/Him</option>
                <option>She/Her</option>
                <option>They/Them</option>
                <option value="Custom">Custom · 自定义</option>
              </select>
              {pronounMode === "Custom" && (
                <input
                  aria-label="自定义 Pronouns"
                  placeholder="写下你的 Pronouns"
                  maxLength={120}
                  value={config.pronouns}
                  onChange={(e) => patch({ pronouns: e.target.value })}
                />
              )}
            </section>
            <section className="control-section">
              <div className="section-heading">
                <span>此刻的状态</span>
                <small>PRESENCE</small>
              </div>
              <label htmlFor="status">
                Status <span>在线状态</span>
              </label>
              <select
                id="status"
                value={config.status}
                onChange={(e) => patch({ status: e.target.value as Status })}
              >
                {Object.keys(statuses).map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
              <div className="dot-heading">
                <label htmlFor="dotMode">状态点颜色</label>
                <select
                  id="dotMode"
                  value={config.dotColor === "auto" ? "auto" : "custom"}
                  onChange={(e) =>
                    patch({
                      dotColor:
                        e.target.value === "auto"
                          ? "auto"
                          : resolvedDot(config),
                    })
                  }
                >
                  <option value="auto">自动匹配</option>
                  <option value="custom">自定义</option>
                </select>
              </div>
              <div className="swatches">
                {Object.entries(statuses).map(([s, color]) => (
                  <button
                    key={s}
                    aria-label={`${s} 颜色`}
                    title={s}
                    className={
                      resolvedDot(config) === color
                        ? "swatch selected"
                        : "swatch"
                    }
                    style={{ "--swatch": color } as React.CSSProperties}
                    onClick={() => patch({ dotColor: color })}
                  />
                ))}
                <label className="color-input" title="自定义状态点颜色">
                  <input
                    aria-label="自定义状态点颜色"
                    type="color"
                    value={resolvedDot(config)}
                    onChange={(e) => patch({ dotColor: e.target.value })}
                  />
                  <span>＋</span>
                </label>
                <code>{resolvedDot(config).toUpperCase()}</code>
              </div>
              <label htmlFor="customStatus">
                Custom Status <span>状态文字</span>
              </label>
              <input
                id="customStatus"
                value={config.customStatus}
                maxLength={120}
                onChange={(e) => patch({ customStatus: e.target.value })}
              />
              <p className="field-note">文字与状态点颜色独立，随心表达。</p>
            </section>
            <section className="control-section avatar-section">
              <div className="section-heading">
                <span>头像</span>
                <small>AVATAR</small>
              </div>
              <div className="upload-row">
                <div className="avatar-thumb">
                  {avatar ? (
                    <img src={avatar} alt="本地头像" />
                  ) : (
                    <span>＋</span>
                  )}
                </div>
                <div>
                  <button
                    className="secondary"
                    onClick={() => upload.current?.click()}
                  >
                    选择本地图片 ↗
                  </button>
                  <small title={avatarName}>{avatarName}</small>
                </div>
                {(avatar || avatarError) && (
                  <button
                    className="clear"
                    aria-label="移除头像"
                    onClick={() => {
                      avatarGeneration.current++;
                      setAvatarError("");
                      setAvatar("");
                      setAvatarName("未上传头像");
                      if (upload.current) upload.current.value = "";
                    }}
                  >
                    ×
                  </button>
                )}
              </div>
              <input
                ref={upload}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                hidden
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  e.target.value = "";
                  void loadAvatar(file);
                }}
              />
              {avatarError && (
                <p role="alert" className="error">
                  {avatarError}
                </p>
              )}
              <p className="field-note">
                图片只留在你的设备。打印导出包含头像基座与边框，不包含彩色图片。
              </p>
            </section>
          </aside>
          <section className="preview-panel">
            <div className="preview-top">
              <span>
                <i /> LIVE PREVIEW
              </span>
              <span className="original">原创几何 · 毫米尺寸</span>
            </div>
            <div
              className="preview-area"
              data-config-key={completedKey}
              aria-busy={busy}
            >
              <Preview design={previewDesign} avatar={avatar} view={view} />
              {busy && (
                <div className="loading" role="status">
                  {design ? "正在更新名牌…" : "正在加载本地建模资源…"}
                </div>
              )}
              <div className="view-tools">
                <button onClick={() => setView((v) => v + 1)}>
                  ↺ {view % 2 ? "透视视图" : "正面视图"}
                </button>
                <span>拖动旋转 · 滚动缩放</span>
              </div>
            </div>
            <div className="preview-caption">
              <span>属于你的，小小存在感。</span>
              <span>
                120 × 38 × 4 <small>mm</small>
              </span>
            </div>
            <div className="export-panel">
              <div className="export-heading">
                <div>
                  <span className="eyebrow">FROM PIXELS TO SOMETHING REAL</span>
                  <h2>准备好，把它带走。</h2>
                </div>
                <span className={`mesh-state ${valid ? "ready" : ""}`}>
                  {busy ? "计算中" : valid ? "● 网格检查通过" : "● 等待修正"}
                </span>
              </div>
              <div className="messages" aria-live="polite">
                {modelError && (
                  <p className="error" role="alert">
                    {modelError}
                  </p>
                )}
                {exportError && (
                  <p className="error" role="alert">
                    {exportError}
                  </p>
                )}
                {modelError && (
                  <button
                    onClick={() => {
                      revision.current = ++sequence.current;
                      setBusy(true);
                      setWorkerGeneration((g) => g + 1);
                    }}
                  >
                    重新加载建模资源
                  </button>
                )}
                {errors.map((s, i) => (
                  <p key={i} className="error">
                    {s}
                  </p>
                ))}
                {design?.warnings.map((s, i) => (
                  <p key={i} className="warning">
                    {s}
                  </p>
                ))}
                {notice && <p className="success">{notice}</p>}
              </div>
              <section className="print-settings">
                <label htmlFor="printMode">打印配色方案</label>
                <select
                  id="printMode"
                  value={config.printMode ?? "cfs4"}
                  onChange={(e) =>
                    patch({ printMode: e.target.value as "cfs4" | "visual" })
                  }
                >
                  <option value="cfs4">四槽 CFS · 独立部件，共享耗材</option>
                  <option value="visual">保留全部视觉颜色</option>
                </select>
                <label className="print-toggle">
                  <input
                    type="checkbox"
                    checked={showPrintColors}
                    onChange={(e) => setShowPrintColors(e.target.checked)}
                  />{" "}
                  预览实际打印配色
                </label>
                {(config.printMode ?? "cfs4") === "cfs4" && (
                  <details>
                    <summary>四个耗材颜色与部件映射</summary>
                    <div className="filament-colors">
                      {plan?.palette.map((color, i) => (
                        <FilamentColor
                          key={i}
                          slot={i}
                          color={color}
                          onChange={(value) => {
                            const colors = [
                              ...(config.filamentColors ?? [
                                "#102b2a",
                                "#f3f6ed",
                                "#ffd45d",
                                "auto",
                              ]),
                            ];
                            colors[i] = value;
                            patch({ filamentColors: colors });
                          }}
                        />
                      ))}
                    </div>
                    <button
                      className="secondary"
                      onClick={() =>
                        patch({
                          filamentColors: undefined,
                          materialSlots: undefined,
                        })
                      }
                    >
                      恢复自动配色映射
                    </button>
                    <div className="material-mapping">
                      {plan?.parts.map((p) => (
                        <label key={p.name}>
                          {p.name}
                          <select
                            aria-label={`${p.name} 打印耗材`}
                            value={p.slot}
                            onChange={(e) =>
                              patch({
                                materialSlots: {
                                  ...config.materialSlots,
                                  [p.name]: Number(e.target.value),
                                },
                              })
                            }
                          >
                            {[0, 1, 2, 3].map((i) => (
                              <option key={i} value={i}>
                                槽 {i + 1}
                              </option>
                            ))}
                          </select>
                        </label>
                      ))}
                    </div>
                  </details>
                )}
                {plan && (
                  <p className="field-note">
                    {plan.palette.length}{" "}
                    个材料条目；所有部件仍独立。槽位编号需在切片软件中对应实际耗材。
                  </p>
                )}
                {plan && plan.palette.length > 4 && (
                  <p className="warning">
                    此方案超过四种颜色，四槽打印前需重新映射。
                  </p>
                )}
              </section>
              <button
                className="export-button"
                disabled={busy || exporting || !valid}
                onClick={beginExport}
                data-export-key={configKey}
              >
                <span>{exporting ? "正在本地打包…" : "下载多色 3MF"}</span>
                <span>↓</span>
              </button>
              <div className="export-links">
                <button
                  onClick={() =>
                    download(
                      JSON.stringify({ schemaVersion: 1, ...config }, null, 2),
                      "vrc-tag-config.json",
                      "application/json",
                    )
                  }
                >
                  导出配置 JSON ↗
                </button>
                <button onClick={reset}>重置为默认</button>
              </div>
              <p className="export-note">
                全部计算在你的浏览器完成。3MF
                保留独立部件及颜色；导入切片软件后请映射实际耗材。Creality Print
                / OrcaSlicer 实机导入尚未验证。
              </p>
            </div>
          </section>
        </div>
        <footer>
          <span>
            VRC TAG STUDIO <small>· 独立设计，灵感来自虚拟世界</small>
          </span>
          <span>LOCAL FIRST. MADE PERSONAL.</span>
        </footer>
      </main>
    </>
  );
}
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
