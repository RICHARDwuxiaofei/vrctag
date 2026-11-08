// SPDX-License-Identifier: MIT
export type Language = "zh" | "ja" | "ko" | "en";
export function browserLanguage(): Language {
  const preferred = (navigator.languages?.[0] || navigator.language || "en")
    .toLowerCase().split(/[-_]/)[0];
  return preferred === "zh" || preferred === "ja" || preferred === "ko"
    ? preferred : "en";
}
export const languages: Record<Language, string> = {
  zh: "中文",
  ja: "日本語",
  ko: "한국어",
  en: "English",
};
export const statusLabels: Record<Language, Record<string, string>> = {
  zh: {
    Online: "在线",
    "Join Me": "欢迎加入",
    "Ask Me": "忙碌",
    Busy: "请勿打扰",
    Offline: "离线",
  },
  ja: {
    Online: "オンライン",
    "Join Me": "だれでもおいで",
    "Ask Me": "きいてみてね",
    Busy: "取り込み中",
    Offline: "オフライン",
  },
  ko: {
    Online: "온라인",
    "Join Me": "참가 환영",
    "Ask Me": "참가 요청 필요",
    Busy: "방해 금지",
    Offline: "오프라인",
  },
  en: {
    Online: "Online",
    "Join Me": "Join Me",
    "Ask Me": "Ask Me",
    Busy: "Do Not Disturb",
    Offline: "Offline",
  },
};
// Status terms: https://wiki.vrchat.com/wiki/Social/{zh-hans,ko}
// Busy is the legacy API identifier for red Do Not Disturb; orange Ask Me is Chinese 忙碌.
// Japanese wording is retained pending a current primary-source/client verification.
const rows: Record<string, [string, string, string]> = {
  "Blender（GLB，含颜色与头像）": ["Blender（GLB・色と画像を含む）", "Blender (GLB, 색상과 이미지 포함)", "Blender (GLB, colors & avatar)"],
  "下载 Blender GLB": ["Blender GLBを保存", "Blender GLB 다운로드", "Download Blender GLB"],
  "Blender 导出失败，请重试。": ["Blender用の保存に失敗しました。再試行してください。", "Blender 내보내기에 실패했습니다. 다시 시도하세요.", "Blender export failed. Please retry."],
  "在 Blender 中选择 文件 → 导入 → glTF 2.0，编辑后可另存为 .blend。": ["Blenderのファイル → インポート → glTF 2.0で開き、編集後に.blendで保存できます。", "Blender의 파일 → 가져오기 → glTF 2.0에서 열고 편집 후 .blend로 저장하세요.", "In Blender: File → Import → glTF 2.0. Save as .blend after editing."],
  "Bug 反馈联系": ["不具合のご連絡", "버그 제보", "Report a bug"],
  "调整模型尺寸": ["モデルのサイズ調整", "모델 크기 조절", "Model dimensions"],
  "百分比或毫米数均可输入": ["% または mm で入力可能", "% 또는 mm 직접 입력", "Enter % or mm"],
  "长宽比例百分比": ["縦横倍率（%）", "가로·세로 배율 (%)", "Planar scale (%)"],
  "厚度比例百分比": ["厚さの倍率（%）", "두께 배율 (%)", "Thickness scale (%)"],
  "长度（毫米）": ["長さ（mm）", "길이 (mm)", "Length (mm)"],
  "宽度（毫米）": ["幅（mm）", "너비 (mm)", "Width (mm)"],
  "厚度（毫米）": ["厚さ（mm）", "두께 (mm)", "Thickness (mm)"],
  "修改长度或宽度，另一项会等比例跟随；厚度独立调整。": [
    "長さか幅を変更すると縦横比は保たれます。厚さは別に変更できます。",
    "길이나 너비를 바꾸면 나머지도 비율에 맞게 변합니다. 두께는 독립적입니다.",
    "Changing length or width keeps the same aspect ratio; thickness is independent.",
  ],
  "平面等比缩放": ["平面サイズ（縦横比固定）", "가로·세로 비율 유지", "Planar scale (locked X/Y)"],
  "厚度缩放": ["厚さの倍率", "두께 배율", "Thickness scale"],
  "长度": ["長さ", "길이", "Length"],
  "宽度": ["幅", "너비", "Width"],
  "实际厚度": ["実際の厚さ", "실제 두께", "Physical thickness"],
  "缩小模型后请检查细字与挂环强度；导出为实际尺寸。": [
    "小さくすると文字や吊り輪が弱くなる場合があります。実寸で書き出します。",
    "크기를 줄이면 작은 글씨나 고리 강도가 약해질 수 있어요. 실제 크기로 내보냅니다.",
    "Smaller sizes can weaken fine text and the hanging loop. Exports use the actual size.",
  ],
  "缩小后小字可能无法打印，请在切片软件检查细节。": [
    "縮小した細かい文字は印刷できない場合があります。スライサーで確認してください。",
    "축소한 작은 글자는 출력되지 않을 수 있으니 슬라이서에서 확인하세요.",
    "Downscaled tiny text may not print; inspect the details in your slicer.",
  ],
  "顺手给个 Star？": ["よかったら Star をお願いします！", "괜찮았다면 Star 하나 부탁해요!", "Enjoying this? Give it a Star!"],
  "文件已经开始下载啦！喜欢这个小工具的话，可以去 GitHub 点颗星支持一下（": [
    "ダウンロードを開始しました！気に入っていただけたら GitHub で Star を付けてもらえるとうれしいです。",
    "다운로드가 시작됐어요! 마음에 드셨다면 GitHub에서 Star로 응원해 주세요.",
    "Your download has started! If you like this little tool, a GitHub Star would mean a lot.",
  ],
  "去 GitHub 点 Star ↗": ["GitHub で Star ↗", "GitHub에서 Star ↗", "Star on GitHub ↗"],
  "下次再说": ["また今度", "다음에 할게요", "Maybe later"],
  "隐藏状态文字": ["ステータス文字を非表示", "상태 문구 숨기기", "Hide status text"],
  "状态点颜色": ["ステータスの点の色", "상태 점 색상", "Status dot color"],
  "导入 Bambu 工程模板": ["Bambuプロジェクトをテンプレートとして読み込む", "Bambu 프로젝트 템플릿 불러오기", "Load Bambu project template"],
  "切回通用 3MF": ["汎用3MFに戻す", "일반 3MF로 전환", "Use generic 3MF"],
  "已载入 Bambu 模板，下载将保留分色": ["Bambuテンプレートを読み込みました", "Bambu 템플릿을 불러왔습니다", "Bambu template loaded; exports include part colors"],
  "导出格式": ["保存形式", "내보내기 형식", "Export format"],
  "多色 3MF（保留颜色）": ["マルチカラー3MF（色を保持）", "다색 3MF (색상 유지)", "Multicolor 3MF (preserve colors)"],
  "通用 3MF（需手动分配耗材）": ["汎用3MF（材料の手動割り当て）", "일반 3MF (필라멘트 수동 매핑)", "Generic 3MF (manual filament mapping)"],
  "选择模板并下载 Bambu 3MF": ["テンプレートを選択してBambu 3MFを保存", "템플릿 선택 후 Bambu 3MF 다운로드", "Choose template and download Bambu 3MF"],
  "下载通用 3MF": ["汎用3MFを保存", "일반 3MF 다운로드", "Download generic 3MF"],
  "更换 Bambu 模板": ["Bambuテンプレートを変更", "Bambu 템플릿 변경", "Change Bambu template"],
  "默认 A1 · 0.4 mm · PLA，请在切片软件中选择自己的打印机和耗材": ["標準 A1・0.4 mm・PLA。スライサーで使用するプリンターと材料を選択してください", "기본 A1 · 0.4 mm · PLA. 슬라이서에서 사용할 프린터와 재료를 선택하세요", "Default A1 · 0.4 mm · PLA; choose your printer and filament in your slicer"],
  "打印提示": ["印刷のヒント", "출력 참고", "Print notes"],
  语言: ["言語", "언어", "Language"],
  浏览器本地制作: [
    "ブラウザー内で作成",
    "브라우저에서 제작",
    "Made in your browser",
  ],
  无需登录: ["ログイン不要", "로그인 불필요", "No sign-in"],
  "把你的名字，带到现实。": [
    "名前を、現実のかたちに。",
    "당신의 이름을 현실로.",
    "Bring your name into the real world.",
  ],
  "从一次相遇，到一枚可以握住的名牌。": [
    "出会いを、手に取れるネームプレートに。",
    "소중한 만남을 손에 쥘 수 있는 이름표로.",
    "Turn a memorable encounter into a nameplate you can hold.",
  ],
  设计你的名牌: [
    "ネームプレートをデザイン",
    "이름표 디자인",
    "Design your nameplate",
  ],
  名牌样式: ["スタイル", "스타일", "Nameplate style"],
  "大头像 · 单圈白边": [
    "大きなアバター・一重の白枠",
    "큰 아바타 · 단일 흰 테두리",
    "Large avatar · single white rim",
  ],
  "VRChat 风格": ["VRChat スタイル", "VRChat 스타일", "VRChat style"],
  显示名称: ["表示名", "표시 이름", "Display name"],
  身份: ["プロフィール", "프로필", "Identity"],
  好友外观: ["フレンド表示", "친구 표시", "Friend appearance"],
  让名字闪耀一点金色: [
    "名前をゴールドに",
    "이름을 금색으로",
    "Give the name a golden glow",
  ],
  名字下方的小字: [
    "名前の下の小さな文字",
    "이름 아래 작은 글씨",
    "Small text below your name",
  ],
  不显示: ["表示しない", "표시 안 함", "None"],
  自定义: ["カスタム", "사용자 지정", "Custom"],
  "自定义 Pronouns": ["カスタム代名詞", "사용자 지정 호칭", "Custom pronouns"],
  挂环: ["吊り下げリング", "걸이 고리", "Hanging loop"],
  是否保留顶部挂环: [
    "上部のリングを付ける",
    "상단 고리 포함",
    "Include the top hanging loop",
  ],
  此刻的状态: ["ステータス", "상태", "Presence"],
  状态: ["ステータス", "상태", "Status"],
  状态文字语言: ["ステータスの言語", "상태 문구 언어", "Status text language"],
  状态文字: ["ステータスメッセージ", "상태 문구", "Status text"],
  "状态文字随界面语言切换；自定义文字保持原样。": [
    "定型文は表示言語に連動し、カスタム文はそのままです。",
    "기본 문구는 화면 언어를 따르며 사용자 문구는 유지됩니다.",
    "Preset text follows the interface language; custom text stays unchanged.",
  ],
  "状态点使用第四槽；可在下面修改颜色。": [
    "ステータスの点はスロット4です。下で色を変更できます。",
    "상태 점은 4번 슬롯을 사용합니다. 아래에서 색을 바꿀 수 있습니다.",
    "The status dot uses slot 4; change its color below.",
  ],
  头像: ["アバター", "아바타", "Avatar"],
  本地头像: ["ローカル画像", "로컬 아바타", "Local avatar"],
  选择本地图片: ["画像を選択", "로컬 이미지 선택", "Choose local image"],
  移除头像: ["画像を削除", "아바타 제거", "Remove avatar"],
  未上传头像: ["画像未選択", "이미지 없음", "No image selected"],
  "图片只留在你的设备。打印包含头像底座，不包含彩色图片。": [
    "画像は端末内のみ。印刷には台座が含まれ、画像は含まれません。",
    "이미지는 기기에만 보관됩니다. 출력에는 받침만 포함되며 사진은 포함되지 않습니다.",
    "Images stay on your device. The print includes the avatar base, not the color image.",
  ],
  实时预览: ["ライブプレビュー", "실시간 미리보기", "Live preview"],
  毫米尺寸: ["ミリメートル単位", "밀리미터 단위", "Dimensions in millimeters"],
  正面视图: ["正面", "정면", "Front view"],
  透视视图: ["パース", "원근 보기", "Perspective view"],
  "拖动旋转 · 滚动缩放": [
    "ドラッグで回転・スクロールでズーム",
    "드래그 회전 · 스크롤 확대",
    "Drag to rotate · scroll to zoom",
  ],
  "正在更新名牌…": ["更新中…", "이름표 업데이트 중…", "Updating nameplate…"],
  "正在加载本地建模资源…": [
    "ローカルデータを読み込み中…",
    "로컬 모델 로딩 중…",
    "Loading local modeling resources…",
  ],
  "准备好，把它带走。": [
    "できあがりを、持ち帰ろう。",
    "완성한 이름표를 가져가세요.",
    "Ready to make it yours.",
  ],
  计算中: ["計算中", "계산 중", "Computing"],
  网格检查通过: ["メッシュ検証済み", "메시 검사 통과", "Mesh checks passed"],
  等待修正: ["修正が必要", "수정 필요", "Needs attention"],
  重新加载建模资源: [
    "再読み込み",
    "모델 다시 로드",
    "Reload modeling resources",
  ],
  四槽打印配色: ["4色印刷", "4색 출력 색상", "Four-slot print colors"],
  预览实际打印配色: [
    "実際の印刷色を表示",
    "실제 출력 색상 미리보기",
    "Preview actual print colors",
  ],
  槽: ["スロット", "슬롯", "Slot"],
  耗材颜色: ["フィラメント色", "필라멘트 색상", "Filament color"],
  "输入 #RRGGBB 后应用": [
    "#RRGGBB を入力",
    "입력 형식: #RRGGBB",
    "Enter #RRGGBB to apply",
  ],
  恢复自动配色映射: [
    "標準配色に戻す",
    "기본 색상 복원",
    "Restore automatic colors",
  ],
  高级配色与部件映射: [
    "詳細な色と部品の割り当て",
    "고급 색상 및 부품 매핑",
    "Advanced colors and part mapping",
  ],
  保留全部视觉颜色: [
    "すべての表示色を保持",
    "모든 시각 색상 유지",
    "Keep all visual colors",
  ],
  "白色内芯＋0.6 mm 黑色正面；上层文字仍可能同层换色。": [
    "白い芯＋0.6 mm の黒い表面。文字層では色替えが必要な場合があります。",
    "흰 코어＋0.6 mm 검은 표면. 글자층에서는 색상 교체가 필요할 수 있습니다.",
    "White core + 0.6 mm black face; upper text layers may still require color changes.",
  ],
  部件: ["部品", "부품", "Parts"],
  白色内芯: ["白い芯", "흰 코어", "White core"],
  黑色正面: ["黒い表面", "검은 표면", "Black face"],
  白色边框: ["白枠", "흰 테두리", "White rim"],
  头像底座: ["アバター台座", "아바타 받침", "Avatar base"],
  头像边框: ["アバター枠", "아바타 테두리", "Avatar rim"],
  名字: ["名前", "이름", "Name"],
  状态点: ["ステータスの点", "상태 점", "Status dot"],
  "下载多色 3MF": [
    "マルチカラー3MFを保存",
    "다색 3MF 다운로드",
    "Download multicolor 3MF",
  ],
  "正在本地打包…": [
    "パッケージを作成中…",
    "로컬 파일 생성 중…",
    "Packaging locally…",
  ],
  "导出配置 JSON": [
    "設定JSONを保存",
    "설정 JSON 내보내기",
    "Export configuration JSON",
  ],
  "恢复配置 JSON": [
    "設定JSONを読み込む",
    "설정 JSON 복원",
    "Restore configuration JSON",
  ],
  重置为默认: ["初期設定に戻す", "기본값으로 초기화", "Reset to defaults"],
  "全部计算在浏览器完成。导入切片软件后请映射实际耗材。尚未验证实际切片或打印。":
    [
      "すべてブラウザー内で計算。スライサーで材料を割り当ててください。実際のスライス・印刷は未検証です。",
      "모든 계산은 브라우저에서 수행됩니다. 슬라이서에서 필라멘트를 매핑하세요. 실제 슬라이싱과 출력은 미검증입니다.",
      "Everything runs in your browser. Map real filaments in your slicer. Actual slicing and printing remain untested.",
    ],
  "非 VRChat 官方产品": [
    "VRChat非公式",
    "VRChat 비공식 제품",
    "Not an official VRChat product",
  ],
  "代码 MIT · 两款模型 CC BY 4.0": [
    "コード MIT・両モデル CC BY 4.0",
    "코드 MIT · 두 모델 CC BY 4.0",
    "Code MIT · both models CC BY 4.0",
  ],
  "请选择 PNG、JPEG 或 WebP 图片。": [
    "PNG、JPEG、WebPを選択してください。",
    "PNG, JPEG 또는 WebP 이미지를 선택하세요.",
    "Choose a PNG, JPEG or WebP image.",
  ],
  "无法读取这张图片，请使用其他图片。": [
    "画像を読み込めません。別の画像を選択してください。",
    "이미지를 읽을 수 없습니다. 다른 이미지를 선택하세요.",
    "Cannot read this image. Please choose another.",
  ],
  "图片过大，请选择 15 MB 以内的图片。": [
    "15 MB以下の画像を選択してください。",
    "15 MB 이하 이미지를 선택하세요.",
    "Choose an image smaller than 15 MB.",
  ],
  "已恢复配置；本地头像保持不变。": [
    "設定を復元しました。画像はそのままです。",
    "설정을 복원했습니다. 로컬 이미지는 유지됩니다.",
    "Configuration restored; local image unchanged.",
  ],
  "建模线程异常，请点击重新加载建模资源。": [
    "ワーカーエラー。再読み込みしてください。",
    "작업 스레드 오류. 모델을 다시 로드하세요.",
    "Modeling worker failed. Reload resources.",
  ],
  "导出中断，请重试。": [
    "保存が中断しました。再試行してください。",
    "내보내기가 중단되었습니다. 다시 시도하세요.",
    "Export interrupted. Please retry.",
  ],
};
export function translate(language: Language, text: string): string {
  if (language === "zh") return text;
  const index = (["ja", "ko", "en"] as const).indexOf(language);
  if (rows[text]) return rows[text][index];
  const stroke = text.match(/^(\w+) 采样细笔画约 ([\d.]+) mm/);
  if (stroke)
    return [
      `${stroke[1]}: 線幅サンプル約 ${stroke[2]} mm。0.4 mmノズルで再現できない場合があります。スライスを確認してください。最小肉厚の認証ではありません。`,
      `${stroke[1]}: 획 두께 표본 약 ${stroke[2]} mm. 0.4 mm 노즐로 표현되지 않을 수 있습니다. 슬라이싱을 확인하세요. 최소 두께 인증이 아닙니다.`,
      `${stroke[1]}: sampled stroke about ${stroke[2]} mm; a 0.4 mm nozzle may lose detail. Check slicing. This is not a minimum wall thickness certification.`,
    ][index];
  const height = text.match(/^(\w+) (?:缩放后仅 |高 )([\d.]+) mm/);
  if (height)
    return [
      `${height[1]}: 高さ ${height[2]} mm。文字を短くし、細線を確認してください。`,
      `${height[1]}: 높이 ${height[2]} mm. 문구를 줄이고 얇은 획을 확인하세요.`,
      `${height[1]}: height ${height[2]} mm. Shorten the text and check thin strokes.`,
    ][index];
  const unsupported = text.match(/字体不支持字符「(.*?)」/);
  if (unsupported)
    return [
      `非対応の文字: ${unsupported[1]}`,
      `지원하지 않는 문자: ${unsupported[1]}`,
      `Unsupported character: ${unsupported[1]}`,
    ][index];
  const generic: Record<string, [string, string, string]> = {
    "请输入显示名称。": [
      "表示名を入力してください。",
      "표시 이름을 입력하세요.",
      "Enter a display name.",
    ],
    "单个文字字段最多 120 个字符。": [
      "各欄は120文字までです。",
      "각 필드는 최대 120자입니다.",
      "Each text field allows up to 120 characters.",
    ],
    "此设备无法启动 WebGL。请开启浏览器硬件加速后重试。": [
      "WebGLを起動できません。ハードウェアアクセラレーションを確認してください。",
      "WebGL을 시작할 수 없습니다. 하드웨어 가속을 확인하세요.",
      "WebGL is unavailable. Check browser hardware acceleration.",
    ],
    配置文件过大: [
      "設定ファイルが大きすぎます。",
      "설정 파일이 너무 큽니다.",
      "Configuration file is too large.",
    ],
    无法读取配置: [
      "設定を読み込めません。",
      "설정을 읽을 수 없습니다.",
      "Cannot read configuration.",
    ],
  };
  if (generic[text]) return generic[text][index];
  if (/[\u3400-\u9fff]/.test(text))
    return [
      `処理エラー。設定を確認して再試行してください。`,
      `처리 오류. 설정을 확인하고 다시 시도하세요.`,
      `Processing failed. Check the configuration and retry.`,
    ][index];
  return text;
}
export const partLabels: Record<string, string> = {
  Plate_Core: "白色内芯",
  Plate_Body: "黑色正面",
  Plate_Rim: "白色边框",
  Avatar_Back: "头像底座",
  Avatar_Frame: "头像边框",
  Hanging_Loop: "挂环",
  Name: "名字",
  Pronouns: "Pronouns",
  Status_Text: "状态文字",
  Status_Dot: "状态点",
};
