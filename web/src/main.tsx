// SPDX-License-Identifier: MIT
// Copyright (c) 2026 RICHARDwuxiaofei
import {
  browserLanguage,
  statusLabels,
  translate,
  type Language,
} from "./i18n";
import { styles, getStyle } from "./styles";
import { parseConfig, configDocument } from "./config";
import { StrictMode, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { LanguagePicker } from "./LanguagePicker";
import { StyleThumbnail } from "./StyleThumbnail";
import {
  scaledDimensions,
  referenceDimensions,
  clampScale,
  clampNameFontScale,
  percentFromMillimeters,
} from "./size-scale";
import { SizeNumberInput } from "./SizeNumberInput";
import { takeStarPromptOpportunity } from "./star-prompt";
import { Preview } from "./Preview";
import { PHOTO_PAPERS, generatePhotoBatchPdf, planPhotoPages, type PhotoPaperId, type PhotoPrintMode } from "./photo-pdf";
import { PhotoCropEditor, PhotoSheetPreview, readPhoto, type PhotoItem } from "./PhotoBatch";
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
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
function App() {
  const [config, setConfig] = useState<Config>(() => ({
    ...defaults,
    language: browserLanguage(),
    statusMode: "preset",
  }));
  const [design, setDesign] = useState<Design | null>(null);
  const [avatar, setAvatar] = useState("");
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [editorStart, setEditorStart] = useState<number | null>(null);
  const [previewPage, setPreviewPage] = useState(0);
  const [draggingPhoto, setDraggingPhoto] = useState(false);
  const [avatarSourceSize, setAvatarSourceSize] = useState(0);
  const [photoPaperId, setPhotoPaperId] = useState<PhotoPaperId>("4r");
  const [photoPrintMode, setPhotoPrintMode] = useState<PhotoPrintMode>("multiple");
  const [photoPdfBusy, setPhotoPdfBusy] = useState(false);
  const [photoPdfError, setPhotoPdfError] = useState("");
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
  const [starPromptOpen, setStarPromptOpen] = useState(false);
  const starPromptSeen = useRef(false);
  const starDialogRef = useRef<HTMLDialogElement>(null);
  const [view, setView] = useState(0);
  const [workerGeneration, setWorkerGeneration] = useState(0);
  const [completedKey, setCompletedKey] = useState("");
  const completedRevision = useRef(-1);
  const worker = useRef<Worker | null>(null);
  const revision = useRef(0),
    sequence = useRef(0),
    avatarGeneration = useRef(0);
  const exportRequest = useRef<{ id: number; config: Config; target: "bambu"|"core" } | null>(null);
  const upload = useRef<HTMLInputElement>(null);
  const [exportFormat,setExportFormat]=useState<"bambu"|"core"|"blender">("bambu");
  const blenderExportBusy = useRef(false);
  const [avatarName, setAvatarName] = useState("未上传头像");
  const language = config.language ?? "zh";
  const t = (text: string) => translate(language, text);
  useEffect(() => {
    document.documentElement.lang = language === "zh" ? "zh-CN" : language;
  }, [language]);
  useEffect(() => {
    const dialog = starDialogRef.current;
    if (!dialog) return;
    if (starPromptOpen && !dialog.open) dialog.showModal();
    if (!starPromptOpen && dialog.open) dialog.close();
  }, [starPromptOpen]);
  const promptStarAfterExport = () => {
    if (starPromptSeen.current) return;
    starPromptSeen.current = true;
    let storage: Storage | undefined;
    try { storage = window.sessionStorage; } catch { /* Storage may be disabled. */ }
    if (takeStarPromptOpportunity(storage)) setStarPromptOpen(true);
  };
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
            `vrc-tag-${pending.config.styleId}-${name}${pending.target === "bambu" ? "-color" : "-core"}.3mf`,
            "model/3mf",
          );
          setNotice("3MF ✓");
          promptStarAfterExport();
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
  const beginExport = async () => {
    if (
      blenderExportBusy.current ||
      exportRequest.current ||
      completedRevision.current !== revision.current ||
      busy ||
      completedKey !== configKey ||
      !design?.parts.length ||
      design.errors.length ||
      modelError
    )
      return;
    if (exportFormat === "blender") {
      blenderExportBusy.current = true;
      setExporting(true);
      setExportError("");
      const snapshot = structuredClone(design), photo = avatar;
      const name = config.displayName.replace(/[^a-zA-Z0-9_\u4e00-\u9fff-]/g, "_") || "nameplate";
      try {
        const { exportBlender } = await import("./blender-export");
        download(await exportBlender(snapshot, photo), `vrc-tag-${config.styleId}-${name}.glb`, "model/gltf-binary");
        promptStarAfterExport();
      } catch (error) {
        console.error("VRC Tag Studio Blender GLB export failed", error);
        setExportError("Blender 导出失败，请重试。");
      } finally { blenderExportBusy.current = false; setExporting(false); }
      return;
    }
    const id = ++sequence.current,
      snapshot = structuredClone(config);
    exportRequest.current = { id, config: snapshot, target: exportFormat };
    setExportError("");
    setExporting(true);
    worker.current?.postMessage({ id, type: "export", config: snapshot, exportTarget: exportFormat });
  };
  async function loadPhotos(files: File[]) {
    if (!files.length) return;
    const generation = ++avatarGeneration.current;
    setAvatarError("");
    try {
      const loaded = await Promise.all(files.map(readPhoto));
      if (generation !== avatarGeneration.current) return;
      const start = photos.length;
      setPhotos(previous => [...previous, ...loaded]);
      if (!photos.length) { setAvatar(loaded[0].cropped); setAvatarSourceSize(loaded[0].sourceSize); setAvatarName(loaded[0].name); }
      setPhotoPdfError(""); setPreviewPage(0); setEditorStart(start);
    } catch (error) {
      if (generation === avatarGeneration.current) setAvatarError(error instanceof Error ? error.message : "无法读取这张图片，请使用其他图片。");
    }
  }
  useEffect(() => {
    const paste = (event: ClipboardEvent) => {
      const target = event.target;
      if (target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))) return;
      const files = Array.from(event.clipboardData?.items ?? []).filter(item => item.kind === "file" && item.type.startsWith("image/")).map(item => item.getAsFile()).filter((f): f is File => !!f);
      if (files.length) { event.preventDefault(); void loadPhotos(files); }
    };
    const preventFileNavigation = (event: DragEvent) => { if (Array.from(event.dataTransfer?.types ?? []).includes("Files")) event.preventDefault(); };
    window.addEventListener("paste", paste); window.addEventListener("dragover", preventFileNavigation); window.addEventListener("drop", preventFileNavigation);
    return () => { window.removeEventListener("paste", paste); window.removeEventListener("dragover", preventFileNavigation); window.removeEventListener("drop", preventFileNavigation); };
  }, [photos]);
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
  const exportConfig = () => {
    download(JSON.stringify(configDocument(config), null, 2), "vrc-tag-config.json", "application/json");
    promptStarAfterExport();
  };
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
    setPhotos([]); setEditorStart(null); setPreviewPage(0);
    setAvatarSourceSize(0);
    setPhotoPdfError("");
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
  // Always use the active style + optional hanging loop for exact reference
  // dimensions, even while the worker is rebuilding the geometry.
  const style = getStyle(config.styleId);
  const avatarDiameter = 2 * style.layout.avatar.radius * (config.planarScale ?? 100) / 100;
  const referenceSize = referenceDimensions(style, config.hangingLoop !== false);
  const physicalSize =
    !busy && valid && design?.size
      ? design.size
      : scaledDimensions(referenceSize, config);
  const mm = (value: number) => value.toFixed(2);
  const paper = PHOTO_PAPERS.find((entry) => entry.id === photoPaperId)!;
  const avatarPhotoLayout = {
    radiusMm: style.layout.avatar.radius,
    dotOffsetXmm: style.layout.avatar.dotCenter[0] - style.layout.avatar.center[0],
    dotOffsetYmm: style.layout.avatar.dotCenter[1] - style.layout.avatar.center[1],
    dotRadiusMm: style.layout.avatar.dotRadius,
  };
  const photoPages = planPhotoPages(photoPaperId, avatarPhotoLayout, config.planarScale ?? 100, photoPrintMode, photos.length || 1);
  const activePage = Math.min(previewPage, photoPages.length - 1);
  const croppedPixels = photos.length ? Math.min(1200, Math.round(avatarSourceSize / photos[0].crop.zoom)) : 0;
  const photoPpi = croppedPixels ? Math.round(croppedPixels * 25.4 / avatarDiameter) : 0;
  const downloadPhotoPdf = async () => {
    if (!photos.length || photoPdfBusy) return;
    setPhotoPdfBusy(true);
    setPhotoPdfError("");
    try {
      const pdf = await generatePhotoBatchPdf(photos.map(p => p.cropped), photoPaperId, style.name, config.planarScale ?? 100, avatarPhotoLayout, photoPrintMode);
      download(pdf, `vrc-tag-photo-${style.id}-${photoPaperId}-${photoPrintMode}-${photos.length}photos-${photoPages.length}pages-${mm(avatarDiameter)}mm.pdf`, "application/pdf");
      promptStarAfterExport();
    } catch (error) {
      console.error("Photo PDF export failed", error);
      setPhotoPdfError("照片 PDF 导出失败，请重试。");
    } finally { setPhotoPdfBusy(false); }
  };
  const updatePlanarPercent = (raw: number) => {
    const value = clampScale(raw);
    if (Math.abs(value - (config.planarScale ?? 100)) > 0.0000001)
      patch({ planarScale: value });
  };
  const updateThicknessPercent = (raw: number) => {
    const value = clampScale(raw);
    if (Math.abs(value - (config.thicknessScale ?? 100)) > 0.0000001)
      patch({ thicknessScale: value });
  };
  const updatePlanarMillimeters = (millimeters: number, axis: 0 | 1) =>
    updatePlanarPercent(percentFromMillimeters(millimeters, referenceSize[axis]));
  const updateThicknessMillimeters = (millimeters: number) =>
    updateThicknessPercent(percentFromMillimeters(millimeters, referenceSize[2]));
  const nameFontScale = config.nameFontScale ?? 100;
  const updateNameFontScale = (raw: number) => {
    const value = clampNameFontScale(raw);
    if (Math.abs(value - nameFontScale) > 0.0000001)
      patch({ nameFontScale: value });
  };
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
          <LanguagePicker language={language} onChange={language => patch({ language })} />
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
              <div className="name-font-control">
                <div className="name-font-header">
                  <label htmlFor="name-font-scale-range">{t("名称字号")}</label>
                  <SizeNumberInput
                    id="name-font-scale"
                    label={t("名称字号百分比")}
                    value={nameFontScale}
                    min={50}
                    max={150}
                    unit="%"
                    onCommit={updateNameFontScale}
                  />
                </div>
                <input
                  id="name-font-scale-range"
                  className="size-range"
                  type="range"
                  min={50}
                  max={150}
                  step={1}
                  value={nameFontScale}
                  onChange={(e) => updateNameFontScale(Number(e.target.value))}
                />
                <div className="name-font-meta">
                  {design?.textHeights.Name !== undefined && (
                    <span>
                      {t("当前字高")} <strong>{mm(design.textHeights.Name)} mm</strong>
                    </span>
                  )}
                  {Math.abs(nameFontScale - 100) > 0.0001 && (
                    <button
                      type="button"
                      className="name-font-reset"
                      onClick={() => updateNameFontScale(100)}
                    >
                      {t("恢复默认")}
                    </button>
                  )}
                </div>
                {design?.nameFontClamped && (
                  <p className="field-note">
                    {t("名称较长或受限于版面空间，已自动微调字号以适配区域。")}
                  </p>
                )}
              </div>
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
                  e.target.value === "Hide" ? patch({hideStatus:true}) : e.target.value === "Custom"
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
              <div className={`photo-dropzone${draggingPhoto ? " dragging" : ""}`}
                onDragEnter={e => { if (Array.from(e.dataTransfer.types).includes("Files")) { e.preventDefault(); setDraggingPhoto(true); } }}
                onDragOver={e => { if (Array.from(e.dataTransfer.types).includes("Files")) { e.preventDefault(); e.dataTransfer.dropEffect = "copy"; } }}
                onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDraggingPhoto(false); }}
                onDrop={e => { e.preventDefault(); setDraggingPhoto(false); void loadPhotos(Array.from(e.dataTransfer.files)); }}>
              <div className="upload-row">
                <button type="button" className="avatar-thumb" aria-label={t("选择本地图片")} onClick={() => upload.current?.click()}>
                  {avatar ? (
                    <img src={avatar} alt={t("本地头像")} />
                  ) : (
                    <span>＋</span>
                  )}
                </button>
                <div>
                  <button
                    className="secondary"
                    onClick={() => upload.current?.click()}
                  >
                    {t("选择本地图片")} ↗
                  </button>
                  <small>{avatar ? avatarName : t("未上传头像")}</small>
                </div>
                {(avatar || avatarError) && (
                  <button
                    className="clear"
                    aria-label={t("移除头像")}
                    onClick={() => {
                      avatarGeneration.current++;
                      setAvatarError("");
                      setAvatar("");
                      setPhotos([]); setEditorStart(null); setPreviewPage(0);
                      setAvatarSourceSize(0);
                      setPhotoPdfError("");
                      setAvatarName("未上传头像");
                      if (upload.current) upload.current.value = "";
                    }}
                  >
                    ×
                  </button>
                )}
              </div>
              <p className="field-note">{t("拖入多张图片，或点击选择；也可以粘贴图片。")}</p>
              </div>
              {photos.length > 0 && <div className="photo-batch-list"><p>{t("已上传")} {photos.length} {t("张")} · {t("名牌预览使用第一张")}</p><div>{photos.map((photo, i) => <button type="button" key={i} title={photo.name} onClick={() => setEditorStart(i)}><img src={photo.cropped} alt={`${t("编辑头像")} ${i+1}`} /><span>{i+1}</span></button>)}</div><button type="button" className="secondary" onClick={() => setEditorStart(0)}>{t("重新逐张编辑")}</button></div>}
              {editorStart !== null && photos[editorStart] && <PhotoCropEditor photos={photos} initialIndex={editorStart} t={t} onClose={() => setEditorStart(null)} onSave={(index, cropped, crop) => { setPhotos(previous => previous.map((item, i) => i === index ? {...item, cropped, crop} : item)); if (index === 0) setAvatar(cropped); }} />}
              <input
                ref={upload}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                multiple
                hidden
                onChange={(e) => {
                  const files = Array.from(e.target.files ?? []);
                  e.target.value = "";
                  void loadPhotos(files);
                }}
              />
              {avatarError && (
                <p role="alert" className="error">
                  {t(avatarError)}
                </p>
              )}
              <p className="avatar-size" aria-live="polite">
                {t("照片区域直径")} <strong>{mm(avatarDiameter)} mm</strong>
              </p>
              <p className="field-note">
                {t("头像用于预览和 GLB 贴图；3MF 不包含照片。")}
              </p>

              <div className="photo-pdf-print">
                <label htmlFor="photo-paper">{t("照片打印纸张")}</label>
                <select id="photo-paper" value={photoPaperId} onChange={(event) => setPhotoPaperId(event.target.value as PhotoPaperId)}>
                  {PHOTO_PAPERS.map((item) => (
                    <option key={item.id} value={item.id}>
                      {t(item.label)} — {item.widthMm} × {item.heightMm} mm
                    </option>
                  ))}
                </select>

                <div className="photo-print-mode">
                  <span className="photo-print-mode-label">{t("照片排版方式")}</span>
                  <div className="photo-print-mode-options" role="group" aria-label={t("照片排版方式")}>
                    <label className={photoPrintMode === "single" ? "selected" : ""}>
                      <input type="radio" name="photo-print-mode" value="single" checked={photoPrintMode === "single"}
                        onChange={() => setPhotoPrintMode("single")} />
                      <svg viewBox="0 0 30 38" aria-hidden="true"><rect x="2" y="2" width="26" height="34" rx="2"/><circle cx="15" cy="19" r="6"/></svg><span>{t("一张纸 · 居中一个")}</span>
                    </label>
                    <label className={photoPrintMode === "multiple" ? "selected" : ""}>
                      <input type="radio" name="photo-print-mode" value="multiple" checked={photoPrintMode === "multiple"}
                        onChange={() => setPhotoPrintMode("multiple")} />
                      <svg viewBox="0 0 30 38" aria-hidden="true"><rect x="2" y="2" width="26" height="34" rx="2"/><circle cx="10" cy="13" r="4"/><circle cx="20" cy="13" r="4"/><circle cx="10" cy="24" r="4"/><circle cx="20" cy="24" r="4"/></svg><span>{t("一张纸 · 居中多个")}</span>
                    </label>
                  </div>
                </div>
                <p className="photo-pdf-size">
                  {t("PDF 页面实际尺寸")} <strong>{paper.widthMm} × {paper.heightMm} mm</strong>
                  <span>{t("头像裁剪直径")} <strong>{mm(avatarDiameter)} mm</strong></span>
                  <span>{t("本页照片数量")} <strong>{photoPages[activePage].positions.length} {t("张")}</strong> · {t("共")} {photoPages.length} {t("页")}</span>
                </p>
                <div className="photo-preview-header"><strong>{t("打印排版预览")}</strong><span>{activePage + 1} / {photoPages.length}</span></div>
                <PhotoSheetPreview paper={paper} plan={photoPages[activePage]} images={photos} layout={avatarPhotoLayout} scale={config.planarScale ?? 100} mode={photoPrintMode} styleName={style.name} t={t} />
                {photoPages.length > 1 && <div className="photo-preview-nav"><button type="button" disabled={activePage === 0} onClick={() => setPreviewPage(activePage - 1)}>{t("上一页")}</button><button type="button" disabled={activePage === photoPages.length - 1} onClick={() => setPreviewPage(activePage + 1)}>{t("下一页")}</button></div>}
                {avatar && <p className="field-note">{t("首张图像的裁剪边长")} {croppedPixels} px · {t("估算有效分辨率")} {photoPpi} ppi</p>}
                <button className="photo-pdf-button" type="button" disabled={!avatar || photoPdfBusy}
                  onClick={() => void downloadPhotoPdf()}>
                  {t(photoPdfBusy ? "正在制作照片 PDF…" : "下载照片打印 PDF")} ↓
                </button>
                {!avatar && <p className="field-note">{t("上传头像后可以下载包含照片的 PDF。")}</p>}
                {photoPdfError && <p role="alert" className="error">{t(photoPdfError)}</p>}
                <p className="field-note">{t("推荐使用与打印机兼容的亮面或绒面相纸；按包装尺寸选纸，不要把 100×150 mm 与 4R 混为一谈。")}</p>
                <p className="field-note">{t("可先试用 180–230 g/m² 相纸；克重不是实际厚度。Native 默认头像面比白框低约 0.35 mm，纸加胶可能超过边框。")}</p>
                <p className="field-note">{t("PDF 已按毫米排版：打印选实际尺寸 100%，关闭适应纸张和无边距自动扩展。")}</p>
                <p className="field-note">{t(photoPrintMode === "single"
                  ? "单张 PDF 包含 20 mm 校准线，可先试印量尺。"
                  : "单张头像会重复排满；多张头像各打印一次并自动分页。最外侧照片可能离纸边仅约 1.5 mm，请确认打印机可印范围。")}</p>
                {photoPrintMode === "multiple" && <p className="field-note">{t(photoPages[activePage].calibrationYmm === null
                  ? "密排空间不足，已省略校准线；建议先切换单张试印测量，再下载多张。"
                  : "本页空白处保留 20 mm 校准线，打印后请测量。")}</p>}
                <p className="field-note">{t("Native 的 PDF 会自动避开状态点，并为每张照片附加裁剪虚线。")}</p>
              </div>
              <details className="avatar-print-notes">
                <summary>{t("纸张打印与裁剪说明")}</summary>
                <p>{t(style.id === "classic"
                  ? "按显示直径裁圆后粘贴；头像面与白框齐平，没有插纸卡槽。"
                  : "显示的是完整圆的直径；右下角需剪出状态点缺口，再粘贴到头像面。")}</p>
                <p>{t("照片 PDF 使用已调整的裁切结果。打印 100%/实际尺寸，关闭适应纸张；如在切片器再次缩放模型，纸片也须同比缩放。")}</p>
                <p>{t("尺寸为模型名义值，纸厚、胶厚和裁剪余量仍需实物试贴确认。")}</p>
              </details>
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
              <span>{physicalSize.map(mm).join(" × ")} mm</span>
            </div>
            <section className="size-scaling" aria-labelledby="size-scaling-title">
              <div className="size-scaling-heading">
                <h3 id="size-scaling-title">{t("调整模型尺寸")}</h3>
                <span className="size-scaling-unit">{t("百分比或毫米数均可输入")}</span>
              </div>
              <div className="size-scaling-field">
                <div className="size-scaling-label">
                  <label htmlFor="planar-scale">{t("平面等比缩放")}</label>
                  <SizeNumberInput
                    id="planar-percent"
                    label={t("长宽比例百分比")}
                    value={config.planarScale ?? 100}
                    min={50}
                    max={150}
                    unit="%"
                    onCommit={updatePlanarPercent}
                  />
                </div>
                <input
                  id="planar-scale"
                  className="size-range"
                  type="range"
                  min={50}
                  max={150}
                  step={0.01}
                  value={config.planarScale ?? 100}
                  aria-describedby="planar-size-value"
                  onChange={(e) => updatePlanarPercent(Number(e.target.value))}
                />
                <div className="size-scaling-millimeters" id="planar-size-value">
                  <div className="size-measure">
                    <label htmlFor="planar-mm-length">{t("长度")}</label>
                    <SizeNumberInput
                      id="planar-mm-length"
                      label={t("长度（毫米）")}
                      value={physicalSize[0]}
                      min={referenceSize[0] * 0.5}
                      max={referenceSize[0] * 1.5}
                      unit="mm"
                      onCommit={(value) => updatePlanarMillimeters(value, 0)}
                    />
                  </div>
                  <div className="size-measure">
                    <label htmlFor="planar-mm-width">{t("宽度")}</label>
                    <SizeNumberInput
                      id="planar-mm-width"
                      label={t("宽度（毫米）")}
                      value={physicalSize[1]}
                      min={referenceSize[1] * 0.5}
                      max={referenceSize[1] * 1.5}
                      unit="mm"
                      onCommit={(value) => updatePlanarMillimeters(value, 1)}
                    />
                  </div>
                </div>
              </div>
              <div className="size-scaling-field">
                <div className="size-scaling-label">
                  <label htmlFor="thickness-scale">{t("厚度缩放")}</label>
                  <SizeNumberInput
                    id="thickness-percent"
                    label={t("厚度比例百分比")}
                    value={config.thicknessScale ?? 100}
                    min={50}
                    max={150}
                    unit="%"
                    onCommit={updateThicknessPercent}
                  />
                </div>
                <input
                  id="thickness-scale"
                  className="size-range"
                  type="range"
                  min={50}
                  max={150}
                  step={0.01}
                  value={config.thicknessScale ?? 100}
                  aria-describedby="thickness-size-value"
                  onChange={(e) => updateThicknessPercent(Number(e.target.value))}
                />
                <div className="size-scaling-millimeters" id="thickness-size-value">
                  <div className="size-measure">
                    <label htmlFor="thickness-mm">{t("实际厚度")}</label>
                    <SizeNumberInput
                      id="thickness-mm"
                      label={t("厚度（毫米）")}
                      value={physicalSize[2]}
                      min={referenceSize[2] * 0.5}
                      max={referenceSize[2] * 1.5}
                      unit="mm"
                      onCommit={updateThicknessMillimeters}
                    />
                  </div>
                </div>
              </div>
              <p className="size-scaling-hint">{t("修改长度或宽度，另一项会等比例跟随；厚度独立调整。")}</p>
              <p className="size-scaling-hint">{t("缩小模型后请检查细字与挂环强度；导出为实际尺寸。")}</p>
            </section>
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
              <p className="field-note">{exportFormat==="bambu"?t("默认 A1 · 0.4 mm · PLA（精细小字建议 0.2 mm 喷嘴），请在切片软件中选择自己的打印机和耗材"):""}</p>
              <select id="exportFormat" aria-label={t("导出格式")} value={exportFormat} onChange={e=>setExportFormat(e.target.value as "core"|"bambu"|"blender")}><option value="bambu">{t("多色 3MF（保留颜色）")}</option><option value="core">{t("通用 3MF（需手动分配耗材）")}</option><option value="blender">{t("Blender（GLB，含颜色与头像）")}</option></select>
              {exportFormat === "blender" && <p className="field-note">{t("在 Blender 中选择 文件 → 导入 → glTF 2.0，编辑后可另存为 .blend。")}</p>}
              <button
                className="export-button"
                disabled={busy || exporting || !valid}
                onClick={()=>beginExport()}
                data-export-key={configKey}
              >
                <span>{t(exporting ? "正在本地打包…" : exportFormat === "blender" ? "下载 Blender GLB" : exportFormat === "bambu" ? "下载多色 3MF" : "下载通用 3MF")}</span>
                <span>↓</span>
              </button>
              <div className="export-links">


                <button
                  onClick={exportConfig}
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
        <footer className="site-footer">
          <p className="footer-brand">VRC Tag Studio <span>© 2026 RICHARDwuxiaofei</span></p>
          <p className="footer-meta">{t("非 VRChat 官方产品")}<span aria-hidden="true"> · </span><a href="licenses/PROJECT-NOTICE.txt" target="_blank" rel="noreferrer">{t("代码 MIT · 两款模型 CC BY 4.0")}</a></p>
          <div className="footer-links"><a href="https://github.com/RICHARDwuxiaofei/vrctag" target="_blank" rel="noreferrer">GitHub ↗</a><a href="mailto:nagikokoro2006@gmail.com">{t("Bug 反馈联系")} · nagikokoro2006@gmail.com</a></div>
        </footer>
      </main>
      <dialog
        className="star-prompt-dialog"
        ref={starDialogRef}
        aria-labelledby="star-prompt-title"
        aria-describedby="star-prompt-description"
        onCancel={() => setStarPromptOpen(false)}
      >
        <div className="star-prompt-glyph" aria-hidden="true">★</div>
        <p className="star-prompt-kicker">VRC TAG STUDIO · GITHUB</p>
        <h2 id="star-prompt-title">{t("顺手给个 Star？")}</h2>
        <p className="star-prompt-description" id="star-prompt-description">
          {t("文件已经开始下载啦！喜欢这个小工具的话，可以去 GitHub 点颗星支持一下（")}
        </p>
        <div className="star-prompt-actions">
          <button className="star-prompt-later" type="button" onClick={() => setStarPromptOpen(false)}>
            {t("下次再说")}
          </button>
          <a
            className="star-prompt-primary"
            href="https://github.com/RICHARDwuxiaofei/vrctag"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setStarPromptOpen(false)}
          >
            {t("去 GitHub 点 Star ↗")}
          </a>
        </div>
      </dialog>
    </>
  );
}
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
