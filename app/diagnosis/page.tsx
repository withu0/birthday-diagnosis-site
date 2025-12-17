"use client";

import { useState, useEffect } from "react";
<<<<<<< HEAD
import { useSearchParams, useRouter } from "next/navigation";
=======
import { useSearchParams } from "next/navigation";
>>>>>>> 64956f79ec93423c1e4cf858f8428179b8715fe0
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import { AuthButton } from "@/components/auth/auth-button";
import { ProtectedRoute } from "@/components/auth/protected-route";

const calculateAge = (birthDate: string) => {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

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

<<<<<<< HEAD
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
    talent: "/texticon/work_text.png", // Placeholder - replace with actual talent icon when available
    beautyThreeSource: "/texticon/work_text.png", // Placeholder - replace with actual beauty icon when available
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
        <div className="flex items-center justify-center relative">
          {iconPath && (
            <div 
              className="absolute left-0 flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={handleClick}
              title={pdfPath ? "クリックしてPDFを開く" : ""}
            >
              <img
                src={iconPath}
                alt={title}
                className="w-20 h-20 object-contain"
              />
            </div>
          )}
          <div 
            className={`text-2xl font-bold text-silver-dark tracking-wide text-center ${!iconPath && pdfPath ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
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

=======
>>>>>>> 64956f79ec93423c1e4cf858f8428179b8715fe0
// Interface for the API response (flattened structure)
interface DiagnosisResult {
  // Basic diagnosis results
  essential: string;
  essential_lb: string;
  attractive: string;
  attractive_lb: string;
  valuable: string;
  valuable_lb: string;
  problem: string;
  problem_lb: string;

  // Talent section
  talent_title: string;
  talent_subtitle: string;
  talent_content: string;
  talent_additionalTitle: string;
  talent_additionalContent: string;
  talent_valuableTitle: string;
  talent_valuableSubtitle: string;

  // Energy score
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

  // Work section
  work_recommend: string;
  work_tenConcept: string;
  work_workContent: string;

  // Like section
  like_title: string;
  like_subtitle: string;
  like_content: string;

  // Impressive section
  impressive_title: string;
  impressive_subtitle: string;
  impressive_strong: string;
  impressive_likeDislike: string;

  // Love affair section
  loveAffair_content: string;

  // Marriage section
  marriage_content: string;

  // Stress section
  stress_plus: string;
  stress_minus: string;
  stress_fiveGrowth: string;

  // Face muscle section
  faceMuscle_value: string;

  // Attractive valuable section
  attractiveValuable_title: string;
  attractiveValuable_content: string;
}

<<<<<<< HEAD
interface DiagnosisLogEntry {
  id: string;
  name: string;
  birthDate: string;
  createdAt: string;
}

const BirthdayDiagnosis = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [basicResult, setBasicResult] = useState<Partial<DiagnosisResult> | null>(null);
  const [talentResult, setTalentResult] = useState<Partial<DiagnosisResult> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingTalent, setIsLoadingTalent] = useState(false);
  const [currentThoughts, setCurrentThoughts] = useState("");
  const [futureGoals, setFutureGoals] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [diagnosisLog, setDiagnosisLog] = useState<DiagnosisLogEntry[]>([]);
  const [isLoadingLog, setIsLoadingLog] = useState(false);

  // Fetch diagnosis log on mount
  useEffect(() => {
    fetchDiagnosisLog();
  }, []);
=======
const BirthdayDiagnosis = () => {
  const searchParams = useSearchParams();
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [result, setResult] = useState<DiagnosisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentThoughts, setCurrentThoughts] = useState("");
  const [futureGoals, setFutureGoals] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
>>>>>>> 64956f79ec93423c1e4cf858f8428179b8715fe0

  // Get query parameters on mount
  useEffect(() => {
    const nameParam = searchParams.get("name");
    const birthDateParam = searchParams.get("birthDate");
    const categoryParam = searchParams.get("category");

    if (nameParam) setName(nameParam);
    if (birthDateParam) setBirthDate(birthDateParam);
    if (categoryParam) setSelectedCategory(categoryParam);
  }, [searchParams]);

<<<<<<< HEAD
  const fetchDiagnosisLog = async () => {
    setIsLoadingLog(true);
    try {
      const response = await fetch("/api/diagnosis/list");
      if (response.ok) {
        const data = await response.json();
        setDiagnosisLog(data.results || []);
      }
    } catch (error) {
      console.error("Error fetching diagnosis log:", error);
    } finally {
      setIsLoadingLog(false);
    }
  };

  const saveDiagnosisResult = async (resultData: Partial<DiagnosisResult>) => {
    try {
      await fetch("/api/diagnosis/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          birthDate,
          resultData,
        }),
      });
      // Refresh the log after saving
      fetchDiagnosisLog();
    } catch (error) {
      console.error("Error saving diagnosis result:", error);
    }
  };

=======
>>>>>>> 64956f79ec93423c1e4cf858f8428179b8715fe0
  // Auto-trigger diagnosis when params are set
  useEffect(() => {
    const nameParam = searchParams.get("name");
    const birthDateParam = searchParams.get("birthDate");

    if (
      nameParam &&
      birthDateParam &&
      name === nameParam &&
      birthDate === birthDateParam &&
<<<<<<< HEAD
      !basicResult &&
=======
      !result &&
>>>>>>> 64956f79ec93423c1e4cf858f8428179b8715fe0
      !isLoading
    ) {
      // Use a ref or state to prevent multiple calls
      const timer = setTimeout(() => {
        handleDiagnosis();
      }, 100);
      return () => clearTimeout(timer);
    }
<<<<<<< HEAD
  }, [name, birthDate, searchParams, basicResult, isLoading]);
=======
  }, [name, birthDate, searchParams]);
>>>>>>> 64956f79ec93423c1e4cf858f8428179b8715fe0

  const handleDiagnosis = async () => {
    if (!birthDate || !name) return;

    // Validate birth date
    const date = new Date(birthDate);
    const today = new Date();
    if (isNaN(date.getTime())) {
      alert("有効な生年月日を入力してください");
      return;
    }
    if (date.getFullYear() < 1900) {
      alert("1900年以降の生年月日を入力してください");
      return;
    }

    setIsLoading(true);
<<<<<<< HEAD
    setBasicResult(null); // Clear previous results
    setTalentResult(null); // Clear previous talent results
=======
    setResult(null); // Clear previous results
>>>>>>> 64956f79ec93423c1e4cf858f8428179b8715fe0

    try {
      console.log("[frontend] Starting diagnosis for:", name, birthDate);

      // Step 1: Fetch basic diagnosis data
      console.log("[frontend] Fetching basic diagnosis data...");
<<<<<<< HEAD
      const basicResponse = await fetch("/api/judge/basic", {
=======
      const basicResponse = await fetch("/api/sheets/basic", {
>>>>>>> 64956f79ec93423c1e4cf858f8428179b8715fe0
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ birthDate }),
      });

      if (!basicResponse.ok) {
        const errorData = await basicResponse.json().catch(() => ({}));
        throw new Error(
          errorData.error || `Basic API request failed: ${basicResponse.status}`
        );
      }

      const basicData = await basicResponse.json();
      console.log("[frontend] Received basic data:", basicData);

      // Validate basic data
      if (
        !basicData.essential ||
        !basicData.attractive ||
        !basicData.valuable ||
        !basicData.problem
      ) {
        throw new Error("Invalid basic data from API");
      }

<<<<<<< HEAD
      // Show basic results immediately
      setBasicResult(basicData);
      setIsLoading(false); // Basic loading is done

      // Step 2: Fetch talent data using the mapped values from basic data
      setIsLoadingTalent(true);
      console.log("[frontend] Fetching talent data...");
      const talentResponse = await fetch("/api/judge/talent", {
=======
      // Step 2: Fetch talent data using the mapped values from basic data
      console.log("[frontend] Fetching talent data...");
      const talentResponse = await fetch("/api/sheets/talent", {
>>>>>>> 64956f79ec93423c1e4cf858f8428179b8715fe0
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          essential_lb: basicData.essential_lb,
          valuable_lb: basicData.valuable_lb,
          attractive_lb: basicData.attractive_lb,
          problem_lb: basicData.problem_lb,
        }),
      });

      if (!talentResponse.ok) {
        const errorData = await talentResponse.json().catch(() => ({}));
        throw new Error(
          errorData.error ||
            `Talent API request failed: ${talentResponse.status}`
        );
      }

      const talentData = await talentResponse.json();
      console.log("[frontend] Received talent data:", talentData);

<<<<<<< HEAD
      // Show talent results when ready
      setTalentResult(talentData);

      // Save diagnosis result to database after both basic and talent data are fetched
      const combinedResult = {
        ...basicData,
        ...talentData,
      };
      await saveDiagnosisResult(combinedResult);
=======
      // Step 3: Combine both results
      const combinedData: DiagnosisResult = {
        ...basicData,
        ...talentData,
      };

      console.log("[frontend] Combined diagnosis data:", combinedData);
      setResult(combinedData);
>>>>>>> 64956f79ec93423c1e4cf858f8428179b8715fe0
    } catch (error) {
      console.error("[frontend] Diagnosis error:", error);
      alert(
        `診断中にエラーが発生しました: ${
          error instanceof Error ? error.message : "不明なエラー"
        }`
      );
<<<<<<< HEAD
      setIsLoading(false);
      setIsLoadingTalent(false);
    } finally {
      setIsLoadingTalent(false);
=======
    } finally {
      setIsLoading(false);
>>>>>>> 64956f79ec93423c1e4cf858f8428179b8715fe0
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-silver-vertical">
        {/* ヘッダー */}
        <header className="border-b border-gold/30 bg-gradient-silver backdrop-blur-sm shadow-md">
          <div className="container mx-auto px-4 py-6">
<<<<<<< HEAD
            <div className="flex justify-between items-center mb-4">
=======
            <div className="flex justify-between items-center">
>>>>>>> 64956f79ec93423c1e4cf858f8428179b8715fe0
              <Link href="/" className="text-gold hover:underline font-medium">
                ← トップページに戻る
              </Link>
              <AuthButton />
            </div>
<<<<<<< HEAD
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gold mb-2">
                12 SKINS Your skin, Your story
              </h1>
              <h2 className="text-xl text-silver-dark">
                個性肌診断 あなたの個性肌4層は?
              </h2>
            </div>
=======
>>>>>>> 64956f79ec93423c1e4cf858f8428179b8715fe0
          </div>
        </header>

        <main className="container mx-auto px-4 py-12 max-w-4xl">
          {/* 入力フォームは表示しない - トップページからの入力のみ使用 */}
          {!name || !birthDate ? (
            <Card className="mb-8 shadow-lg border-gold/30 bg-gradient-to-br from-white to-gold-light/10">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl gradient-text-gold">
                  診断情報が不足しています
                </CardTitle>
                <CardDescription className="text-silver-dark">
                  トップページから診断を開始してください
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <Link href="/">
                  <Button className="gradient-bg-gold text-white hover:opacity-90 border-0">
                    トップページに戻る
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : isLoading ? (
            <Card className="mb-8 shadow-lg border-gold/30 bg-gradient-to-br from-white to-gold-light/10">
              <CardContent className="text-center py-12">
                <div className="flex flex-col items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-gold mb-4"></div>
<<<<<<< HEAD
                  <p className="text-lg text-silver-dark">基本診断を読み込み中...</p>
=======
                  <p className="text-lg text-silver-dark">診断中...</p>
>>>>>>> 64956f79ec93423c1e4cf858f8428179b8715fe0
                </div>
              </CardContent>
            </Card>
          ) : null}

          {/* 結果表示 */}
<<<<<<< HEAD
          {basicResult &&
            (() => {
              // Combine basic and talent results for rendering
              const result: DiagnosisResult = {
                ...basicResult,
                ...talentResult,
              } as DiagnosisResult;

              // Define all result sections
              const renderTalentSection = () => {
                // Show loading state if talent data is not yet available
                if (!talentResult) {
                  return (
                    <Card
                      key="talent"
                      className="shadow-lg border-gold/30 bg-gradient-to-br from-white to-gold-light/10"
                    >
                      <CardHeader>
                        <SectionTitle iconPath={getTextIconPath("talent")} title="才能・能力" pdfPath={getPdfPath("talent")} sectionKey="talent" />
                      </CardHeader>
                      <CardContent className="text-center py-8">
                        <div className="flex flex-col items-center justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold mb-3"></div>
                          <p className="text-sm text-silver-dark">読み込み中...</p>
                        </div>
                      </CardContent>
                    </Card>
                  );
                }

                return (
                  <Card
                    key="talent"
                    className="shadow-lg border-gold/30 bg-gradient-to-br from-white to-gold-light/10"
                  >
                    <CardHeader>
                      <SectionTitle iconPath={getTextIconPath("talent")} title="才能・能力" pdfPath={getPdfPath("talent")} sectionKey="talent" />
                    </CardHeader>
                    <CardContent className="space-y-4">
=======
          {result &&
            (() => {
              // Define all result sections
              const renderTalentSection = () => (
                <Card
                  key="talent"
                  className="shadow-lg border-gold/30 bg-gradient-to-br from-white to-gold-light/10"
                >
                  <CardHeader>
                    <CardTitle className="text-2xl text-center text-gold">
                      🌟 才能・能力
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
>>>>>>> 64956f79ec93423c1e4cf858f8428179b8715fe0
                      <div className="space-y-2">
                        <h3 className="font-bold text-lg text-silver-dark">
                          メイン才能
                        </h3>
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
                        <h3 className="font-bold text-lg text-silver-dark">
<<<<<<< HEAD
                          価値観才能
                        </h3>
                        <div className="bg-gold-light/20 p-4 rounded-lg border border-gold/30">
                          <div className="font-semibold text-gold">
                            {formatTextWithLineBreaks(
                              result.talent_valuableTitle
                            )}
                          </div>
                          <div className="text-sm text-gold mt-1">
                            {formatTextWithLineBreaks(
                              result.talent_valuableSubtitle
=======
                          追加才能
                        </h3>
                        <div className="bg-silver-light/20 p-4 rounded-lg border border-silver/30">
                          <div className="font-semibold text-silver-dark">
                            {formatTextWithLineBreaks(
                              result.talent_additionalTitle
                            )}
                          </div>
                          <div className="text-sm text-silver-dark mt-2">
                            {formatTextWithLineBreaks(
                              result.talent_additionalContent
>>>>>>> 64956f79ec93423c1e4cf858f8428179b8715fe0
                            )}
                          </div>
                        </div>
                      </div>
<<<<<<< HEAD
                      <div className="space-y-2">
                        <h3 className="font-bold text-lg text-gold">
                          ⚡ エネルギースコア
                        </h3>
                        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
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
                          ].map(({ key, label, value }) => (
                            <div
                              key={key}
                              className="bg-gradient-gold p-3 rounded-lg text-center border border-gold/30"
                            >
                              <div className="text-xs font-semibold mb-1">
                                {label}
                              </div>
                              <div className="text-lg font-bold">
                                {value}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              };

              const renderBeautyThreeSourceSection = () => {
                if (!talentResult) {
                  return null;
                }

                return (
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
                          {formatTextWithLineBreaks(
                            result.talent_additionalTitle
                          )}
                        </div>
                        <div className="text-sm text-silver-dark mt-2">
                          {formatTextWithLineBreaks(
                            result.talent_additionalContent
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              };
=======
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-bold text-lg text-silver-dark">
                        価値観才能
                      </h3>
                      <div className="bg-gold-light/20 p-4 rounded-lg border border-gold/30">
                        <div className="font-semibold text-gold">
                          {formatTextWithLineBreaks(
                            result.talent_valuableTitle
                          )}
                        </div>
                        <div className="text-sm text-gold mt-1">
                          {formatTextWithLineBreaks(
                            result.talent_valuableSubtitle
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-bold text-lg text-gold">
                        ⚡ エネルギースコア
                      </h3>
                      <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
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
                        ].map(({ key, label, value }) => (
                          <div
                            key={key}
                            className="bg-gradient-gold p-3 rounded-lg text-center border border-gold/30"
                          >
                            <div className="text-xs font-semibold mb-1">
                              {label}
                            </div>
                            <div className="text-lg font-bold">
                              {value}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
>>>>>>> 64956f79ec93423c1e4cf858f8428179b8715fe0

              const renderWorkSection = () => (
                <Card
                  key="work"
                  className="shadow-lg border-gold/30 bg-gradient-to-br from-white to-gold-light/10"
                >
                  <CardHeader>
<<<<<<< HEAD
                    <SectionTitle iconPath={getTextIconPath("work")} title="仕事・キャリア" pdfPath={getPdfPath("work")} sectionKey="work" />
=======
                    <CardTitle className="text-2xl text-center text-gold">
                      💼 仕事・キャリア
                    </CardTitle>
>>>>>>> 64956f79ec93423c1e4cf858f8428179b8715fe0
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-gold-light/20 p-4 rounded-lg border border-gold/30">
                      <div className="font-semibold text-gold mb-2">
                        おすすめ
                      </div>
                      <div className="text-silver-dark">
                        {formatTextWithLineBreaks(result.work_recommend)}
                      </div>
                    </div>
                    <div className="bg-silver-light/20 p-4 rounded-lg border border-silver/30">
                      <div className="font-semibold text-silver-dark mb-2">
                        10のコンセプト
                      </div>
                      <div className="text-silver-dark">
                        {formatTextWithLineBreaks(result.work_tenConcept)}
                      </div>
                    </div>
                    <div className="bg-gold-light/20 p-4 rounded-lg border border-gold/30">
                      <div className="font-semibold text-gold mb-2">
                        仕事内容
                      </div>
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
<<<<<<< HEAD
                    <SectionTitle iconPath={getTextIconPath("like")} title="好きなもの" pdfPath={getPdfPath("like")} sectionKey="like" />
=======
                    <CardTitle className="text-2xl text-center text-silver-dark">
                      ❤️ 好きなもの
                    </CardTitle>
>>>>>>> 64956f79ec93423c1e4cf858f8428179b8715fe0
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
<<<<<<< HEAD
                    <SectionTitle iconPath={getTextIconPath("impressive")} title="印象・魅力" pdfPath={getPdfPath("impressive")} sectionKey="impressive" />
=======
                    <CardTitle className="text-2xl text-center text-gold">
                      ✨ 印象・魅力
                    </CardTitle>
>>>>>>> 64956f79ec93423c1e4cf858f8428179b8715fe0
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
                        <div className="font-semibold text-silver-dark mb-2">
                          好き・嫌い
                        </div>
                        <div className="text-silver-dark">
                          {formatTextWithLineBreaks(
                            result.impressive_likeDislike
                          )}
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
<<<<<<< HEAD
                    <SectionTitle iconPath={getTextIconPath("affair")} title="恋愛" pdfPath={getPdfPath("affair")} sectionKey="affair" />
=======
                    <CardTitle className="text-xl text-center text-gold">
                      💕 恋愛
                    </CardTitle>
>>>>>>> 64956f79ec93423c1e4cf858f8428179b8715fe0
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
<<<<<<< HEAD
                    <SectionTitle iconPath={getTextIconPath("marriage")} title="結婚・離婚" pdfPath={getPdfPath("marriage")} sectionKey="marriage" />
=======
                    <CardTitle className="text-xl text-center text-silver-dark">
                      💍 結婚・離婚
                    </CardTitle>
>>>>>>> 64956f79ec93423c1e4cf858f8428179b8715fe0
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
<<<<<<< HEAD
                    <SectionTitle iconPath={getTextIconPath("stress")} title="ストレス・成長" pdfPath={getPdfPath("stress")} sectionKey="stress" />
=======
                    <CardTitle className="text-2xl text-center text-gold">
                      😰 ストレス・成長
                    </CardTitle>
>>>>>>> 64956f79ec93423c1e4cf858f8428179b8715fe0
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="bg-gold-light/20 p-4 rounded-lg border border-gold/30">
                        <div className="font-semibold text-gold mb-2">
                          プラス
                        </div>
                        <div className="text-silver-dark">
                          {formatTextWithLineBreaks(result.stress_plus)}
                        </div>
                      </div>
                      <div className="bg-silver-light/20 p-4 rounded-lg border border-silver/30">
                        <div className="font-semibold text-silver-dark mb-2">
                          マイナス
                        </div>
                        <div className="text-silver-dark">
                          {formatTextWithLineBreaks(result.stress_minus)}
                        </div>
                      </div>
                      <div className="bg-gold-light/20 p-4 rounded-lg border border-gold/30">
                        <div className="font-semibold text-gold mb-2">
                          5つの成長
                        </div>
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
<<<<<<< HEAD
                    <SectionTitle iconPath={getTextIconPath("faceMuscle")} title="顔の筋肉の癖" pdfPath={getPdfPath("faceMuscle")} sectionKey="faceMuscle" />
=======
                    <CardTitle className="text-2xl text-center text-gold">
                      😊 顔の筋肉の癖
                    </CardTitle>
>>>>>>> 64956f79ec93423c1e4cf858f8428179b8715fe0
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
<<<<<<< HEAD
                    <SectionTitle iconPath={getTextIconPath("attractiveValuable")} title="価値観（魅力的）" pdfPath={getPdfPath("attractiveValuable")} sectionKey="attractiveValuable" />
=======
                    <CardTitle className="text-2xl text-center text-silver-dark">
                      💎 価値観（魅力的）
                    </CardTitle>
>>>>>>> 64956f79ec93423c1e4cf858f8428179b8715fe0
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

              // Order sections based on selected category
<<<<<<< HEAD
              // Talent section always shows (with loading state if needed)
              // Other sections only show when talent data is available
              const allSections = [
                { key: "talent", render: renderTalentSection },
                ...(talentResult
                  ? [
                      { key: "beautyThreeSource", render: renderBeautyThreeSourceSection },
                      { key: "work", render: renderWorkSection },
                      { key: "like", render: renderLikeSection },
                      { key: "impressive", render: renderImpressiveSection },
                      { key: "affair", render: renderAffairSection },
                      { key: "marriage", render: renderMarriageSection },
                      { key: "stress", render: renderStressSection },
                      { key: "faceMuscle", render: renderFaceMuscleSection },
                      {
                        key: "attractiveValuable",
                        render: renderAttractiveValuableSection,
                      },
                    ]
                  : []),
=======
              const allSections = [
                { key: "talent", render: renderTalentSection },
                { key: "work", render: renderWorkSection },
                { key: "like", render: renderLikeSection },
                { key: "impressive", render: renderImpressiveSection },
                { key: "affair", render: renderAffairSection },
                { key: "marriage", render: renderMarriageSection },
                { key: "stress", render: renderStressSection },
                { key: "faceMuscle", render: renderFaceMuscleSection },
                { key: "attractiveValuable", render: renderAttractiveValuableSection },
>>>>>>> 64956f79ec93423c1e4cf858f8428179b8715fe0
              ];

              // Reorder: selected category first, then others
              const orderedSections = selectedCategory
                ? [
                    ...allSections.filter((s) => s.key === selectedCategory),
                    ...allSections.filter((s) => s.key !== selectedCategory),
                  ]
                : allSections;

              return (
                <div className="space-y-8 animate-in fade-in duration-700">
<<<<<<< HEAD
                  {/* 基本診断結果 */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* 本質肌 */}
                    <Card className="relative overflow-hidden border-0 bg-white shadow-lg rounded-lg">
                      <div className="relative h-64">
                        <div className="absolute top-3 left-3 z-20 bg-gold text-white px-3 py-1.5 rounded-md text-xs font-bold shadow-lg">
                          OYA SKIN
                        </div>
                        <img
                          src={getSkinImagePath(result.essential_lb)}
                          alt={result.essential_lb}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent p-4 pt-8">
                          <div className="text-white">
                            <div className="text-2xl font-bold mb-1">
                              {result.essential_lb}
                            </div>
                            <div className="text-sm font-semibold opacity-95">50%</div>
                          </div>
                        </div>
                      </div>
                      <CardContent className="p-5">
                        <div className="font-bold text-gold text-lg mb-1.5">
                          本質肌
                        </div>
                        <div className="text-xs text-silver-dark mb-2 leading-relaxed">
                          本質的な性格 持つ才能・可能性
                        </div>
                        <div className="text-xs text-silver-dark mb-1">
                          生まれ持った
                        </div>
                        <div className="text-xl font-bold text-gold mb-1">
                          {result.essential_lb}
                        </div>
                        <div className="text-sm font-semibold text-gold">
                          50%
                        </div>
                      </CardContent>
                    </Card>

                    {/* 魅せ肌 */}
                    <Card className="relative overflow-hidden border-0 bg-white shadow-lg rounded-lg">
                      <div className="relative h-64">
                        <div className="absolute top-3 left-3 z-20 bg-gold text-white px-3 py-1.5 rounded-md text-xs font-bold shadow-lg">
                          OYA SKIN
                        </div>
                        <img
                          src={getSkinImagePath(result.attractive_lb)}
                          alt={result.attractive_lb}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent p-4 pt-8">
                          <div className="text-white">
                            <div className="text-2xl font-bold mb-1">
                              {result.attractive_lb}
                            </div>
                            <div className="text-sm font-semibold opacity-95">20%</div>
                          </div>
                        </div>
                      </div>
                      <CardContent className="p-5">
                        <div className="font-bold text-gold text-lg mb-1.5">
                          魅せ肌
                        </div>
                        <div className="text-xs text-silver-dark mb-2 leading-relaxed">
                          人から見える、人に魅せる個性
                        </div>
                        <div className="text-xl font-bold text-gold mb-1">
                          {result.attractive_lb}
                        </div>
                        <div className="text-sm font-semibold text-gold">
                          20%
                        </div>
                      </CardContent>
                    </Card>

                    {/* 価値肌 */}
                    <Card className="relative overflow-hidden border-0 bg-white shadow-lg rounded-lg">
                      <div className="relative bg-gradient-to-br from-gold-light/20 via-gold-light/10 to-white min-h-[200px]">
                        <div className="p-8 flex items-center justify-center h-full">
                          <img
                            src={getElementImagePath(result.valuable_lb)}
                            alt={result.valuable_lb}
                            className="max-w-full max-h-48 object-contain"
                          />
                        </div>
                      </div>
                      <CardContent className="p-5">
                        <div className="font-bold text-gold text-lg mb-1.5">
                          価値肌
                        </div>
                        <div className="text-xs text-silver-dark mb-2 leading-relaxed">
                          生き方の価値パターン
                        </div>
                        <div className="text-xl font-bold text-gold mb-1">
                          {result.valuable_lb}
                        </div>
                        <div className="text-sm font-semibold text-gold mb-2">
                          20%
                        </div>
                        <div className="text-xs text-silver-dark space-y-0.5">
                          <div>年齢を重ねると</div>
                          <div>より重視される</div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* トラブル肌 */}
                    <Card className="relative overflow-hidden border-0 bg-white shadow-lg rounded-lg">
                      <div className="relative bg-gradient-to-br from-gold-light/20 via-gold-light/10 to-white min-h-[200px]">
                        <div className="p-8 flex items-center justify-center h-full">
                          <img
                            src={getElementImagePath(result.problem_lb)}
                            alt={result.problem_lb}
                            className="max-w-full max-h-48 object-contain"
                          />
                        </div>
                      </div>
                      <CardContent className="p-5">
                        <div className="font-bold text-gold text-lg mb-1.5">
                          トラブル肌
                        </div>
                        <div className="text-xs text-silver-dark mb-2 leading-relaxed">
                          緊急時に発揮する個性
                        </div>
                        <div className="text-xl font-bold text-gold mb-2">
                          {result.problem_lb}
                        </div>
                        <div className="text-xs text-silver-dark space-y-0.5">
                          <div>普段は10％</div>
                          <div>緊急時には</div>
                          <div className="font-semibold">80％</div>
                        </div>
                      </CardContent>
=======
                  {/* 基本情報 */}
                  <Card className="shadow-lg border-gold/30 bg-gradient-to-br from-white to-gold-light/10">
                    <CardHeader className="text-center">
                      <CardTitle className="text-3xl text-gold">
                        🎂 あなたの誕生日診断結果
                      </CardTitle>
                      <CardDescription className="text-lg text-silver-dark">
                        {name} さん（{calculateAge(birthDate)}歳）の診断結果
                      </CardDescription>
                    </CardHeader>
                  </Card>

                  {/* 基本診断結果 */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="text-center p-4 border-2 border-gold/50 bg-gradient-to-br from-gold-light/20 to-white">
                      <div className="font-bold text-gold mb-2">本質</div>
                      <div className="text-2xl font-bold text-gold bg-gold-light/30 p-3 rounded">
                        {result.essential}
                      </div>
                      <div className="text-sm mt-2 text-silver-dark">
                        {result.essential_lb}
                      </div>
                    </Card>

                    <Card className="text-center p-4 border-2 border-silver/50 bg-gradient-to-br from-silver-light/20 to-white">
                      <div className="font-bold text-silver-dark mb-2">
                        魅力的
                      </div>
                      <div className="text-2xl font-bold text-silver-dark bg-silver-light/30 p-3 rounded">
                        {result.attractive}
                      </div>
                      <div className="text-sm mt-2 text-silver-dark">
                        {result.attractive_lb}
                      </div>
                    </Card>

                    <Card className="text-center p-4 border-2 border-gold/50 bg-gradient-to-br from-gold-light/20 to-white">
                      <div className="font-bold text-gold mb-2">価値観</div>
                      <div className="text-2xl font-bold text-gold bg-gold-light/30 p-3 rounded">
                        {result.valuable}
                      </div>
                      <div className="text-sm mt-2 text-silver-dark">
                        {result.valuable_lb}
                      </div>
                    </Card>

                    <Card className="text-center p-4 border-2 border-silver/50 bg-gradient-to-br from-silver-light/20 to-white">
                      <div className="font-bold text-silver-dark mb-2">
                        問題
                      </div>
                      <div className="text-2xl font-bold text-silver-dark bg-silver-light/30 p-3 rounded">
                        {result.problem}
                      </div>
                      <div className="text-sm mt-2 text-silver-dark">
                        {result.problem_lb}
                      </div>
>>>>>>> 64956f79ec93423c1e4cf858f8428179b8715fe0
                    </Card>
                  </div>

                  {/* Render sections in order */}
                  {orderedSections.map((section) => section.render())}

                  {/* 個人の感想セクション */}
<<<<<<< HEAD
                  {/* <div className="space-y-4">
=======
                  <div className="space-y-4">
>>>>>>> 64956f79ec93423c1e4cf858f8428179b8715fe0
                    <Card className="p-4 border-gold/30 bg-gradient-to-br from-white to-gold-light/10">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-gold">💖</span>
                        <span className="font-semibold text-silver-dark">
                          今の自分で変えたいところはどこですか
                        </span>
                      </div>
                      <Textarea
                        value={currentThoughts}
                        onChange={(e) => setCurrentThoughts(e.target.value)}
                        className="min-h-[80px] resize-none border-gold/30 focus:border-gold"
                        placeholder="ここに入力してください..."
                      />
                    </Card>

                    <Card className="p-4 border-silver/30 bg-gradient-to-br from-white to-silver-light/10">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-silver-dark">💖</span>
                        <span className="font-semibold text-silver-dark">
                          将来どんな自分になりたいですか
                        </span>
                      </div>
                      <Textarea
                        value={futureGoals}
                        onChange={(e) => setFutureGoals(e.target.value)}
                        className="min-h-[80px] resize-none border-silver/30 focus:border-silver"
                        placeholder="ここに入力してください..."
                      />
                    </Card>
<<<<<<< HEAD
                  </div> */}
=======
                  </div>
>>>>>>> 64956f79ec93423c1e4cf858f8428179b8715fe0

                  <div className="text-center">
                    <Button
                      onClick={() => {
<<<<<<< HEAD
                        setBasicResult(null);
                        setTalentResult(null);
=======
                        setResult(null);
>>>>>>> 64956f79ec93423c1e4cf858f8428179b8715fe0
                        setBirthDate("");
                        setName("");
                        setCurrentThoughts("");
                        setFutureGoals("");
                        setSelectedCategory(null);
                      }}
                      variant="outline"
                      className="border-gold text-gold hover:bg-gold hover:text-white"
                    >
                      もう一度診断する
                    </Button>
                  </div>
                </div>
              );
            })()}
<<<<<<< HEAD

          {/* Diagnosis Log Table */}
          <Card className="mt-8 shadow-lg border-gold/30 bg-gradient-to-br from-white to-gold-light/10">
            <CardHeader>
              <CardTitle className="text-2xl gradient-text-gold text-center">
                診断履歴
              </CardTitle>
              <CardDescription className="text-center text-silver-dark">
                過去の診断結果を確認できます
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingLog ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold mx-auto mb-3"></div>
                  <p className="text-sm text-silver-dark">読み込み中...</p>
                </div>
              ) : diagnosisLog.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-silver-dark">診断履歴がありません</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-gold/30">
                        <th className="text-left py-3 px-4 text-gold font-semibold">名前</th>
                        <th className="text-left py-3 px-4 text-gold font-semibold">生年月日</th>
                        <th className="text-left py-3 px-4 text-gold font-semibold">診断日時</th>
                      </tr>
                    </thead>
                    <tbody>
                      {diagnosisLog.map((entry) => (
                        <tr
                          key={entry.id}
                          onClick={() => {
                            router.push(`/diagnosis/view?id=${entry.id}`);
                          }}
                          className="border-b border-gold/20 hover:bg-gold-light/20 cursor-pointer transition-colors"
                        >
                          <td className="py-3 px-4 text-silver-dark">{entry.name}</td>
                          <td className="py-3 px-4 text-silver-dark">{entry.birthDate}</td>
                          <td className="py-3 px-4 text-silver-dark">
                            {new Date(entry.createdAt).toLocaleString("ja-JP")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
=======
>>>>>>> 64956f79ec93423c1e4cf858f8428179b8715fe0
        </main>

        {/* フッター */}
        <footer className="border-t border-gold/30 bg-gradient-silver mt-12">
          <div className="container mx-auto px-4 py-8 text-center">
            <p className="text-silver-dark">
              © 2024 誕生日診断サイト - あなたの運命を知る旅
            </p>
            <p className="text-sm text-silver-dark mt-2">
              ※ この診断は娯楽目的です
            </p>
          </div>
        </footer>
      </div>
    </ProtectedRoute>
  );
};

export default BirthdayDiagnosis;
