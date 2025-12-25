"use client";

import { useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { AuthButton } from "@/components/auth/auth-button";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { useDiagnosisById } from "@/lib/hooks/use-diagnosis";

// Helper function to convert line breaks to JSX
const formatTextWithLineBreaks = (text: string) => {
  if (!text) return "";
  return text.split("\n").map((line, index) => (
    <span key={index}>
      {line}
      {index < text.split("\n").length - 1 && <br />}
    </span>
  ));
};

// Helper function to format date to Japanese format (YYYY年MM月DD日)
const formatDateToJapanese = (
  dateString: string
): { yearMonth: string; day: string } => {
  if (!dateString) return { yearMonth: "", day: "" };

  try {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return {
      yearMonth: `${year}年${month}`,
      day: `月${day}日`,
    };
  } catch (error) {
    return { yearMonth: "", day: "" };
  }
};

// Helper function to get image path for skin types (essential/attractive)
const getSkinImagePath = (skinType: string): string => {
  const imageMap: Record<string, string> = {
    "職人肌": "/basic/職人肌.webp",
    "平和肌": "/basic/平和肌.webp",
    "親分肌": "/basic/親分肌.webp",
    "コミュ肌": "/basic/コミュ肌.webp",
    "赤ちゃん肌": "/basic/赤ちゃん肌.webp",
    "多才肌": "/basic/多才肌.webp",
    "スマート肌": "/basic/スマート肌.webp",
    "ドリーム肌": "/basic/ドリーム肌.webp",
    "ポジティブ肌": "/basic/ポジティブ肌.webp",
    "姉御肌": "/basic/姉御肌.webp",
    "天才肌": "/basic/天才肌.webp",
    "オリジナル肌": "/basic/オリジナル肌.webp",
  };
  return imageMap[skinType] || "/basic/オリジナル肌.webp";
};

// Helper function to get image path for element combinations (valuable/problem)
const getElementImagePath = (element: string): string => {
  const imageMap: Record<string, string> = {
    "金土": "/basic/金土.webp",
    "銀金": "/basic/銀金.webp",
    "金水": "/basic/金水.webp",
    "金金": "/basic/金金.webp",
    "銀土": "/basic/銀土.webp",
    "銀水": "/basic/銀水.webp",
    "金木": "/basic/金木.webp",
    "銀火": "/basic/銀火.webp",
    "銀木": "/basic/銀木.webp",
    "金火": "/basic/金火.webp",
  };
  return imageMap[element] || "/basic/金木.webp";
};

// Helper function to get text icon path for sections
const getTextIconPath = (sectionKey: string): string | null => {
  const iconMap: Record<string, string> = {
    talent: "/texticon/work_text.png",
    beautyThreeSource: "/texticon/work_text.png",
    work: "/texticon/work_text.png",
    like: "/texticon/like_text.png",
    impressive: "/texticon/impress_text.png",
    affair: "/texticon/affair_text.png",
    stress: "/texticon/stress_text.png",
    marriage: "/texticon/mirrage_text.png",
    faceMuscle: "/texticon/like_text.png",
    attractiveValuable: "/texticon/impress_text.png",
  };
  return iconMap[sectionKey] || null;
};

// Helper function to get PDF path for sections
const getPdfPath = (sectionKey: string): string | null => {
  const pdfMap: Record<string, string> = {
    talent: "/pdfs/12SKINS　テキスト才能.pdf",
    beautyThreeSource: "/pdfs/12SKINS　テキスト　美の３源タイプ.pdf",
    work: "/pdfs/12SKINS　テキスト仕事.pdf",
    like: "/pdfs/12SKINS　テキスト好き.pdf",
    impressive: "/pdfs/12SKINS　テキスト印象（見た目）.pdf",
    affair: "/pdfs/12SKINS　テキスト恋愛.pdf",
    marriage: "/pdfs/12SKINS　テキスト結婚・離婚.pdf",
    stress: "/pdfs/12SKINS　テキスト　ストレス.pdf",
    faceMuscle: "/pdfs/12SKINS テキスト　　顔の筋肉の癖.pdf",
    attractiveValuable: "/pdfs/12SKINS　テキスト価値.pdf",
  };
  return pdfMap[sectionKey] || null;
};

// Section Title Component with icon and text
const SectionTitle = ({
  iconPath,
  title,
  pdfPath,
  sectionKey
}: {
  iconPath: string | null;
  title: string;
  pdfPath?: string | null;
  sectionKey?: string;
}) => {
  const handleClick = () => {
    if (pdfPath) {
      window.open(pdfPath, '_blank');
    }
  };

  return (
    <div className="relative mb-6">
      <div
        className="rounded-lg px-6 py-4 shadow-lg border border-silver/30"
        style={{
          background: 'linear-gradient(to bottom, rgba(160, 160, 160, 0.7), rgba(240, 240, 240, 0.95), rgba(200, 200, 200, 0.75), rgba(160, 160, 160, 0.7))',
        }}
      >
        <div className="flex items-center justify-center relative gap-4">
          {iconPath && (
            <div
              className="flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={handleClick}
              title={pdfPath ? "クリックしてPDFを開く" : ""}
            >
              <img
                src={iconPath}
                alt={title}
                className="w-16 h-16 md:w-20 md:h-20 object-contain"
              />
            </div>
          )}
          <div
            className={`flex-1 text-xl md:text-2xl font-bold text-silver-dark tracking-wide text-center ${!iconPath && pdfPath ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''} ${iconPath ? 'min-w-0' : ''}`}
            onClick={!iconPath ? handleClick : undefined}
            title={!iconPath && pdfPath ? "クリックしてPDFを開く" : ""}
          >
            {title}
          </div>
        </div>
      </div>
    </div>
  );
};

// Interface for the API response (flattened structure)
interface DiagnosisResult {
  essential: string;
  essential_lb: string;
  attractive: string;
  attractive_lb: string;
  valuable: string;
  valuable_lb: string;
  problem: string;
  problem_lb: string;
  talent_title: string;
  talent_subtitle: string;
  talent_content: string;
  talent_additionalTitle: string;
  talent_additionalContent: string;
  talent_valuableTitle: string;
  talent_valuableSubtitle: string;
  energy_action: string;
  energy_focus: string;
  energy_stamina: string;
  energy_creative: string;
  energy_influence: string;
  energy_emotional: string;
  energy_recovery: string;
  energy_intuition: string;
  energy_judgment: string;
  energy_adaptability: string;
  energy_total: string;
  work_recommend: string;
  work_tenConcept: string;
  work_workContent: string;
  like_title: string;
  like_subtitle: string;
  like_content: string;
  impressive_title: string;
  impressive_subtitle: string;
  impressive_strong: string;
  impressive_likeDislike: string;
  loveAffair_content: string;
  marriage_content: string;
  stress_plus: string;
  stress_minus: string;
  stress_fiveGrowth: string;
  faceMuscle_value: string;
  attractiveValuable_title: string;
  attractiveValuable_content: string;
}

const DiagnosisView = () => {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  
  const { data: diagnosisData, isLoading, error: queryError } = useDiagnosisById(id);
  const error = queryError?.message || (id ? null : "診断IDが指定されていません");

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-silver-vertical">
          <header className="relative z-50 border-b border-gold/30 bg-gradient-silver backdrop-blur-sm shadow-md">
            <div className="container mx-auto px-4 py-6">
              <div className="flex justify-between items-center mb-4">
                <Link href="/diagnosis" className="text-gold hover:underline font-medium">
                  ← 診断ページに戻る
                </Link>
                <AuthButton />
              </div>
            </div>
          </header>
          <main className="container mx-auto px-4 py-12 max-w-4xl">
            <Card className="shadow-lg border-gold/30 bg-gradient-to-br from-white to-gold-light/10">
              <CardContent className="text-center py-12">
                <div className="flex flex-col items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-gold mb-4"></div>
                  <p className="text-lg text-silver-dark">診断結果を読み込み中...</p>
                </div>
              </CardContent>
            </Card>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  if (error || !diagnosisData) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-silver-vertical">
          <header className="relative z-50 border-b border-gold/30 bg-gradient-silver backdrop-blur-sm shadow-md">
            <div className="container mx-auto px-4 py-6">
              <div className="flex justify-between items-center mb-4">
                <Link href="/diagnosis" className="text-gold hover:underline font-medium">
                  ← 診断ページに戻る
                </Link>
                <AuthButton />
              </div>
            </div>
          </header>
          <main className="container mx-auto px-4 py-12 max-w-4xl">
            <Card className="shadow-lg border-gold/30 bg-gradient-to-br from-white to-gold-light/10">
              <CardContent className="text-center py-12">
                <p className="text-lg text-red-600">{error || "診断結果が見つかりませんでした"}</p>
                <Link href="/diagnosis">
                  <button className="mt-4 px-4 py-2 bg-gold text-white rounded hover:opacity-90">
                    診断ページに戻る
                  </button>
                </Link>
              </CardContent>
            </Card>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  const result = diagnosisData.resultData;

  // Render functions (same as diagnosis page)
  const renderTalentSection = () => (
    <Card
      key="talent"
      className="shadow-lg border-gold/30 bg-gradient-to-br from-white to-gold-light/10"
    >
      <CardHeader>
        <SectionTitle iconPath={getTextIconPath("talent")} title="才能・能力" pdfPath={getPdfPath("talent")} sectionKey="talent" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <h3 className="font-bold text-lg text-silver-dark">メイン才能</h3>
          <div className="bg-gold-light/20 p-4 rounded-lg border border-gold/30">
            <div className="font-semibold text-gold">
              {formatTextWithLineBreaks(result.talent_title)}
            </div>
            <div className="text-sm text-gold mt-1">
              {formatTextWithLineBreaks(result.talent_subtitle)}
            </div>
            <div className="text-sm text-silver-dark mt-2">
              {formatTextWithLineBreaks(result.talent_content)}
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <h3 className="font-bold text-lg text-silver-dark">価値観才能</h3>
          <div className="bg-gold-light/20 p-4 rounded-lg border border-gold/30">
            <div className="font-semibold text-gold">
              {formatTextWithLineBreaks(result.talent_valuableTitle)}
            </div>
            <div className="text-sm text-gold mt-1">
              {formatTextWithLineBreaks(result.talent_valuableSubtitle)}
            </div>
          </div>
        </div>
        <div className="space-y-3">
          <div className="text-center mb-4">
            <h3 className="font-bold text-xl md:text-2xl text-gold mb-1 tracking-wide">
              ✨ エネルギースコア
            </h3>
            <p className="text-xs text-silver-dark/70">あなたの内なる美しさを数値で</p>
          </div>
          <div className="space-y-1.5">
            {[
              {
                key: "action",
                label: "行動",
                value: result.energy_action,
              },
              {
                key: "focus",
                label: "集中",
                value: result.energy_focus,
              },
              {
                key: "stamina",
                label: "持久力",
                value: result.energy_stamina,
              },
              {
                key: "creative",
                label: "創造性",
                value: result.energy_creative,
              },
              {
                key: "influence",
                label: "影響力",
                value: result.energy_influence,
              },
              {
                key: "emotional",
                label: "感情",
                value: result.energy_emotional,
              },
              {
                key: "recovery",
                label: "回復",
                value: result.energy_recovery,
              },
              {
                key: "intuition",
                label: "直感",
                value: result.energy_intuition,
              },
              {
                key: "judgment",
                label: "判断",
                value: result.energy_judgment,
              },
              {
                key: "adaptability",
                label: "適応",
                value: result.energy_adaptability,
              },
              {
                key: "total",
                label: "総合",
                value: result.energy_total,
              },
            ].map(({ key, label, value }) => {
              const numericValue = parseInt(value) || 0;
              const percentage = Math.min((numericValue / 100) * 100, 100);
              const isTotal = key === "total";
              
              return (
                <div
                  key={key}
                  className={`relative overflow-hidden rounded-lg ${
                    isTotal
                      ? "bg-gradient-to-r from-gold via-gold-light to-gold border-2 border-gold shadow-lg p-2.5 transform transition-all hover:scale-[1.01]"
                      : "bg-gradient-to-r from-white via-gold-light/20 to-white border border-gold/40 shadow-sm p-2 hover:shadow-md transition-all"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div
                      className={`font-semibold ${
                        isTotal
                          ? "text-silver-dark text-base md:text-lg"
                          : "text-silver-dark text-sm"
                      }`}
                    >
                      {label}
                    </div>
                    <div
                      className={`font-bold ${
                        isTotal
                          ? "text-gold-dark text-xl md:text-2xl"
                          : "text-gold text-base md:text-lg"
                      }`}
                    >
                      {value}
                    </div>
                  </div>
                  {!isTotal && (
                    <div className="relative h-1 bg-white/50 rounded-full overflow-hidden mt-1">
                      <div
                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-gold via-gold-light to-gold rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  )}
                  {isTotal && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderBeautyThreeSourceSection = () => (
    <Card
      key="beautyThreeSource"
      className="shadow-lg border-silver/30 bg-gradient-to-br from-white to-silver-light/10"
    >
      <CardHeader>
        <SectionTitle
          iconPath={getTextIconPath("beautyThreeSource")}
          title="美の3源タイプ"
          pdfPath={getPdfPath("beautyThreeSource")}
          sectionKey="beautyThreeSource"
        />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-silver-light/20 p-4 rounded-lg border border-silver/30">
          <div className="font-semibold text-silver-dark">
            {formatTextWithLineBreaks(result.talent_additionalTitle)}
          </div>
          <div className="text-sm text-silver-dark mt-2">
            {formatTextWithLineBreaks(result.talent_additionalContent)}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderWorkSection = () => (
    <Card
      key="work"
      className="shadow-lg border-gold/30 bg-gradient-to-br from-white to-gold-light/10"
    >
      <CardHeader>
        <SectionTitle iconPath={getTextIconPath("work")} title="仕事・キャリア" pdfPath={getPdfPath("work")} sectionKey="work" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-gold-light/20 p-4 rounded-lg border border-gold/30">
          <div className="font-semibold text-gold mb-2">おすすめ</div>
          <div className="text-silver-dark">
            {formatTextWithLineBreaks(result.work_recommend)}
          </div>
        </div>
        <div className="bg-silver-light/20 p-4 rounded-lg border border-silver/30">
          <div className="font-semibold text-silver-dark mb-2">10のコンセプト</div>
          <div className="text-silver-dark">
            {formatTextWithLineBreaks(result.work_tenConcept)}
          </div>
        </div>
        <div className="bg-gold-light/20 p-4 rounded-lg border border-gold/30">
          <div className="font-semibold text-gold mb-2">仕事内容</div>
          <div className="text-silver-dark">
            {formatTextWithLineBreaks(result.work_workContent)}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderLikeSection = () => (
    <Card
      key="like"
      className="shadow-lg border-silver/30 bg-gradient-to-br from-white to-silver-light/10"
    >
      <CardHeader>
        <SectionTitle iconPath={getTextIconPath("like")} title="好きなもの" pdfPath={getPdfPath("like")} sectionKey="like" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-silver-light/20 p-4 rounded-lg border border-silver/30">
          <div className="font-semibold text-silver-dark mb-2">
            {formatTextWithLineBreaks(result.like_title)}
          </div>
          <div className="text-sm text-silver-dark mb-2">
            {formatTextWithLineBreaks(result.like_subtitle)}
          </div>
          <div className="text-silver-dark">
            {formatTextWithLineBreaks(result.like_content)}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderImpressiveSection = () => (
    <Card
      key="impressive"
      className="shadow-lg border-gold/30 bg-gradient-to-br from-white to-gold-light/10"
    >
      <CardHeader>
        <SectionTitle iconPath={getTextIconPath("impressive")} title="印象・魅力" pdfPath={getPdfPath("impressive")} sectionKey="impressive" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-gold-light/20 p-4 rounded-lg border border-gold/30">
            <div className="font-semibold text-gold mb-2">
              {formatTextWithLineBreaks(result.impressive_title)}
            </div>
            <div className="text-sm text-gold mb-2">
              {formatTextWithLineBreaks(result.impressive_subtitle)}
            </div>
            <div className="text-silver-dark">
              {formatTextWithLineBreaks(result.impressive_strong)}
            </div>
          </div>
          <div className="bg-silver-light/20 p-4 rounded-lg border border-silver/30">
            <div className="font-semibold text-silver-dark mb-2">好き・嫌い</div>
            <div className="text-silver-dark">
              {formatTextWithLineBreaks(result.impressive_likeDislike)}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderAffairSection = () => (
    <Card
      key="affair"
      className="shadow-lg border-gold/30 bg-gradient-to-br from-white to-gold-light/10"
    >
      <CardHeader>
        <SectionTitle iconPath={getTextIconPath("affair")} title="恋愛" pdfPath={getPdfPath("affair")} sectionKey="affair" />
      </CardHeader>
      <CardContent>
        <div className="bg-gold-light/20 p-4 rounded-lg border border-gold/30">
          <div className="text-silver-dark">
            {formatTextWithLineBreaks(result.loveAffair_content)}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderMarriageSection = () => (
    <Card
      key="marriage"
      className="shadow-lg border-silver/30 bg-gradient-to-br from-white to-silver-light/10"
    >
      <CardHeader>
        <SectionTitle iconPath={getTextIconPath("marriage")} title="結婚・離婚" pdfPath={getPdfPath("marriage")} sectionKey="marriage" />
      </CardHeader>
      <CardContent>
        <div className="bg-silver-light/20 p-4 rounded-lg border border-silver/30">
          <div className="text-silver-dark">
            {formatTextWithLineBreaks(result.marriage_content)}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderStressSection = () => (
    <Card
      key="stress"
      className="shadow-lg border-gold/30 bg-gradient-to-br from-white to-gold-light/10"
    >
      <CardHeader>
        <SectionTitle iconPath={getTextIconPath("stress")} title="ストレス・成長" pdfPath={getPdfPath("stress")} sectionKey="stress" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-gold-light/20 p-4 rounded-lg border border-gold/30">
            <div className="font-semibold text-gold mb-2">プラス</div>
            <div className="text-silver-dark">
              {formatTextWithLineBreaks(result.stress_plus)}
            </div>
          </div>
          <div className="bg-silver-light/20 p-4 rounded-lg border border-silver/30">
            <div className="font-semibold text-silver-dark mb-2">マイナス</div>
            <div className="text-silver-dark">
              {formatTextWithLineBreaks(result.stress_minus)}
            </div>
          </div>
          <div className="bg-gold-light/20 p-4 rounded-lg border border-gold/30">
            <div className="font-semibold text-gold mb-2">5つの成長</div>
            <div className="text-silver-dark">
              {formatTextWithLineBreaks(result.stress_fiveGrowth)}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderFaceMuscleSection = () => (
    <Card
      key="faceMuscle"
      className="shadow-lg border-gold/30 bg-gradient-to-br from-white to-gold-light/10"
    >
      <CardHeader>
        <SectionTitle iconPath={getTextIconPath("faceMuscle")} title="顔の筋肉の癖" pdfPath={getPdfPath("faceMuscle")} sectionKey="faceMuscle" />
      </CardHeader>
      <CardContent>
        <div className="bg-gold-light/20 p-4 rounded-lg border border-gold/30">
          <div className="text-silver-dark">
            {formatTextWithLineBreaks(result.faceMuscle_value)}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderAttractiveValuableSection = () => (
    <Card
      key="attractiveValuable"
      className="shadow-lg border-silver/30 bg-gradient-to-br from-white to-silver-light/10"
    >
      <CardHeader>
        <SectionTitle iconPath={getTextIconPath("attractiveValuable")} title="価値観（魅力的）" pdfPath={getPdfPath("attractiveValuable")} sectionKey="attractiveValuable" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-silver-light/20 p-4 rounded-lg border border-silver/30">
          <div className="font-semibold text-silver-dark mb-2">
            {formatTextWithLineBreaks(result.attractiveValuable_title)}
          </div>
          <div className="text-silver-dark mt-2">
            {formatTextWithLineBreaks(result.attractiveValuable_content)}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const allSections = [
    { key: "talent", render: renderTalentSection },
    { key: "beautyThreeSource", render: renderBeautyThreeSourceSection },
    { key: "work", render: renderWorkSection },
    { key: "like", render: renderLikeSection },
    { key: "impressive", render: renderImpressiveSection },
    { key: "affair", render: renderAffairSection },
    { key: "marriage", render: renderMarriageSection },
    { key: "stress", render: renderStressSection },
    { key: "faceMuscle", render: renderFaceMuscleSection },
    { key: "attractiveValuable", render: renderAttractiveValuableSection },
  ];

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-silver-vertical">
        <header className="relative z-50 border-b border-gold/30 bg-gradient-silver backdrop-blur-sm shadow-md">
          <div className="container mx-auto px-4 py-6">
            <div className="flex justify-between items-center mb-4">
              <Link href="/diagnosis" className="text-gold hover:underline font-medium">
                ← 診断ページに戻る
              </Link>
              <AuthButton />
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gold mb-2">
                12 SKINS Your skin, Your story
              </h1>
              <h2 className="text-xl text-silver-dark">
                個性肌診断 あなたの個性肌4層は?
              </h2>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-12 max-w-4xl">
          <div className="space-y-8 animate-in fade-in duration-700">
            {/* 名前と生年月日表示 */}
            {(() => {
              const formattedDate = formatDateToJapanese(diagnosisData.birthDate);
              return (
                <div
                  className="rounded-lg px-4 md:px-6 py-3 md:py-4 shadow-lg border border-silver/30"
                  style={{
                    background:
                      "linear-gradient(to bottom, rgba(160, 160, 160, 0.7), rgba(240, 240, 240, 0.95), rgba(200, 200, 200, 0.75), rgba(160, 160, 160, 0.7))",
                  }}
                >
                  <div className="flex items-center justify-between gap-2 md:gap-4">
                    <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
                      <span className="text-lg text-gray-400 font-medium whitespace-nowrap">
                        お名前
                      </span>
                      <span className="text-lg text-silver-dark font-semibold">
                        {diagnosisData.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 md:gap-3 flex-shrink md:flex-shrink-0">
                      <span className="text-lg text-gray-400 font-medium whitespace-nowrap">
                        生年月日
                      </span>
                      <div className="text-lg text-silver-dark font-semibold leading-tight min-w-0 flex-shrink">
                        <div className="flex flex-wrap items-center gap-1">
                          <div className="whitespace-nowrap">
                            {formattedDate.yearMonth}
                          </div>
                          <div className="whitespace-nowrap">
                            {formattedDate.day}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* 基本診断結果 */}
            <div className="space-y-6">
              {/* Outer Section */}
              <div>
                <div className="mb-4">
                  <h3 className="text-3xl font-bold text-silver-dark text-center">outer</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {/* 本質肌 - main-outer */}
                  <Card className="relative overflow-hidden border-0 bg-white rounded-lg py-0 gap-2">
                    <div className="text-lg text-center font-bold text-silver-dark mb-1">main-outer</div>
                    <div className="flex flex-col items-center justify-center">
                      <div className="relative flex flex-col w-full items-center justify-center">
                        <div className="text-lg text-silver-dark font-bold">本質肌</div>
                        <div className="text-2xl text-gold px-1 font-belanosima rounded-md absolute bottom-0 left-0">50%</div>                            
                      </div>
                      <div className="text-xs text-silver-dark my-1">
                        本質的な性格持つ才能・可能性
                      </div>
                      <div className="text-3xl font-bold text-silver-dark mb-1 bg-[#ffdecb] px-1">
                        {result.essential_lb}
                      </div>
                    </div>

                    <div className="relative md:h-64 h-32 ">
                      <img
                        src={getSkinImagePath(result.essential_lb)}
                        alt={result.essential_lb}
                        className="w-full h-full object-contain rounded-lg"
                      />
                    </div>
                  </Card>

                  {/* 魅せ肌 - surface-outer */}
                  <Card className="relative overflow-hidden border-0 bg-white rounded-lg py-0 gap-2">
                    <div className="text-lg text-center font-bold text-silver-dark mb-1">surface-outer</div>
                    <div className="flex flex-col items-center justify-center">
                      <div className="relative flex flex-col w-full items-center justify-center">
                        <div className="text-lg text-silver-dark font-bold">魅せ肌</div>
                        <div className="text-2xl font-belanosima text-gold px-1 rounded-md absolute bottom-0 left-0">20%</div>
                      </div>
                      <div className="text-xs text-silver-dark my-1">
                        人から見える、人に魅せる個性
                      </div>
                      <div className="text-3xl font-bold text-silver-dark mb-1 bg-[#ffdecb] px-1">
                        {result.attractive_lb}
                      </div>
                    </div>
                    <div className="relative md:h-64 h-32 flex items-center justify-center mt-3">
                      <img
                        src={getSkinImagePath(result.attractive_lb)}
                        alt={result.attractive_lb}
                        className="w-full h-full object-contain rounded-lg"
                      />
                    </div>
                  </Card>
                </div>
              </div>

              {/* Divider */}
              <div className="relative my-6">
                <div className="h-2 bg-gold"></div>
                <div className="text-center mt-4">
                  <h3 className="text-3xl font-bold text-silver-dark">inner</h3>
                </div>
              </div>

              {/* Inner Section */}
              <div>
                <div className="grid grid-cols-2 gap-4">
                  {/* 価値肌 - open inner */}
                  <Card className="relative border-0 bg-white rounded-lg py-0 gap-2">
                    <div className="flex flex-col items-center justify-center">
                      <div className="text-lg text-center font-bold text-silver-dark mb-1">オープン　inner</div>
                    </div>
                    <div className="relative">
                      <div className="text-2xl font-belanosima text-gold px-1 rounded-md absolute top-0 -left-0 z-10">20%</div>
                      <div className="relative md:h-64 h-32 flex items-center justify-center mt-3">
                        <img
                          src={getElementImagePath(result.valuable_lb)}
                          alt={result.valuable_lb}
                          className="w-full h-full object-contain"
                        />
                      </div>
                    </div>
                    <div className="p-5 pt-0 flex flex-col justify-center items-center">
                      <div className="text-lg text-silver-dark font-bold">価値肌</div>
                      <div className="text-xs text-silver-dark mb-1 text-center leading-relaxed">
                        生き方の価値パターン
                      </div>
                      <div className="text-xs text-silver-dark space-y-0.5 md:block hidden">
                        <div>年齢を重ねると</div>
                        <div>より重視される</div>
                      </div>
                    </div>
                  </Card>

                  {/* トラブル肌 - hide inner */}
                  <Card className="relative border-0 bg-white rounded-lg py-0 gap-2">
                    <div className="flex flex-col items-center justify-center">
                      <div className="text-lg text-center font-bold text-silver-dark mb-1">ハイド inner</div>
                    </div>
                    <div className="relative">
                      <div className="text-2xl font-belanosima text-gold px-1 rounded-md absolute top-0 -left-0 z-10">10%</div>
                      <div className="relative md:h-64 h-32 flex items-center justify-center mt-3">
                        <img
                          src={getElementImagePath(result.problem_lb)}
                          alt={result.problem_lb}
                          className="w-full h-full object-contain"
                        />
                      </div>
                    </div>
                    <div className="p-5 pt-0 flex flex-col justify-center items-center">
                      <div className="text-lg text-silver-dark font-bold">深層肌</div>
                      <div className="text-xs text-silver-dark mb-1 text-center leading-relaxed">
                        生き方・考え方の価値観
                      </div>
                      <div className="text-xs text-silver-dark mb-1 text-center leading-relaxed">
                        緊急時に発揮する個性
                      </div>
                      <div className="text-xs text-silver-dark space-y-0.5 md:block hidden">
                        <div>普段は10％</div>
                        <div>緊急時には</div>
                        <div className="font-semibold">80％</div>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            </div>

            {/* Render sections */}
            {allSections.map((section) => section.render())}
          </div>
        </main>

      </div>
    </ProtectedRoute>
  );
};

export default DiagnosisView;

