// SPDX-License-Identifier: MIT
export type Language = "zh" | "ja" | "ko" | "en";
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
// Product translations; the official English/Korean status terminology is source-checked.
const rows: Record<string, [string, string, string]> = {
  "隐藏状态文字": ["ステータス文字を非表示", "상태 문구 숨기기", "Hide status text"],
  "状态点颜色": ["ステータスの点の色", "상태 점 색상", "Status dot color"],
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
