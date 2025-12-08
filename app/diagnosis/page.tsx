"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
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
}

const BirthdayDiagnosis = () => {
  const searchParams = useSearchParams();
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [result, setResult] = useState<DiagnosisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentThoughts, setCurrentThoughts] = useState("");
  const [futureGoals, setFutureGoals] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

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
      !result &&
      !isLoading
    ) {
      // Use a ref or state to prevent multiple calls
      const timer = setTimeout(() => {
        handleDiagnosis();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [name, birthDate, searchParams]);

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
    setResult(null); // Clear previous results

    try {
      console.log("[frontend] Starting diagnosis for:", name, birthDate);

      // Step 1: Fetch basic diagnosis data
      console.log("[frontend] Fetching basic diagnosis data...");
      const basicResponse = await fetch("/api/sheets/basic", {
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

      // Step 2: Fetch talent data using the mapped values from basic data
      console.log("[frontend] Fetching talent data...");
      const talentResponse = await fetch("/api/sheets/talent", {
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

      // Step 3: Combine both results
      const combinedData: DiagnosisResult = {
        ...basicData,
        ...talentData,
      };

      console.log("[frontend] Combined diagnosis data:", combinedData);
      setResult(combinedData);
    } catch (error) {
      console.error("[frontend] Diagnosis error:", error);
      alert(
        `診断中にエラーが発生しました: ${
          error instanceof Error ? error.message : "不明なエラー"
        }`
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-silver-vertical">
        {/* ヘッダー */}
        <header className="border-b border-gold/30 bg-gradient-silver backdrop-blur-sm shadow-md">
          <div className="container mx-auto px-4 py-6">
            <div className="flex justify-between items-center">
              <Link href="/" className="text-gold hover:underline font-medium">
                ← トップページに戻る
              </Link>
              <AuthButton />
            </div>
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
                  <p className="text-lg text-silver-dark">診断中...</p>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {/* 結果表示 */}
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
                            )}
                          </div>
                        </div>
                      </div>
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

              const renderWorkSection = () => (
                <Card
                  key="work"
                  className="shadow-lg border-gold/30 bg-gradient-to-br from-white to-gold-light/10"
                >
                  <CardHeader>
                    <CardTitle className="text-2xl text-center text-gold">
                      💼 仕事・キャリア
                    </CardTitle>
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
                    <CardTitle className="text-2xl text-center text-silver-dark">
                      ❤️ 好きなもの
                    </CardTitle>
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
                    <CardTitle className="text-2xl text-center text-gold">
                      ✨ 印象・魅力
                    </CardTitle>
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
                    <CardTitle className="text-xl text-center text-gold">
                      💕 恋愛
                    </CardTitle>
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
                    <CardTitle className="text-xl text-center text-silver-dark">
                      💍 結婚・離婚
                    </CardTitle>
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
                    <CardTitle className="text-2xl text-center text-gold">
                      😰 ストレス・成長
                    </CardTitle>
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

              // Order sections based on selected category
              const allSections = [
                { key: "talent", render: renderTalentSection },
                { key: "work", render: renderWorkSection },
                { key: "like", render: renderLikeSection },
                { key: "impressive", render: renderImpressiveSection },
                { key: "affair", render: renderAffairSection },
                { key: "marriage", render: renderMarriageSection },
                { key: "stress", render: renderStressSection },
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
                    </Card>
                  </div>

                  {/* Render sections in order */}
                  {orderedSections.map((section) => section.render())}

                  {/* 個人の感想セクション */}
                  <div className="space-y-4">
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
                  </div>

                  <div className="text-center">
                    <Button
                      onClick={() => {
                        setResult(null);
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
