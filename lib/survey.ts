import type { BaselineAssessment, RiskLevel, SurveyAnswerValue } from "@/lib/user-profile"

export interface SurveyQuestion {
  id: string
  prompt: string
  domain: "depression" | "anxiety" | "stress"
}

export const surveyOptions: Array<{ label: string; value: SurveyAnswerValue }> = [
  { label: "Never", value: 0 },
  { label: "Several days", value: 1 },
  { label: "More than half the days", value: 2 },
  { label: "Nearly every day", value: 3 },
]

export const onboardingSurveyQuestions: SurveyQuestion[] = [
  { id: "mood_1", domain: "depression", prompt: "How often have you felt little interest or pleasure in doing things recently?" },
  { id: "mood_2", domain: "depression", prompt: "How often have you felt down, hopeless, or emotionally drained?" },
  { id: "mood_3", domain: "depression", prompt: "How often have you felt tired even after getting some rest?" },
  { id: "mood_4", domain: "depression", prompt: "How often have you been overly harsh on yourself or felt like you are letting people down?" },
  { id: "anxiety_1", domain: "anxiety", prompt: "How often have you felt constantly worried or unable to stop worrying?" },
  { id: "anxiety_2", domain: "anxiety", prompt: "How often have you found it difficult to relax, even when you had the chance?" },
  { id: "anxiety_3", domain: "anxiety", prompt: "How often have you felt on edge, restless, or unable to sit still?" },
  { id: "anxiety_4", domain: "anxiety", prompt: "How often have you felt overwhelmed by situations that normally feel manageable?" },
  { id: "stress_1", domain: "stress", prompt: "How often have deadlines, workload, or responsibilities left you feeling pressured?" },
  { id: "stress_2", domain: "stress", prompt: "How often has stress affected your sleep or daily routine?" },
  { id: "stress_3", domain: "stress", prompt: "How often have you felt easily irritated or frustrated lately?" },
  { id: "stress_4", domain: "stress", prompt: "How often have you felt that you are coping, but only just barely?" },
]

function classifyScore(score: number): RiskLevel {
  if (score >= 10) return "high"
  if (score >= 5) return "moderate"
  return "low"
}

export function buildAssessment(answers: SurveyAnswerValue[]): BaselineAssessment {
  const depressionScore = answers
    .filter((_, index) => onboardingSurveyQuestions[index]?.domain === "depression")
    .reduce<number>((sum, value) => sum + value, 0)
  const anxietyScore = answers
    .filter((_, index) => onboardingSurveyQuestions[index]?.domain === "anxiety")
    .reduce<number>((sum, value) => sum + value, 0)
  const stressScore = answers
    .filter((_, index) => onboardingSurveyQuestions[index]?.domain === "stress")
    .reduce<number>((sum, value) => sum + value, 0)

  const domainRisks = [classifyScore(depressionScore), classifyScore(anxietyScore), classifyScore(stressScore)]
  const overallRisk: RiskLevel = domainRisks.includes("high")
    ? "high"
    : domainRisks.includes("moderate")
      ? "moderate"
      : "low"

  const needsUrgentSupport =
    overallRisk === "high" || answers.slice(0, 8).some((value) => value === 3)

  let summary = "Your responses suggest a relatively steady baseline right now."
  if (overallRisk === "moderate") {
    summary = "Your responses suggest elevated stress or emotional strain. Supportive habits and early help would be worthwhile."
  }
  if (overallRisk === "high") {
    summary = "Your responses suggest significant emotional strain. We recommend immediate support options alongside the content analysis tools."
  }

  return {
    overallRisk,
    stressScore: Math.round((stressScore / 12) * 100),
    anxietyScore: Math.round((anxietyScore / 12) * 100),
    depressionScore: Math.round((depressionScore / 12) * 100),
    needsUrgentSupport,
    summary,
  }
}
