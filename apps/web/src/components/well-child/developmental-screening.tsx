// src/components/well-child/developmental-screening.tsx

import { Badge } from "@clinic-app/ui/components/badge";
import { Button } from "@clinic-app/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@clinic-app/ui/components/card";
import { Label } from "@clinic-app/ui/components/label";
import { Progress } from "@clinic-app/ui/components/progress";
import {
  RadioGroup,
  RadioGroupItem,
} from "@clinic-app/ui/components/radio-group";
import { Skeleton } from "@clinic-app/ui/components/skeleton";
import { calculateAge } from "@clinic-app/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ChevronRight,
  ClipboardCheck,
  ThumbsUp,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { orpc } from "@/utils/orpc";

interface DevelopmentalScreeningProps {
  patientId: string;
}

const screeningTools = [
  {
    id: "asq-3",
    name: "Ages & Stages Questionnaire (ASQ-3)",
    description: "Developmental screening for children 1-66 months",
    ageRange: "1-66 months",
    duration: "10-15 minutes",
  },
  {
    id: "mchat",
    name: "M-CHAT",
    description: "Autism screening for toddlers 16-30 months",
    ageRange: "16-30 months",
    duration: "5-10 minutes",
  },
  {
    id: "pediatric-symptoms",
    name: "Pediatric Symptom Checklist",
    description: "Behavioral and emotional screening",
    ageRange: "4-18 years",
    duration: "5-10 minutes",
  },
];

const asqQuestions = [
  {
    id: 1,
    category: "Communication",
    question: "Does your child point to objects or pictures when you ask?",
    options: ["Yes", "Sometimes", "Not Yet"],
  },
  {
    id: 2,
    category: "Communication",
    question: "Does your child use words to ask for things?",
    options: ["Yes", "Sometimes", "Not Yet"],
  },
  {
    id: 3,
    category: "Gross Motor",
    question: "Can your child walk up stairs with help?",
    options: ["Yes", "Sometimes", "Not Yet"],
  },
  {
    id: 4,
    category: "Gross Motor",
    question: "Does your child jump with both feet off the ground?",
    options: ["Yes", "Sometimes", "Not Yet"],
  },
  {
    id: 5,
    category: "Fine Motor",
    question: "Can your child draw a circle?",
    options: ["Yes", "Sometimes", "Not Yet"],
  },
  {
    id: 6,
    category: "Fine Motor",
    question: "Does your child use child-safe scissors?",
    options: ["Yes", "Sometimes", "Not Yet"],
  },
  {
    id: 7,
    category: "Problem Solving",
    question: "Can your child complete a simple puzzle?",
    options: ["Yes", "Sometimes", "Not Yet"],
  },
  {
    id: 8,
    category: "Problem Solving",
    question: "Does your child understand concepts like 'big' and 'small'?",
    options: ["Yes", "Sometimes", "Not Yet"],
  },
  {
    id: 9,
    category: "Personal-Social",
    question: "Does your child play with other children?",
    options: ["Yes", "Sometimes", "Not Yet"],
  },
  {
    id: 10,
    category: "Personal-Social",
    question: "Does your child help with simple household tasks?",
    options: ["Yes", "Sometimes", "Not Yet"],
  },
];

// interface PreviousScreening {
//   id: string;
//   tool: string;
//   date: string | Date;
//   score: number;
//   riskLevel: string;
//   screeningType: string;
// }

