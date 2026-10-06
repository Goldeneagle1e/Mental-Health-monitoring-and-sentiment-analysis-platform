export interface CrisisResource {
  name: string
  phone: string
  availability: string
  description: string
  sourceLabel: string
  sourceUrl: string
}

export interface TherapistDirectoryEntry {
  id: string
  name: string
  specialty: string
  city: string
  pincode: string
  mode: Array<"online" | "in-person">
  languages: string[]
  feeRange: string
  availability: string
}

export const crisisResourcesIndia: CrisisResource[] = [
  {
    name: "Tele-MANAS",
    phone: "14416 / 1800-89-14416",
    availability: "24/7",
    description: "Government-supported tele-mental health counselling available across India in multiple languages.",
    sourceLabel: "MoHFW National Mental Health Programme",
    sourceUrl: "https://www.dghs.mohfw.gov.in/national-mental-health-programme.php",
  },
  {
    name: "Vandrevala Foundation",
    phone: "+91 9999 666 555",
    availability: "24/7",
    description: "Free mental health counselling and crisis support by phone and WhatsApp.",
    sourceLabel: "Vandrevala Foundation",
    sourceUrl: "https://www.vandrevalafoundation.com/free-counseling",
  },
]

export const therapistDirectory: TherapistDirectoryEntry[] = [
  {
    id: "t1",
    name: "Dr. Rhea Mehta",
    specialty: "Stress, burnout, young adult counselling",
    city: "Mumbai",
    pincode: "400050",
    mode: ["online", "in-person"],
    languages: ["English", "Hindi", "Marathi"],
    feeRange: "INR 900 - 1200 / session",
    availability: "Mon-Sat, 10 AM - 7 PM",
  },
  {
    id: "t2",
    name: "Dr. Arjun Deshpande",
    specialty: "Anxiety, panic symptoms, work-related strain",
    city: "Mumbai",
    pincode: "400086",
    mode: ["online"],
    languages: ["English", "Hindi"],
    feeRange: "INR 800 - 1000 / session",
    availability: "Weekdays, 6 PM - 10 PM",
  },
  {
    id: "t3",
    name: "Ms. Kavya Nair",
    specialty: "Mood support, self-esteem, academic pressure",
    city: "Navi Mumbai",
    pincode: "400703",
    mode: ["online", "in-person"],
    languages: ["English", "Hindi", "Malayalam"],
    feeRange: "INR 700 - 950 / session",
    availability: "Tue-Sun, 11 AM - 8 PM",
  },
  {
    id: "t4",
    name: "Mr. Sameer Kulkarni",
    specialty: "Teen and college counselling, family stress",
    city: "Thane",
    pincode: "400601",
    mode: ["in-person"],
    languages: ["English", "Hindi", "Marathi"],
    feeRange: "INR 600 - 900 / session",
    availability: "Mon-Fri, 1 PM - 8 PM",
  },
]

export function buildSupportRecommendations(risk: "low" | "moderate" | "high") {
  if (risk === "high") {
    return [
      "Pause and reach out to a trusted person near you right now.",
      "Use an immediate support line if you feel overwhelmed or unsafe.",
      "Book a therapist session or in-person visit as soon as possible.",
    ]
  }
  if (risk === "moderate") {
    return [
      "Consider talking with someone you trust today.",
      "Schedule an online counselling session this week if the pattern persists.",
      "Reduce overload where possible and track changes in sleep, energy, and mood.",
    ]
  }
  return [
    "Keep checking in with your mood and routine.",
    "Use the survey baseline and analysis history to notice changes early.",
    "Reach out sooner rather than later if symptoms start increasing.",
  ]
}
