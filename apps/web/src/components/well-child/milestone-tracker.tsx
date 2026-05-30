// src/components/well-child/milestone-tracker.tsx

import { Badge } from "@clinic-app/ui/components/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@clinic-app/ui/components/card";
import { Checkbox } from "@clinic-app/ui/components/checkbox";
import { Progress } from "@clinic-app/ui/components/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@clinic-app/ui/components/select";
import { Skeleton } from "@clinic-app/ui/components/skeleton";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Award, ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import { orpc } from "@/utils/orpc";

interface MilestoneTrackerProps {
  patientId: string;
}

const milestoneCategories = [
  {
    id: "gross-motor",
    name: "Gross Motor Skills",
    description: "Large muscle movements and coordination",
    milestones: [
      { id: "rolls-over", name: "Rolls over", typicalAge: "4-6 months" },
      {
        id: "sits-alone",
        name: "Sits without support",
        typicalAge: "6-8 months",
      },
      { id: "crawls", name: "Crawls", typicalAge: "7-10 months" },
      {
        id: "pulls-to-stand",
        name: "Pulls to stand",
        typicalAge: "9-12 months",
      },
      { id: "stands-alone", name: "Stands alone", typicalAge: "11-14 months" },
      {
        id: "walks-independently",
        name: "Walks independently",
        typicalAge: "12-15 months",
      },
      { id: "runs", name: "Runs", typicalAge: "18-24 months" },
      { id: "jumps", name: "Jumps", typicalAge: "24-30 months" },
    ],
  },
  {
    id: "fine-motor",
    name: "Fine Motor Skills",
    description: "Small muscle movements and hand-eye coordination",
    milestones: [
      {
        id: "reaches-objects",
        name: "Reaches for objects",
        typicalAge: "3-5 months",
      },
      {
        id: "transfers-hand-to-hand",
        name: "Transfers objects hand-to-hand",
        typicalAge: "6-8 months",
      },
      { id: "pincer-grasp", name: "Pincer grasp", typicalAge: "9-12 months" },
      {
        id: "stacks-blocks",
        name: "Stacks 2-3 blocks",
        typicalAge: "12-18 months",
      },
      { id: "scribbles", name: "Scribbles", typicalAge: "15-18 months" },
      {
        id: "draws-lines",
        name: "Draws lines and circles",
        typicalAge: "24-30 months",
      },
      {
        id: "uses-scissors",
        name: "Uses child scissors",
        typicalAge: "36-48 months",
      },
      { id: "writes-name", name: "Writes name", typicalAge: "48-60 months" },
    ],
  },
  {
    id: "language",
    name: "Language & Communication",
    description: "Speech, language, and communication skills",
    milestones: [
      { id: "coos", name: "Coos", typicalAge: "2-3 months" },
      { id: "babbles", name: "Babbles", typicalAge: "4-6 months" },
      { id: "first-words", name: "First words", typicalAge: "10-14 months" },
      {
        id: "two-word-phrases",
        name: "2-3 word phrases",
        typicalAge: "18-24 months",
      },
      {
        id: "follows-commands",
        name: "Follows simple commands",
        typicalAge: "18-24 months",
      },
      {
        id: "names-objects",
        name: "Names familiar objects",
        typicalAge: "24-30 months",
      },
      {
        id: "uses-sentences",
        name: "Uses 3-5 word sentences",
        typicalAge: "30-36 months",
      },
      {
        id: "tells-stories",
        name: "Tells simple stories",
        typicalAge: "48-60 months",
      },
    ],
  },
  {
    id: "social",
    name: "Social & Emotional",
    description: "Social interaction and emotional development",
    milestones: [
      { id: "social-smile", name: "Social smile", typicalAge: "2-3 months" },
      {
        id: "recognizes-parents",
        name: "Recognizes parents",
        typicalAge: "4-6 months",
      },
      {
        id: "stranger-anxiety",
        name: "Stranger anxiety",
        typicalAge: "7-9 months",
      },
      {
        id: "plays-peekaboo",
        name: "Plays peek-a-boo",
        typicalAge: "8-12 months",
      },
      {
        id: "parallel-play",
        name: "Parallel play",
        typicalAge: "18-24 months",
      },
      {
        id: "cooperative-play",
        name: "Cooperative play",
        typicalAge: "36-48 months",
      },
      {
        id: "understands-feelings",
        name: "Understands feelings",
        typicalAge: "42-54 months",
      },
      {
        id: "makes-friends",
        name: "Makes friends",
        typicalAge: "48-60 months",
      },
    ],
  },
  {
    id: "cognitive",
    name: "Cognitive Development",
    description: "Thinking, learning, and problem-solving",
    milestones: [
      {
        id: "follows-with-eyes",
        name: "Follows objects with eyes",
        typicalAge: "2-3 months",
      },
      {
        id: "object-permanence",
        name: "Object permanence",
        typicalAge: "8-12 months",
      },
      {
        id: "matches-objects",
        name: "Matches objects",
        typicalAge: "15-18 months",
      },
      { id: "pretend-play", name: "Pretend play", typicalAge: "18-24 months" },
      { id: "counts-to-10", name: "Counts to 10", typicalAge: "36-48 months" },
      {
        id: "recognizes-letters",
        name: "Recognizes letters",
        typicalAge: "42-54 months",
      },
      {
        id: "solves-puzzles",
        name: "Solves simple puzzles",
        typicalAge: "48-60 months",
      },
      {
        id: "reads-words",
        name: "Reads simple words",
        typicalAge: "60-72 months",
      },
    ],
  },
];