export function DevelopmentalScreening({
  patientId,
}: DevelopmentalScreeningProps) {
  const queryClient = useQueryClient();
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showResults, setShowResults] = useState(false);

  const { data: patient, isLoading: patientLoading } = useQuery(
    orpc.patient.get.queryOptions({ input: { id: patientId } }),
  );

  const { data: previousScreenings } = useQuery(
    orpc.growth.getDevelopmentalScreenings.queryOptions({
      input: { patientId },
    }),
  );

  const submitScreening = useMutation(
    orpc.growth.submitScreening.mutationOptions({
      onSuccess: () => {
        toast.success("Screening completed successfully");
        queryClient.invalidateQueries({
          queryKey: ["developmental-screenings", patientId],
        });
        setShowResults(true);
      },
      onError: (error) => {
        toast.error("Failed to submit screening");
        console.error(error);
      },
    }),
  );

  const handleAnswer = (questionId: number, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const calculateScore = () => {
    let total = 0;
    Object.values(answers).forEach((answer) => {
      if (answer === "Yes") total += 10;
      else if (answer === "Sometimes") total += 5;
      else total += 0;
    });
    return (total / (Object.keys(answers).length * 10)) * 100;
  };

  const getRiskLevel = (score: number) => {
    if (score >= 80)
      return { level: "Low Risk", color: "text-green-600", bg: "bg-green-100" };
    if (score >= 60)
      return {
        level: "Moderate Risk",
        color: "text-yellow-600",
        bg: "bg-yellow-100",
      };
    return { level: "High Risk", color: "text-red-600", bg: "bg-red-100" };
  };

  const handleSubmit = () => {
    // const score = calculateScore();
    // const riskLevel = getRiskLevel(score);
    submitScreening.mutate({
      patientId,
      checkDate: new Date(),
      ageMonths: calculateAge(),
      motorSkills: answers[3] || "Not Yet",
      languageSkills: answers[1] || "Not Yet",
      socialSkills: answers[9] || "Not Yet",
      cognitiveSkills: answers[7] || "Not Yet",
      notes: "",
    });
  };

  const resetScreening = () => {
    setSelectedTool(null);
    setAnswers({});
    setShowResults(false);
  };

  if (patientLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!selectedTool) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Developmental Screening Tools</CardTitle>
            <CardDescription>
              Select a validated screening tool for {patient?.firstName}{" "}
              {patient?.lastName}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {screeningTools.map((tool) => (
                <button
                  type="button"
                  key={tool.id}
                  onClick={() => setSelectedTool(tool.id)}
                  className="rounded-lg border p-4 text-left transition hover:shadow-md"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <ClipboardCheck className="h-6 w-6 text-blue-500" />
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <h3 className="mb-1 font-semibold">{tool.name}</h3>
                  <p className="text-muted-foreground text-sm">
                    {tool.description}
                  </p>
                  <div className="mt-3 flex gap-2">
                    <Badge variant="outline" className="text-xs">
                      {tool.ageRange}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {tool.duration}
                    </Badge>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Previous Screenings */}
        {previousScreenings && previousScreenings.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Previous Screenings</CardTitle>
              <CardDescription>
                Review past developmental assessments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {previousScreenings.map((screening) => (
                  <div
                    key={screening.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <p className="font-medium">Developmental Screening</p>
                      <p className="text-muted-foreground text-sm">
                        {new Date(screening.checkDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {/* Note: score is calculated on the fly as it's not in the DB schema */}
                      <span className="font-medium text-xs">
                        Score:{" "}
                        {Math.round(
                          (((screening.motorSkills === "Yes"
                            ? 10
                            : screening.motorSkills === "Sometimes"
                              ? 5
                              : 0) +
                            (screening.languageSkills === "Yes"
                              ? 10
                              : screening.languageSkills === "Sometimes"
                                ? 5
                                : 0) +
                            (screening.socialSkills === "Yes"
                              ? 10
                              : screening.socialSkills === "Sometimes"
                                ? 5
                                : 0) +
                            (screening.cognitiveSkills === "Yes"
                              ? 10
                              : screening.cognitiveSkills === "Sometimes"
                                ? 5
                                : 0)) /
                            40) *
                            100,
                        )}
                        %
                      </span>
                      <Badge
                        variant={
                          screening.concerns === "Low Risk"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {screening.concerns || "Completed"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  if (showResults) {
    const score = calculateScore();
    const risk = getRiskLevel(score);
    return (
      <Card>
        <CardHeader>
          <CardTitle>Screening Results</CardTitle>
          <CardDescription>
            Developmental screening completed on{" "}
            {new Date().toLocaleDateString()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center">
            <div className={`inline-flex rounded-full p-4 ${risk.bg} mb-4`}>
              {risk.level === "Low Risk" ? (
                <ThumbsUp className={`h-12 w-12 ${risk.color}`} />
              ) : (
                <AlertTriangle className={`h-12 w-12 ${risk.color}`} />
              )}
            </div>
            <h2 className="mb-2 font-bold text-2xl">{risk.level}</h2>
            <p className="mb-4 text-muted-foreground">
              Overall Score: {Math.round(score)}%
            </p>
            <Progress value={score} className="mx-auto mb-6 h-2 max-w-md" />
            <div className="mx-auto max-w-md space-y-4 text-left">
              {risk.level === "Low Risk" && (
                <div className="rounded-lg bg-green-50 p-4">
                  <p className="text-green-800">
                    Your child is meeting developmental milestones appropriate
                    for their age. Continue with regular well-child visits and
                    monitoring.
                  </p>
                </div>
              )}
              {risk.level === "Moderate Risk" && (
                <div className="rounded-lg bg-yellow-50 p-4">
                  <p className="text-yellow-800">
                    Some areas of development may need additional attention.
                    Consider discussing these results with your pediatrician and
                    implementing recommended activities.
                  </p>
                </div>
              )}
              {risk.level === "High Risk" && (
                <div className="rounded-lg bg-red-50 p-4">
                  <p className="text-red-800">
                    The screening indicates potential developmental concerns.
                    Please schedule a follow-up appointment with your
                    pediatrician for further evaluation and early intervention
                    services if needed.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 flex justify-center gap-4">
            <Button variant="outline" onClick={resetScreening}>
              Start New Screening
            </Button>
            <Button onClick={() => window.print()}>Download Report</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const answeredCount = Object.keys(answers).length;
  const totalQuestions = asqQuestions.length;
  const progress = (answeredCount / totalQuestions) * 100;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>ASQ-3 Developmental Screening</CardTitle>
            <CardDescription>
              Complete all questions to assess your child's development
            </CardDescription>
          </div>
          <div className="text-right">
            <p className="text-muted-foreground text-sm">Progress</p>
            <p className="font-bold text-2xl">
              {answeredCount}/{totalQuestions}
            </p>
            <Progress value={progress} className="mt-1 h-1 w-32" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {asqQuestions.map((q) => (
            <div key={q.id} className="rounded-lg border p-4">
              <div className="mb-3">
                <Badge variant="outline" className="mb-2">
                  {q.category}
                </Badge>
                <p className="font-medium">{q.question}</p>
              </div>
              <RadioGroup
                value={answers[q.id] || ""}
                onValueChange={(value) => handleAnswer(q.id, value)}
                className="flex gap-4"
              >
                {q.options.map((option) => (
                  <div key={option} className="flex items-center space-x-2">
                    <RadioGroupItem value={option} id={`q${q.id}-${option}`} />
                    <Label htmlFor={`q${q.id}-${option}`}>{option}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          ))}

          <div className="flex justify-end gap-4 pt-4">
            <Button variant="outline" onClick={resetScreening}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={answeredCount < totalQuestions}
            >
              Submit Screening
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
