"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
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
import { LanguageSwitcher } from "@/components/language-switcher";
import { useTranslation } from "@/lib/i18n/hooks";
import {
  useBasicDiagnosis,
  useTalentDiagnosis,
  useDiagnosisList,
  useSaveDiagnosis,
  type DiagnosisResult,
} from "@/lib/hooks/use-diagnosis";

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

// Helper function to format date based on language
const formatDateByLanguage = (
  dateString: string,
  language: "en" | "jp"
): { yearMonth: string; day: string } => {
  if (!dateString) return { yearMonth: "", day: "" };

  try {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    if (language === "en") {
      // English format: "January 15, 2024"
      const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
      ];
      return {
        yearMonth: `${monthNames[date.getMonth()]} ${day}`,
        day: `, ${year}`,
      };
    } else {
      // Japanese format: "2024年01月15日"
      return {
        yearMonth: `${year}年${month}`,
        day: `月${day}日`,
      };
    }
  } catch (error) {
    return { yearMonth: "", day: "" };
  }
};

// Helper function to get image path for skin types (essential/attractive)
const getSkinImagePath = (skinType: string): string => {
  const imageMap: Record<string, string> = {
    職人肌: "/basic/職人肌.webp",
    平和肌: "/basic/平和肌.webp",
    親分肌: "/basic/親分肌.webp",
    コミュ肌: "/basic/コミュ肌.webp",
    赤ちゃん肌: "/basic/赤ちゃん肌.webp",
    多才肌: "/basic/多才肌.webp",
    スマート肌: "/basic/スマート肌.webp",
    ドリーム肌: "/basic/ドリーム肌.webp",
    ポジティブ肌: "/basic/ポジティブ肌.webp",
    姉御肌: "/basic/姉御肌.webp",
    天才肌: "/basic/天才肌.webp",
    オリジナル肌: "/basic/オリジナル肌.webp",
  };
  return imageMap[skinType] || "/basic/オリジナル肌.webp";
};

// Helper function to get image path for element combinations (valuable/problem)
const getElementImagePath = (element: string): string => {
  const imageMap: Record<string, string> = {
    金土: "/basic/金土.webp",
    銀金: "/basic/銀金.webp",
    金水: "/basic/金水.webp",
    金金: "/basic/金金.webp",
    銀土: "/basic/銀土.webp",
    銀水: "/basic/銀水.webp",
    金木: "/basic/金木.webp",
    銀火: "/basic/銀火.webp",
    銀木: "/basic/銀木.webp",
    金火: "/basic/金火.webp",
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
  sectionKey,
}: {
  iconPath: string | null;
  title: string;
  pdfPath?: string | null;
  sectionKey?: string;
}) => {
  const { t } = useTranslation();
  const handleClick = () => {
    if (pdfPath) {
      window.open(pdfPath, "_blank");
    }
  };

  return (
    <div className="relative mb-6">
      <div
        className="rounded-lg px-6 py-4 shadow-lg border border-silver/30"
        style={{
          background:
            "linear-gradient(to bottom, rgba(160, 160, 160, 0.7), rgba(240, 240, 240, 0.95), rgba(200, 200, 200, 0.75), rgba(160, 160, 160, 0.7))",
        }}
      >
        <div className="flex items-center justify-center relative gap-4">
          {iconPath && (
            <div
              className="flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={handleClick}
              title={pdfPath ? t("diagnosis.clickToOpenPdf") : ""}
            >
              <img
                src={iconPath}
                alt={title}
                className="w-16 h-16 md:w-20 md:h-20 object-contain"
              />
            </div>
          )}
          <div
            className={`flex-1 text-xl md:text-2xl font-bold text-silver-dark tracking-wide text-center ${
              !iconPath && pdfPath
                ? "cursor-pointer hover:opacity-80 transition-opacity"
                : ""
            } ${iconPath ? "min-w-0" : ""}`}
            onClick={!iconPath ? handleClick : undefined}
            title={!iconPath && pdfPath ? t("diagnosis.clickToOpenPdf") : ""}
          >
            {title}
          </div>
        </div>
      </div>
    </div>
  );
};

