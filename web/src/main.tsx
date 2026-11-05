// SPDX-License-Identifier: MIT
// Copyright (c) 2026 RICHARDwuxiaofei
import {
  languages,
  statusLabels,
  translate,
  type Language,
} from "./i18n";
import { styles, getStyle } from "./styles";
import { parseConfig, configDocument } from "./config";
import { StrictMode, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { StyleThumbnail } from "./StyleThumbnail";
import { Preview } from "./Preview";
import {
  defaults,
  statuses,
  resolvedDot,
  statusIsHidden,
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
function App() {
  const [config, setConfig] = useState<Config>({
    ...defaults,
    language: "zh",
    statusMode: "preset",
  });
  const [design, setDesign] = useState<Design | null>(null);
  const [avatar, setAvatar] = useState("");
  const [pronounMode, setPronounMode] = useState("None");
  const [busy, setBusy] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [modelError, setModelError] = useState("");
  const [avatarError, setAvatarError] = useState("");
  const [configError, setConfigError] = useState("");
  const importInput = useRef<HTMLInputElement>(null);
  const configImportGeneration = useRef(0);
  const [exportError, setExportError] = useState("");
  const [notice, setNotice] = useState("");
  const [view, setView] = useState(0);
  const [workerGeneration, setWorkerGeneration] = useState(0);
  const [completedKey, setCompletedKey] = useState("");
  const completedRevision = useRef(-1);
  const worker = useRef<Worker | null>(null);
  const revision = useRef(0),
    sequence = useRef(0),
    avatarGeneration = useRef(0);
  const exportRequest = useRef<{ id: number; config: Config } | null>(null);
  const upload = useRef<HTMLInputElement>(null);
  const [avatarName, setAvatarName] = useState("未上传头像");
  const language = config.language ?? "zh";
  const t = (text: string) => translate(language, text);
  useEffect(() => {
    document.documentElement.lang = language === "zh" ? "zh-CN" : language;
  }, [language]);
  const configKey = JSON.stringify(config);
  const patch = (next: Partial<Config>) => {
    configImportGeneration.current++;
    revision.current = ++sequence.current;
    setBusy(true);
    setNotice("");
    setModelError("");
    setExportError("");
    setConfig((c) => ({ ...c, ...next }));
  };
  const chooseDotColor = (value:string) => patch({dotColor:value,filamentColors:config.filamentColors?.map((v,i)=>i===3?value:v),materialSlots:config.materialSlots?{...config.materialSlots,Status_Dot:3}:undefined});
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
          download(
            r.data,
            `vrc-tag-${pending.config.styleId}-${name}.3mf`,
            "model/3mf",
          );
          setNotice("3MF ✓");
        }
        return;
      }
      if (r.id !== revision.current) return;
      completedRevision.current =
        !r.error && r.design?.parts.length && !r.design.errors.length
          ? r.id
          : -1;
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
      completedRevision.current = -1;
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
      completedRevision.current !== revision.current ||
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
  async function restoreConfig(file?: File) {
    if (!file) return;
    const generation = ++configImportGeneration.current;
    try {
      if (file.size > 100000) throw Error("配置文件过大");
      const restored = parseConfig(JSON.parse(await file.text()));
      if (generation !== configImportGeneration.current) return;
      revision.current = ++sequence.current;
      setBusy(true);
      setConfig(restored);
      setConfigError("");
      setModelError("");
      setExportError("");
      setNotice("已恢复配置；本地头像保持不变。");
      setPronounMode(
        !restored.pronouns
          ? "None"
          : ["He/Him", "She/Her", "They/Them"].includes(restored.pronouns)
            ? restored.pronouns
            : "Custom",
      );
    } catch (e) {
      if (generation === configImportGeneration.current)
        setConfigError(e instanceof Error ? e.message : "无法读取配置");
    }
  }
  const reset = () => {
    configImportGeneration.current++;
    setConfigError("");
    revision.current = ++sequence.current;
    avatarGeneration.current++;
    exportRequest.current = null;
    setExporting(false);
    setBusy(true);
    setConfig({ ...defaults, language, statusMode: "preset" });
    setPronounMode("None");
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
  return (
    <>
      <header className="topbar">
        <a className="brand" href="./">
          <img className="brand-icon" src="assets/brand-icon.png" alt="" />
          <span>
            VRC Tag <strong>Studio</strong>
            <small>powered by Nagikokoro</small>
          </span>
        </a>
        <div className="header-controls">
          <label className="language-picker">
            <svg className="language-globe" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18M5 6.5h14M5 17.5h14"/></svg>
            <select
              id="language"
              aria-label="Language"
              value={language}
              onChange={(e) => patch({ language: e.target.value as Language })}
            >
              {Object.entries(languages).map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </header>
      <main>
        <div className="workspace">
          <aside className="editor">
            <div className="panel-title">
              <h2>{t("设计你的名牌")}</h2>
            </div>
            <section
              className="control-section style-section"
              aria-label={t("名牌样式")}
            >
              <div className="section-heading">
                <span>{t("名牌样式")}</span>
              </div>
              <div
                className="style-cards"
                role="group"
                aria-label={t("名牌样式")}
              >
                {styles.map((style) => (
                  <button
                    key={style.id}
                    type="button"
                    className="style-card"
                    aria-pressed={config.styleId === style.id}
                    onClick={() => patch({ styleId: style.id, hideStatus: undefined })}
                  >
                    <StyleThumbnail styleId={style.id} hangingLoop={config.hangingLoop !== false} />
                    <strong>{style.name}</strong>
                    <span>
                      {t(
                        style.id === "classic"
                          ? "大头像 · 单圈白边"
                          : "VRChat 风格",
                      )}
                    </span>
                  </button>
                ))}
              </div>
              {(
                <div className="friend-row hook-toggle">
                  <label htmlFor="hangingLoop">{t("是否保留顶部挂环")}</label>
                  <input
                    id="hangingLoop"
                    role="switch"
                    type="checkbox"
                    checked={config.hangingLoop !== false}
                    onChange={(e) => patch({ hangingLoop: e.target.checked })}
                  />
                </div>
              )}
            </section>
            <section className="control-section">
              <div className="section-heading">
                <span>{t("身份")}</span>
              </div>
              <label htmlFor="displayName">{t("显示名称")}</label>
              <input
                id="displayName"
                value={config.displayName}
                maxLength={120}
                onChange={(e) => patch({ displayName: e.target.value })}
              />
              <div className="friend-row">
                <div>
                  <label htmlFor="friend">{t("好友外观")}</label>
                  <small>{t("让名字闪耀一点金色")}</small>
                </div>
                <input
                  id="friend"
                  type="checkbox"
                  role="switch"
                  checked={config.friend}
                  onChange={(e) => patch({ friend: e.target.checked })}
                />
              </div>
              <label htmlFor="pronouns">Pronouns · {t("名字下方的小字")}</label>
              <select
                id="pronouns"
                value={pronounMode}
                onChange={(e) => {
                  setPronounMode(e.target.value);
                  patch({
                    pronouns: ["None", "Custom"].includes(e.target.value)
                      ? ""
                      : e.target.value,
                  });
                }}
              >
                <option value="None">{t("不显示")}</option>
                <option>He/Him</option>
                <option>She/Her</option>
                <option>They/Them</option>
                <option value="Custom">{t("自定义")}</option>
              </select>
              {pronounMode === "Custom" && (
                <input
                  aria-label={t("自定义 Pronouns")}
                  value={config.pronouns}
                  maxLength={120}
                  onChange={(e) => patch({ pronouns: e.target.value })}
                />
              )}
            </section>
            <section className="control-section">
              <div className="section-heading">
                <span>{t("此刻的状态")}</span>
              </div>
              <label htmlFor="status">{t("状态")}</label>
              <select
                id="status"
                value={
                  statusIsHidden(config) ? "Hide" : config.statusMode === "preset" ? config.status : "Custom"
                }
                onChange={(e) =>
                  e.target.value === "Hide" ? patch({hideStatus:true,dotColor:"auto",filamentColors:config.filamentColors?.map((v,i)=>i===3?"auto":v)}) : e.target.value === "Custom"
                    ? patch({ statusMode: "custom", hideStatus:false,dotColor:"auto",filamentColors:config.filamentColors?.map((v,i)=>i===3?"auto":v) })
                    : patch({
                        hideStatus: false,
                        statusMode: "preset",
                        status: e.target.value as Status,
                        dotColor: "auto",
                        filamentColors: config.filamentColors?.map(
                          (color, i) => (i === 3 ? "auto" : color),
                        ),
                      })
                }
              >
                <option value="Hide">{t("隐藏状态文字")}</option>
                {Object.keys(statuses).map((id) => (
                  <option key={id} value={id}>
                    {statusLabels[language][id]}
                  </option>
                ))}
                <option value="Custom">{t("自定义")}</option>
              </select>
              {!statusIsHidden(config) && config.statusMode !== "preset" && (
                <>
                  <label htmlFor="customStatus">{t("状态文字")}</label>
                  <input
                    id="customStatus"
                    value={config.customStatus}
                    maxLength={120}
                    onChange={(e) => patch({ customStatus: e.target.value })}
                  />
                </>
              )}
              <label>{t("状态点颜色")}</label>
              <div className="swatches status-swatches">
                {Object.entries(statuses).filter(([id])=>id!=="Offline").map(([id,color])=><button key={id} type="button" className={`swatch ${resolvedDot(config).toLowerCase()===color.toLowerCase()?"selected":""}`} title={statusLabels[language][id]} aria-label={statusLabels[language][id]} aria-pressed={resolvedDot(config).toLowerCase()===color.toLowerCase()} style={{"--swatch":color} as React.CSSProperties} onClick={()=>chooseDotColor(color)}/>)}
                <label className="color-input status-custom-color" title={t("自定义")}><input id="statusColor" type="color" aria-label={t("状态点颜色")} value={resolvedDot(config)} onChange={e=>chooseDotColor(e.target.value)}/><span aria-hidden="true">＋</span></label>
              </div>
            </section>
            <section className="control-section avatar-section">
              <div className="section-heading">
                <span>{t("头像")}</span>
              </div>
              <div className="upload-row">
                <div className="avatar-thumb">
                  {avatar ? (
                    <img src={avatar} alt={t("本地头像")} />
                  ) : (
                    <span>＋</span>
                  )}
                </div>
                <div>
                  <button
                    className="secondary"
                    onClick={() => upload.current?.click()}
                  >
                    {t("选择本地图片")} ↗
                  </button>
                  <small>{t(avatarName)}</small>
                </div>
                {(avatar || avatarError) && (
                  <button
                    className="clear"
                    aria-label={t("移除头像")}
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
                  {t(avatarError)}
                </p>
              )}
            </section>
          </aside>
          <section className="preview-panel">
            <div
              className="preview-area"
              data-config-key={completedKey}
              aria-busy={busy}
            >
              <Preview
                design={design}
                avatar={avatar}
                view={view}
                avatarPreview={true}
                language={language}
              />
              {busy && (
                <div className="loading" role="status">
                  {t(design ? "正在更新名牌…" : "正在加载本地建模资源…")}
                </div>
              )}
              <div className="view-tools">
                <button onClick={() => setView((v) => v + 1)}>
                  ↺ {t(view % 2 ? "透视视图" : "正面视图")}
                </button>
                <span>{t("拖动旋转 · 滚动缩放")}</span>
              </div>
            </div>
            <div className="preview-caption">
              <span>{getStyle(config.styleId).name}</span>
              <span>
                {(design?.size ?? getStyle(config.styleId).layout.size).map(v=>v.toFixed(1)).join(" × ")}{" "}
                mm
              </span>
            </div>
            <div className="export-panel">
              <div className="messages" aria-live="polite">
                {[modelError, exportError, ...errors]
                  .filter(Boolean)
                  .map((s, i) => (
                    <p className="error" key={i}>
                      {t(s)}
                    </p>
                  ))}
                {modelError && (
                  <button
                    onClick={() => {
                      revision.current = ++sequence.current;
                      setBusy(true);
                      setWorkerGeneration((g) => g + 1);
                    }}
                  >
                    {t("重新加载建模资源")}
                  </button>
                )}
                {!!design?.warnings.length && <details className="print-notes"><summary>{t("打印提示")}</summary>{design.warnings.map((s,i)=><p className="warning" key={i}>{t(s)}</p>)}</details>}
                {notice && <p className="success">{t(notice)}</p>}
              </div>
              <button
                className="export-button"
                disabled={busy || exporting || !valid}
                onClick={beginExport}
                data-export-key={configKey}
              >
                <span>{t(exporting ? "正在本地打包…" : "下载多色 3MF")}</span>
                <span>↓</span>
              </button>
              <div className="export-links">
                <button
                  onClick={() =>
                    download(
                      JSON.stringify(configDocument(config), null, 2),
                      "vrc-tag-config.json",
                      "application/json",
                    )
                  }
                >
                  {t("导出配置 JSON")} ↗
                </button>
                <button onClick={() => importInput.current?.click()}>
                  {t("恢复配置 JSON")} ↗
                </button>
                <input
                  ref={importInput}
                  type="file"
                  accept="application/json,.json"
                  hidden
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    e.target.value = "";
                    void restoreConfig(file);
                  }}
                />
                <button onClick={reset}>{t("重置为默认")}</button>
              </div>
              {configError && (
                <p role="alert" className="error">
                  {t(configError)}
                </p>
              )}

            </div>
          </section>
        </div>
        <footer>
          <span>
            VRC TAG STUDIO · © 2026 RICHARDwuxiaofei ·{" "}
            {t("非 VRChat 官方产品")}
          </span>
          <a
            href="licenses/PROJECT-NOTICE.txt"
            target="_blank"
            rel="noreferrer"
          >
            {t("代码 MIT · Native CC BY 4.0 · Classic 许可例外")}
          </a>
        </footer>
        <div className="github-footer"><a href="https://github.com/RICHARDwuxiaofei/vrctag" target="_blank" rel="noreferrer">GitHub ↗</a></div>
      </main>
    </>
  );
}
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