export function MilestoneTracker({ patientId }: MilestoneTrackerProps) {
  const queryClient = useQueryClient();
  const [expandedCategories, setExpandedCategories] = useState<string[]>([
    "gross-motor",
  ]);
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<string>("all");

  const { data: milestones, isLoading } = useQuery(
    orpc.growth.getMilestones.queryOptions({ input: { patientId } }),
  );

  const { data: patient } = useQuery(
    orpc.patient.get.queryOptions({ input: { id: patientId } }),
  );

  const updateMilestone = useMutation(
    orpc.growth.updateMilestone.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["milestones", patientId] });
      },
    }),
  );

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId],
    );
  };

  const calculateAge = () => {
    if (!patient?.dateOfBirth) return 0;
    const ageInMonths = Math.floor(
      (Date.now() - new Date(patient.dateOfBirth).getTime()) /
        (1000 * 60 * 60 * 24 * 30.44),
    );
    return ageInMonths;
  };

  const getMilestoneStatus = (milestoneId: string) => {
    return Array.isArray(milestones?.achieved)
      ? milestones.achieved.includes(milestoneId)
      : false;
  };

  const handleMilestoneToggle = (milestoneId: string) => {
    const milestone = milestoneCategories
      .flatMap((c) => c.milestones)
      .find((m) => m.id === milestoneId);

    if (!milestone) return;

    updateMilestone.mutate({
      patientId,
      milestone: milestone.name,
      ageAchieved: calculateAge().toString(),
      dateRecorded: new Date(),
    });
  };

  const calculateOverallProgress = () => {
    if (!milestones) return 0;
    const total = milestones.total || 1;
    const achieved = Array.isArray(milestones.achieved)
      ? milestones.achieved.length
      : milestones.achieved || 0;
    return (achieved / total) * 100;
  };

  const getMilestonesForAge = (
    milestones: Array<{
      id: string;
      name: string;
      typicalAge: string;
      achieved: boolean;
    }>,
  ) => {
    if (selectedAgeGroup === "all") return milestones;

    const ageRanges = {
      "0-6": { min: 0, max: 6 },
      "7-12": { min: 7, max: 12 },
      "13-24": { min: 13, max: 24 },
      "25-36": { min: 25, max: 36 },
      "37-60": { min: 37, max: 60 },
    };

    const range = ageRanges[selectedAgeGroup as keyof typeof ageRanges];
    if (!range) return milestones;

    // Filter based on typical age range (simplified)
    return milestones.filter((m) => {
      const typicalAge = Number.parseInt(m.typicalAge, 10) || 0;
      return typicalAge >= range.min && typicalAge <= range.max;
    });
  };

  const ageInMonths = calculateAge();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="mb-4 h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  const overallProgress = calculateOverallProgress();

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Developmental Milestones</CardTitle>
            <CardDescription>
              Track your child's developmental progress by age
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Select
              value={selectedAgeGroup}
              onValueChange={setSelectedAgeGroup}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Filter by age" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ages</SelectItem>
                <SelectItem value="0-6">0-6 months</SelectItem>
                <SelectItem value="7-12">7-12 months</SelectItem>
                <SelectItem value="13-24">13-24 months</SelectItem>
                <SelectItem value="25-36">25-36 months</SelectItem>
                <SelectItem value="37-60">37-60 months</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Overall Progress */}
        <div className="mb-6 rounded-lg border p-4">
          <div className="mb-2 flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Overall Development Progress</h3>
              <p className="text-muted-foreground text-sm">
                Age: {Math.floor(ageInMonths / 12)} years {ageInMonths % 12}{" "}
                months
              </p>
            </div>
            <div className="text-right">
              <p className="font-bold text-2xl">
                {Math.round(overallProgress)}%
              </p>
              <Badge
                variant={
                  overallProgress >= 80
                    ? "default"
                    : overallProgress >= 50
                      ? "secondary"
                      : "destructive"
                }
              >
                {overallProgress >= 80
                  ? "On Track"
                  : overallProgress >= 50
                    ? "Developing"
                    : "Needs Attention"}
              </Badge>
            </div>
          </div>
          <Progress value={overallProgress} className="h-2" />
          <p className="mt-2 text-muted-foreground text-xs">
            {Array.isArray(milestones?.achieved)
              ? milestones.achieved.length
              : milestones?.achieved || 0}{" "}
            of {milestones?.total || 0} milestones achieved
          </p>
        </div>

        {/* Milestones by Category */}
        <div className="space-y-4">
          {milestoneCategories.map((category) => {
            const isExpanded = expandedCategories.includes(category.id);
            const categoryMilestones = getMilestonesForAge(
              category.milestones.map((m) => ({
                ...m,
                achieved: getMilestoneStatus(m.id),
              })),
            );
            const achievedCount = categoryMilestones.filter(
              (m) => m.achieved,
            ).length;
            const progress =
              categoryMilestones.length > 0
                ? (achievedCount / categoryMilestones.length) * 100
                : 0;

            return (
              <div key={category.id} className="rounded-lg border">
                <button
                  type="button"
                  onClick={() => toggleCategory(category.id)}
                  className="flex w-full items-center justify-between p-4 hover:bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    {isExpanded ? (
                      <ChevronDown className="h-5 w-5" />
                    ) : (
                      <ChevronRight className="h-5 w-5" />
                    )}
                    <div>
                      <h3 className="font-semibold">{category.name}</h3>
                      <p className="text-muted-foreground text-sm">
                        {category.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-medium text-sm">
                        {achievedCount}/{categoryMilestones.length}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {Math.round(progress)}%
                      </p>
                    </div>
                    <Progress value={progress} className="h-8 w-20" />
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t p-4">
                    <div className="grid gap-3 md:grid-cols-2">
                      {categoryMilestones.map((milestone) => (
                        <div
                          key={milestone.id}
                          className="flex items-start gap-3 rounded-lg p-2 hover:bg-muted/30"
                        >
                          <Checkbox
                            checked={milestone.achieved}
                            onCheckedChange={(_checked) =>
                              handleMilestoneToggle(milestone.id)
                            }
                            className="mt-0.5"
                          />
                          <div className="flex-1">
                            <label
                              htmlFor={milestone.id}
                              className="cursor-pointer font-medium text-sm"
                            >
                              {milestone.name}
                            </label>
                            <div className="mt-1 flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                Typical: {milestone.typicalAge}
                              </Badge>
                              {!milestone.achieved &&
                                ageInMonths >
                                  Number.parseInt(milestone.typicalAge, 10) +
                                    6 && (
                                  <Badge
                                    variant="destructive"
                                    className="text-xs"
                                  >
                                    <AlertCircle className="mr-1 h-3 w-3" />
                                    Delayed
                                  </Badge>
                                )}
                            </div>
                          </div>
                          {milestone.achieved && (
                            <Award className="h-5 w-5 text-green-500" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