// DiagnosisLogEntry interface
interface DiagnosisLogEntry {
  id: string;
  name: string;
  birthDate: string;
  createdAt: string;
}

const BirthdayDiagnosis = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t, language } = useTranslation();
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [shouldFetchBasic, setShouldFetchBasic] = useState(false);
  const [currentThoughts, setCurrentThoughts] = useState("");
  const [futureGoals, setFutureGoals] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // React Query hooks
  const { data: diagnosisList, isLoading: isLoadingLog } = useDiagnosisList();
  const {
    data: basicResult,
    isLoading: isLoadingBasic,
    error: basicError,
  } = useBasicDiagnosis(birthDate || null, shouldFetchBasic);
  const {
    data: talentResult,
    isLoading: isLoadingTalent,
    error: talentError,
  } = useTalentDiagnosis(
    basicResult || null,
    shouldFetchBasic && !!basicResult
  );
  const saveDiagnosisMutation = useSaveDiagnosis();

  // Get query parameters on mount
  useEffect(() => {
    const nameParam = searchParams.get("name");
    const birthDateParam = searchParams.get("birthDate");
    const categoryParam = searchParams.get("category");

    if (nameParam) setName(nameParam);
    if (birthDateParam) setBirthDate(birthDateParam);
    if (categoryParam) setSelectedCategory(categoryParam);
  }, [searchParams]);

  // Auto-trigger diagnosis when params are set
  useEffect(() => {
    const nameParam = searchParams.get("name");
    const birthDateParam = searchParams.get("birthDate");

    if (
      nameParam &&
      birthDateParam &&
      name === nameParam &&
      birthDate === birthDateParam &&
      !shouldFetchBasic
    ) {
      const timer = setTimeout(() => {
        setShouldFetchBasic(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [name, birthDate, searchParams, shouldFetchBasic]);

  // Save diagnosis when both basic and talent are ready
  useEffect(() => {
    if (basicResult && talentResult && name && birthDate) {
      const combinedResult = {
        ...basicResult,
        ...talentResult,
      };
      saveDiagnosisMutation.mutate({
        name,
        birthDate,
        resultData: combinedResult,
      });
    }
  }, [basicResult, talentResult, name, birthDate]);

  // Show errors
  useEffect(() => {
    if (basicError || talentError) {
      const errorMessage =
        basicError?.message || talentError?.message || t("common.error");
      alert(`${t("common.error")}: ${errorMessage}`);
    }
  }, [basicError, talentError, t]);

  const handleDiagnosis = () => {
    if (!birthDate || !name) return;

    // Validate birth date
    const date = new Date(birthDate);
    if (isNaN(date.getTime())) {
      alert(t("diagnosis.validBirthDateRequired"));
      return;
    }
    if (date.getFullYear() < 1900) {
      alert(t("diagnosis.birthDateAfter1900"));
      return;
    }

    setShouldFetchBasic(true);
  };

  const isLoading = isLoadingBasic;
  const diagnosisLog = diagnosisList?.results || [];

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-silver-vertical">
        {/* ヘッダー */}
        <header className="relative z-50 border-b border-gold/30 bg-gradient-silver backdrop-blur-sm shadow-md">
          <div className="container mx-auto px-4 py-6">
            <div className="flex justify-between items-center mb-4">
              <Link href="/" className="text-gold hover:underline font-medium">
                {t("diagnosis.backToHome")}
              </Link>
              <div className="flex items-center gap-4">
                <LanguageSwitcher />
                <AuthButton />
              </div>
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gold mb-2">
                {t("diagnosis.title")}
              </h1>
              <h2 className="text-xl text-silver-dark">
                {t("diagnosis.subtitle")}
              </h2>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-12 max-w-4xl">
          {/* 入力フォームは表示しない - トップページからの入力のみ使用 */}
          {!name || !birthDate ? (
            <Card className="mb-8 shadow-lg border-gold/30 bg-gradient-to-br from-white to-gold-light/10">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl gradient-text-gold">
                  {t("diagnosis.missingInfo")}
                </CardTitle>
                <CardDescription className="text-silver-dark">
                  {t("diagnosis.missingInfoDescription")}
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <Link href="/">
                  <Button className="gradient-bg-gold text-white hover:opacity-90 border-0">
                    {t("diagnosis.backToHome")}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : isLoading ? (
            <Card className="mb-8 shadow-lg border-gold/30 bg-gradient-to-br from-white to-gold-light/10">
              <CardContent className="text-center py-12">
                <div className="flex flex-col items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-gold mb-4"></div>
                  <p className="text-lg text-silver-dark">
                    {t("diagnosis.loadingBasic")}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {/* 結果表示 */}
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
                        <SectionTitle
                          iconPath={getTextIconPath("talent")}
                          title={t("diagnosis.talent")}
                          pdfPath={getPdfPath("talent")}
                          sectionKey="talent"
                        />
                      </CardHeader>
                      <CardContent className="text-center py-8">
                        <div className="flex flex-col items-center justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold mb-3"></div>
                          <p className="text-sm text-silver-dark">
                            {t("common.loading")}
                          </p>
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
                      <SectionTitle
                        iconPath={getTextIconPath("talent")}
                        title="才能・能力"
                        pdfPath={getPdfPath("talent")}
                        sectionKey="talent"
                      />
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <h3 className="font-bold text-lg text-silver-dark">
                          {t("diagnosis.mainTalent")}
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
                          {t("diagnosis.valuableTalent")}
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
                      <div className="space-y-3">
                        <div className="text-center mb-4">
                          <h3 className="font-bold text-xl md:text-2xl text-gold mb-1 tracking-wide">
                            {t("diagnosis.energyCore")}
                          </h3>
                          <p className="text-xs text-silver-dark/70">{t("diagnosis.energyCoreSubtitle")}</p>
                        </div>
                        <div className="space-y-1.5">
                          {[
                            {
                              key: "action",
                              labelKey: "diagnosis.action",
                              value: result.energy_action,
                            },
                            {
                              key: "focus",
                              labelKey: "diagnosis.focus",
                              value: result.energy_focus,
                            },
                            {
                              key: "stamina",
                              labelKey: "diagnosis.stamina",
                              value: result.energy_stamina,
                            },
                            {
                              key: "creative",
                              labelKey: "diagnosis.creative",
                              value: result.energy_creative,
                            },
                            {
                              key: "influence",
                              labelKey: "diagnosis.influence",
                              value: result.energy_influence,
                            },
                            {
                              key: "emotional",
                              labelKey: "diagnosis.emotional",
                              value: result.energy_emotional,
                            },
                            {
                              key: "recovery",
                              labelKey: "diagnosis.recovery",
                              value: result.energy_recovery,
                            },
                            {
                              key: "intuition",
                              labelKey: "diagnosis.intuition",
                              value: result.energy_intuition,
                            },
                            {
                              key: "judgment",
                              labelKey: "diagnosis.judgment",
                              value: result.energy_judgment,
                            },
                            {
                              key: "adaptability",
                              labelKey: "diagnosis.adaptability",
                              value: result.energy_adaptability,
                            },
                            {
                              key: "total",
                              labelKey: "diagnosis.total",
                              value: result.energy_total,
                            },
                          ].map(({ key, labelKey, value }) => {
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
                                    {t(labelKey)}
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
                        title={t("diagnosis.beautyThreeSource")}
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

              const renderWorkSection = () => (
                <Card
                  key="work"
                  className="shadow-lg border-gold/30 bg-gradient-to-br from-white to-gold-light/10"
                >
                  <CardHeader>
                    <SectionTitle
                      iconPath={getTextIconPath("work")}
                      title={t("diagnosis.work")}
                      pdfPath={getPdfPath("work")}
                      sectionKey="work"
                    />
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-gold-light/20 p-4 rounded-lg border border-gold/30">
                      <div className="font-semibold text-gold mb-2">
                        {t("diagnosis.recommended")}
                      </div>
                      <div className="text-silver-dark">
                        {formatTextWithLineBreaks(result.work_recommend)}
                      </div>
                    </div>
                    <div className="bg-silver-light/20 p-4 rounded-lg border border-silver/30">
                      <div className="font-semibold text-silver-dark mb-2">
                        {t("diagnosis.tenConcepts")}
                      </div>
                      <div className="text-silver-dark">
                        {formatTextWithLineBreaks(result.work_tenConcept)}
                      </div>
                    </div>
                    <div className="bg-gold-light/20 p-4 rounded-lg border border-gold/30">
                      <div className="font-semibold text-gold mb-2">
                        {t("diagnosis.workContent")}
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
                    <SectionTitle
                      iconPath={getTextIconPath("like")}
                      title={t("diagnosis.like")}
                      pdfPath={getPdfPath("like")}
                      sectionKey="like"
                    />
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
                    <SectionTitle
                      iconPath={getTextIconPath("impressive")}
                      title={t("diagnosis.impressive")}
                      pdfPath={getPdfPath("impressive")}
                      sectionKey="impressive"
                    />
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
                          {t("diagnosis.likeDislike")}
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
                    <SectionTitle
                      iconPath={getTextIconPath("affair")}
                      title={t("diagnosis.affair")}
                      pdfPath={getPdfPath("affair")}
                      sectionKey="affair"
                    />
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
                    <SectionTitle
                      iconPath={getTextIconPath("marriage")}
                      title={t("diagnosis.marriage")}
                      pdfPath={getPdfPath("marriage")}
                      sectionKey="marriage"
                    />
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
                    <SectionTitle
                      iconPath={getTextIconPath("stress")}
                      title={t("diagnosis.stress")}
                      pdfPath={getPdfPath("stress")}
                      sectionKey="stress"
                    />
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="bg-gold-light/20 p-4 rounded-lg border border-gold/30">
                        <div className="font-semibold text-gold mb-2">
                          {t("diagnosis.plus")}
                        </div>
                        <div className="text-silver-dark">
                          {formatTextWithLineBreaks(result.stress_plus)}
                        </div>
                      </div>
                      <div className="bg-silver-light/20 p-4 rounded-lg border border-silver/30">
                        <div className="font-semibold text-silver-dark mb-2">
                          {t("diagnosis.minus")}
                        </div>
                        <div className="text-silver-dark">
                          {formatTextWithLineBreaks(result.stress_minus)}
                        </div>
                      </div>
                      <div className="bg-gold-light/20 p-4 rounded-lg border border-gold/30">
                        <div className="font-semibold text-gold mb-2">
                          {t("diagnosis.fiveGrowth")}
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
                    <SectionTitle
                      iconPath={getTextIconPath("faceMuscle")}
                      title={t("diagnosis.faceMuscle")}
                      pdfPath={getPdfPath("faceMuscle")}
                      sectionKey="faceMuscle"
                    />
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
                    <SectionTitle
                      iconPath={getTextIconPath("attractiveValuable")}
                      title={t("diagnosis.attractiveValuable")}
                      pdfPath={getPdfPath("attractiveValuable")}
                      sectionKey="attractiveValuable"
                    />
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-silver-light/20 p-4 rounded-lg border border-silver/30">
                      <div className="font-semibold text-silver-dark mb-2">
                        {formatTextWithLineBreaks(
                          result.attractiveValuable_title
                        )}
                      </div>
                      <div className="text-silver-dark mt-2">
                        {formatTextWithLineBreaks(
                          result.attractiveValuable_content
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );

              // Order sections based on selected category
              // Talent section always shows (with loading state if needed)
              // Other sections only show when talent data is available
              const allSections = [
                { key: "talent", render: renderTalentSection },
                ...(talentResult
                  ? [
                      {
                        key: "beautyThreeSource",
                        render: renderBeautyThreeSourceSection,
                      },
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
              ];

              // Reorder: selected category first, then others
              const orderedSections = selectedCategory
                ? [
                    ...allSections.filter((s) => s.key === selectedCategory),
                    ...allSections.filter((s) => s.key !== selectedCategory),
                  ]
                : allSections;

              // Format date for display
              const formattedDate = formatDateByLanguage(birthDate, language);

              return (
                <div className="space-y-8 animate-in fade-in duration-700">
                  {/* 名前と生年月日表示 */}
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
                          {t("diagnosis.name")}
                        </span>
                        <span className="text-lg text-silver-dark font-semibold">
                          {name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 md:gap-3 flex-shrink md:flex-shrink-0">
                        <span className="text-lg text-gray-400 font-medium whitespace-nowrap">
                          {t("diagnosis.birthDate")}
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

                  {/* 基本診断結果 */}
                  <div className="space-y-6">
                    {/* Outer Section */}
                    <div>
                      <div className="mb-4">
                        <h3 className="text-3xl font-bold text-silver-dark text-center">{t("diagnosis.outer")}</h3>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        {/* 本質肌 - main-outer */}
                        <Card className="relative overflow-hidden border-0 bg-white rounded-lg py-0 gap-2">
                          <div className="text-lg text-center font-bold text-silver-dark mb-1">{t("diagnosis.mainOuter")}</div>
                          <div className="flex flex-col items-center justify-center">
                            <div className="relative flex flex-col w-full items-center justify-center">
                              <div className="text-lg text-silver-dark font-bold">{t("diagnosis.essentialSkin")}</div>
                              <div className="text-2xl font-belanosima text-gold px-1 rounded-md absolute bottom-0 left-0">50%</div>                            
                            </div>

                            <div className="text-xs text-silver-dark my-1">
                              {t("diagnosis.essentialDescription")}
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
                          <div className="text-lg text-center font-bold text-silver-dark mb-1">{t("diagnosis.surfaceOuter")}</div>
                          <div className="flex flex-col items-center justify-center">
                            <div className="relative flex flex-col w-full items-center justify-center">
                              <div className="text-lg text-silver-dark font-bold">{t("diagnosis.attractiveSkin")}</div>
                              <div className="text-2xl font-belanosima text-gold px-1 rounded-md absolute bottom-0 left-0">20%</div>
                            </div>
                            <div className="text-xs text-silver-dark my-1">
                              {t("diagnosis.attractiveDescription")}
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
                        <h3 className="text-3xl font-bold text-silver-dark">{t("diagnosis.inner")}</h3>
                      </div>
                    </div>

                    {/* Inner Section */}
                    <div>
                      <div className="grid grid-cols-2 gap-4">
                        {/* 価値肌 - open inner */}
                        <Card className="relative border-0 bg-white rounded-lg py-0 gap-2">
                          <div className="flex flex-col items-center justify-center">
                            <div className="text-lg text-center font-bold text-silver-dark mb-1">{t("diagnosis.openInner")}</div>
                          </div>
                          <div className="relative">
                            <div className="text-2xl font-belanosima text-gold px-1 rounded-md absolute top-0 -left-0 z-10">20%</div>
                            <div className="relative md:h-64 h-32 flex items-center justify-center mt-6">
                              <img
                                src={getElementImagePath(result.valuable_lb)}
                                alt={result.valuable_lb}
                                className="w-full h-full object-contain"
                              />
                            </div>
                          </div>
                          <div className="p-5 pt-0 flex flex-col justify-center items-center">
                            <div className="text-lg text-silver-dark font-bold">{t("diagnosis.valuableSkin")}</div>
                            <div className="text-xs text-silver-dark mb-1 text-center leading-relaxed">
                              {t("diagnosis.valuableDescription")}
                            </div>
                            <div className="text-xs text-silver-dark space-y-0.5 md:block hidden">
                              <div>{t("diagnosis.valuableDescription2")}</div>
                              <div>{t("diagnosis.valuableDescription3")}</div>
                            </div>
                          </div>
                        </Card>

                        {/* トラブル肌 - hide inner */}
                        <Card className="relative border-0 bg-white rounded-lg py-0 gap-2">
                          <div className="flex flex-col items-center justify-center">
                            <div className="text-lg text-center font-bold text-silver-dark mb-1">{t("diagnosis.hideInner")}</div>
                          </div>
                          <div className="relative">
                            <div className="text-2xl font-belanosima text-gold px-1 rounded-md absolute top-0 -left-0 z-10">10%</div>
                            <div className="relative md:h-64 h-32 flex items-center justify-center mt-6">
                              <img
                                src={getElementImagePath(result.problem_lb)}
                                alt={result.problem_lb}
                                className="w-full h-full object-contain"
                              />
                            </div>
                          </div>
                          <div className="p-5 pt-0 flex flex-col justify-center items-center">
                            <div className="text-lg text-silver-dark font-bold">{t("diagnosis.deepSkin")}</div>
                            <div className="text-xs text-silver-dark mb-1 text-center leading-relaxed">
                              {t("diagnosis.deepDescription")}
                            </div>
                            <div className="text-xs text-silver-dark mb-1 text-center leading-relaxed">
                              {t("diagnosis.deepDescription2")}
                            </div>
                            <div className="text-xs text-silver-dark space-y-0.5 md:block hidden">
                              <div>{t("diagnosis.deepDescription3")}</div>
                              <div>{t("diagnosis.deepDescription4")}</div>
                              <div className="font-semibold">{t("diagnosis.deepDescription5")}</div>
                            </div>
                          </div>
                        </Card>
                      </div>
                    </div>
                  </div>

                  {/* Render sections in order */}
                  {orderedSections.map((section) => section.render())}

                  {/* 個人の感想セクション */}
                  {/* <div className="space-y-4">
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
                  </div> */}

                  <div className="text-center">
                    <Button
                      onClick={() => {
                        setShouldFetchBasic(false);
                        setBirthDate("");
                        setName("");
                        setCurrentThoughts("");
                        setFutureGoals("");
                        setSelectedCategory(null);
                      }}
                      variant="outline"
                      className="border-gold text-gold hover:bg-gold hover:text-white"
                    >
                      {t("diagnosis.diagnoseAgain")}
                    </Button>
                  </div>
                </div>
              );
            })()}

          {/* Diagnosis Log Table */}
          <Card className="mt-8 shadow-lg border-gold/30 bg-gradient-to-br from-white to-gold-light/10">
            <CardHeader>
              <CardTitle className="text-2xl gradient-text-gold text-center">
                {t("diagnosis.diagnosisHistory")}
              </CardTitle>
              <CardDescription className="text-center text-silver-dark">
                {t("diagnosis.historyDescription")}
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
                  <p className="text-silver-dark">{t("diagnosis.noHistory")}</p>
                </div>
              ) : (
                <div className="overflow-x-auto overflow-y-auto max-h-96">
                  <table className="w-full border-collapse">
                    <thead className="sticky top-0 bg-gradient-to-br from-white to-gold-light/10 z-10">
                      <tr className="border-b border-gold/30">
                        <th className="text-left py-3 px-4 text-gold font-semibold">
                          {t("diagnosis.name")}
                        </th>
                        <th className="text-left py-3 px-4 text-gold font-semibold">
                          {t("diagnosis.birthDate")}
                        </th>
                        <th className="text-left py-3 px-4 text-gold font-semibold">
                          {t("diagnosis.diagnosisDate")}
                        </th>
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
                          <td className="py-3 px-4 text-silver-dark">
                            {entry.name}
                          </td>
                          <td className="py-3 px-4 text-silver-dark">
                            {entry.birthDate}
                          </td>
                          <td className="py-3 px-4 text-silver-dark">
                            {new Date(entry.createdAt).toLocaleString(language === "en" ? "en-US" : "ja-JP")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default BirthdayDiagnosis;
