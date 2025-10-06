import { type NextRequest, NextResponse } from "next/server"

// Mapping for essential/attractive values (skin types)
const essentialAttractiveMapping = {
  "R": "職人肌",
  "G": "平和肌",
  "I": "親分肌",
  "B": "コミュ肌",
  "YG": "赤ちゃん肌",
  "O": "多才肌",
  "Y": "スマート肌",
  "M": "ドリーム肌",
  "RO": "ポジティブ肌",
  "BG": "姉御肌",
  "P": "天才肌",
  "T": "オリジナル肌"
}

// Mapping for valuable/problem values (element combinations)
const valuableProblemMapping = {
  "E+": "金土",
  "M-": "銀金", 
  "W+": "金水",
  "M+": "金金",
  "E-": "銀土",
  "W-": "銀水",
  "T+": "金木",
  "F-": "銀火",
  "T-": "銀木",
  "F+": "金火"
}

export async function POST(request: NextRequest) {
  try {
    const { birthDate } = await request.json()

    if (!birthDate) {
      return NextResponse.json({ error: "Birth date is required" }, { status: 400 })
    }

    console.log("[main] API route called with birthDate:", birthDate)

    // Call the basic diagnosis route
    const basicResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/sheets/basic`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ birthDate }),
    })

    if (!basicResponse.ok) {
      console.error("[main] Basic route failed:", basicResponse.status, basicResponse.statusText)
      return NextResponse.json({ error: "Failed to fetch basic diagnosis data" }, { status: 500 })
    }

    const basicData = await basicResponse.json()
    console.log("[main] Basic data received:", basicData)

    // Create _lb variables using the mappings
    const essential_lb = essentialAttractiveMapping[basicData.essential as keyof typeof essentialAttractiveMapping] || basicData.essential
    const attractive_lb = essentialAttractiveMapping[basicData.attractive as keyof typeof essentialAttractiveMapping] || basicData.attractive
    const valuable_lb = valuableProblemMapping[basicData.valuable as keyof typeof valuableProblemMapping] || basicData.valuable
    const problem_lb = valuableProblemMapping[basicData.problem as keyof typeof valuableProblemMapping] || basicData.problem
    
    console.log("[main] Mapping results:")
    console.log("[main] essential:", basicData.essential, "-> essential_lb:", essential_lb)
    console.log("[main] attractive:", basicData.attractive, "-> attractive_lb:", attractive_lb)
    console.log("[main] valuable:", basicData.valuable, "-> valuable_lb:", valuable_lb)
    console.log("[main] problem:", basicData.problem, "-> problem_lb:", problem_lb)
    
    // Check if mappings are working correctly
    if (essential_lb === basicData.essential) {
      console.log("[main] WARNING: essential mapping failed for:", basicData.essential)
    }
    if (attractive_lb === basicData.attractive) {
      console.log("[main] WARNING: attractive mapping failed for:", basicData.attractive)
    }
    if (valuable_lb === basicData.valuable) {
      console.log("[main] WARNING: valuable mapping failed for:", basicData.valuable)
    }
    if (problem_lb === basicData.problem) {
      console.log("[main] WARNING: problem mapping failed for:", basicData.problem)
    }
    
    // Call the talent route
    const talentResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/sheets/talent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        essential_lb, 
        valuable_lb, 
        attractive_lb, 
        problem_lb 
      }),
    })

    if (!talentResponse.ok) {
      console.error("[main] Talent route failed:", talentResponse.status, talentResponse.statusText)
      return NextResponse.json({ error: "Failed to fetch talent data" }, { status: 500 })
    }

    const talentData = await talentResponse.json()
    console.log("[main] Talent data received:", talentData)
    console.log("[main] Returning combined diagnosis results")

    return NextResponse.json({
      // Basic diagnosis results
      essential: basicData.essential,
      essential_lb,
      attractive: basicData.attractive,
      attractive_lb,
      valuable: basicData.valuable,
      valuable_lb,
      problem: basicData.problem,
      problem_lb,
      
      // Talent section
      talent_title: talentData.talent_title,
      talent_subtitle: talentData.talent_subtitle,
      talent_content: talentData.talent_content,
      talent_additionalTitle: talentData.talent_additionalTitle,
      talent_additionalContent: talentData.talent_additionalContent,
      talent_valuableTitle: talentData.talent_valuableTitle,
      talent_valuableSubtitle: talentData.talent_valuableSubtitle,
      
      // Energy score
      energy_action: talentData.energy_action,
      energy_focus: talentData.energy_focus,
      energy_stamina: talentData.energy_stamina,
      energy_creative: talentData.energy_creative,
      energy_influence: talentData.energy_influence,
      energy_emotional: talentData.energy_emotional,
      energy_recovery: talentData.energy_recovery,
      energy_intuition: talentData.energy_intuition,
      energy_judgment: talentData.energy_judgment,
      energy_adaptability: talentData.energy_adaptability,
      energy_total: talentData.energy_total,
      
      // Work section
      work_recommend: talentData.work_recommend,
      work_tenConcept: talentData.work_tenConcept,
      work_workContent: talentData.work_workContent,
      
      // Like section
      like_title: talentData.like_title,
      like_subtitle: talentData.like_subtitle,
      like_content: talentData.like_content,
      
      // Impressive section
      impressive_title: talentData.impressive_title,
      impressive_subtitle: talentData.impressive_subtitle,
      impressive_strong: talentData.impressive_strong,
      impressive_likeDislike: talentData.impressive_likeDislike,
      
      // Love affair section
      loveAffair_content: talentData.loveAffair_content,
      
      // Marriage section
      marriage_content: talentData.marriage_content,
      
      // Stress section
      stress_plus: talentData.stress_plus,
      stress_minus: talentData.stress_minus,
      stress_fiveGrowth: talentData.stress_fiveGrowth,
    })
  } catch (error) {
    console.error("[main] API route error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
