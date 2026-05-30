// src/components/nutrition/nutrition-assessment.tsx

import { Badge } from "@clinic-app/ui/components/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@clinic-app/ui/components/card";
import { Progress } from "@clinic-app/ui/components/progress";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@clinic-app/ui/components/tabs";
import { format } from "date-fns";
import {
  Activity,
  AlertCircle,
  Apple,
  Award,
  Baby,
  CheckCircle,
  Droplet,
  TrendingDown,
  TrendingUp,
  Utensils,
} from "lucide-react";

interface NutritionalStatus {
  height: number;
  weight: number;
  bmi: number;
  weightPercentile: number;
  heightPercentile: number;
  bmiPercentile: number;
  classification: "normal" | "underweight" | "overweight" | "obese" | "stunted";
}

interface DietaryIntake {
  foodGroup: string;
  currentIntake: number;
  recommendedIntake: number;
  unit: string;
  status: "adequate" | "inadequate" | "excessive";
}

interface FeedingPattern {
  type: "breastfeeding" | "formula" | "mixed" | "solids";
  frequency: number;
  amount?: number;
  notes?: string;
}

interface NutritionAssessmentData {
  patientId: string;
  assessmentDate: Date;
  nutritionalStatus: NutritionalStatus;
  dietaryIntakes: DietaryIntake[];
  feedingPattern: FeedingPattern[];
  recommendations: string[];
  riskFactors: string[];
  followUpDate?: Date;
}

interface NutritionAssessmentProps {
  patientId: string;
  data?: {
    currentAssessment: NutritionAssessmentData;
    history: NutritionAssessmentData[];
  };
  loading?: boolean;
}

const classificationColors = {
  normal: "bg-green-500",
  underweight: "bg-yellow-500",
  overweight: "bg-orange-500",
  obese: "bg-red-500",
  stunted: "bg-red-500",
};

const classificationLabels = {
  normal: "Normal Weight",
  underweight: "Underweight",
  overweight: "Overweight",
  obese: "Obese",
  stunted: "Stunted Growth",
};

const foodGroupIcons = {
  Grains: <Utensils className="h-4 w-4" />,
  Protein: <Award className="h-4 w-4" />,
  Vegetables: <Apple className="h-4 w-4" />,
  Fruits: <Apple className="h-4 w-4" />,
  Dairy: <Droplet className="h-4 w-4" />,
};

const statusColors = {
  adequate: "text-green-600",
  inadequate: "text-red-600",
  excessive: "text-orange-600",
};

const statusLabels = {
  adequate: "Adequate",
  inadequate: "Inadequate",
  excessive: "Excessive",
};

export function NutritionAssessment({
  data,
  loading,
}: NutritionAssessmentProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Nutrition Assessment</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center text-muted-foreground">
            Loading nutrition assessment...
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentAssessment = data?.currentAssessment;
  const history = data?.history || [];

  if (!currentAssessment) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Nutrition Assessment</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-12 text-center">
            <Apple className="mx-auto mb-3 h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">
              No nutrition assessment available
            </p>
            <p className="text-muted-foreground text-sm">
              Please record growth measurements to see assessment
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const status = currentAssessment.nutritionalStatus;
  const getTrendIcon = (value: number, previousValue?: number) => {
    if (!previousValue) return null;
    if (value > previousValue)
      return <TrendingUp className="h-3 w-3 text-green-600" />;
    if (value < previousValue)
      return <TrendingDown className="h-3 w-3 text-red-600" />;
    return null;
  };

  const previousAssessment = history[0];

  return (
    <Tabs defaultValue="overview" className="space-y-4">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="dietary">Dietary Intake</TabsTrigger>
        <TabsTrigger value="history">History</TabsTrigger>
        <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
      </TabsList>

      <TabsContent value="overview">
        <div className="space-y-6">
          {/* Growth Status Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Growth Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="text-center">
                  <p className="text-muted-foreground text-sm">Weight</p>
                  <p className="font-bold text-2xl">{status.weight} kg</p>
                  <div className="mt-1 flex items-center justify-center gap-1">
                    <span className="text-muted-foreground text-xs">
                      {status.weightPercentile}th percentile
                    </span>
                    {getTrendIcon(
                      status.weightPercentile,
                      previousAssessment?.nutritionalStatus.weightPercentile,
                    )}
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-muted-foreground text-sm">Height</p>
                  <p className="font-bold text-2xl">{status.height} cm</p>
                  <div className="mt-1 flex items-center justify-center gap-1">
                    <span className="text-muted-foreground text-xs">
                      {status.heightPercentile}th percentile
                    </span>
                    {getTrendIcon(
                      status.heightPercentile,
                      previousAssessment?.nutritionalStatus.heightPercentile,
                    )}
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-muted-foreground text-sm">BMI</p>
                  <p className="font-bold text-2xl">{status.bmi}</p>
                  <div className="mt-1 flex items-center justify-center gap-1">
                    <span className="text-muted-foreground text-xs">
                      {status.bmiPercentile}th percentile
                    </span>
                    {getTrendIcon(
                      status.bmiPercentile,
                      previousAssessment?.nutritionalStatus.bmiPercentile,
                    )}
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-muted-foreground text-sm">
                    Classification
                  </p>
                  <Badge
                    className={`mt-1 ${classificationColors[status.classification]} text-white`}
                  >
                    {classificationLabels[status.classification]}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Feeding Pattern Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Current Feeding Pattern
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {currentAssessment.feedingPattern.map((pattern) => (
                  <div
                    key={pattern.amount}
                    className="flex items-center justify-between border-b pb-3"
                  >
                    <div className="flex items-center gap-3">
                      <Baby className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium capitalize">{pattern.type}</p>
                        <p className="text-muted-foreground text-sm">
                          {pattern.frequency} times/day
                          {pattern.amount && ` • ${pattern.amount} mL`}
                        </p>
                      </div>
                    </div>
                    {pattern.notes && (
                      <p className="text-muted-foreground text-sm">
                        {pattern.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Risk Factors */}
          {currentAssessment.riskFactors.length > 0 && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base text-yellow-800">
                  <AlertCircle className="h-5 w-5" />
                  Risk Factors
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1">
                  {currentAssessment.riskFactors.map((risk) => (
                    <li
                      key={risk.toString()}
                      className="flex items-start gap-2 text-sm text-yellow-700"
                    >
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-yellow-500" />
                      {risk}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      </TabsContent>

      <TabsContent value="dietary">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Dietary Intake Assessment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {currentAssessment.dietaryIntakes.map((intake) => (
                <div key={intake.foodGroup}>
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {foodGroupIcons[
                        intake.foodGroup as keyof typeof foodGroupIcons
                      ] || <Utensils className="h-4 w-4" />}
                      <span className="font-medium">{intake.foodGroup}</span>
                    </div>
                    <Badge
                      variant="outline"
                      className={statusColors[intake.status]}
                    >
                      {statusLabels[intake.status]}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <Progress
                        value={
                          (intake.currentIntake / intake.recommendedIntake) *
                          100
                        }
                        className="h-2"
                      />
                    </div>
                    <span className="whitespace-nowrap text-muted-foreground text-sm">
                      {intake.currentIntake} / {intake.recommendedIntake}{" "}
                      {intake.unit}
                    </span>
                  </div>
                  <p className="mt-1 text-muted-foreground text-xs">
                    Recommended daily intake for age group
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="history">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Assessment History</CardTitle>
          </CardHeader>
          <CardContent>
            {history.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                No previous assessments found
              </div>
            ) : (
              <div className="space-y-4">
                {history.map((assessment) => (
                  <div
                    key={assessment.patientId}
                    className="rounded-lg border p-4"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {format(
                            new Date(assessment.assessmentDate),
                            "MMM dd, yyyy",
                          )}
                        </span>
                      </div>
                      <Badge
                        className={
                          classificationColors[
                            assessment.nutritionalStatus.classification
                          ]
                        }
                      >
                        {
                          classificationLabels[
                            assessment.nutritionalStatus.classification
                          ]
                        }
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-center text-sm">
                      <div>
                        <p className="text-muted-foreground">Weight</p>
                        <p className="font-medium">
                          {assessment.nutritionalStatus.weight} kg
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {assessment.nutritionalStatus.weightPercentile}th %ile
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Height</p>
                        <p className="font-medium">
                          {assessment.nutritionalStatus.height} cm
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {assessment.nutritionalStatus.heightPercentile}th %ile
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">BMI</p>
                        <p className="font-medium">
                          {assessment.nutritionalStatus.bmi}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {assessment.nutritionalStatus.bmiPercentile}th %ile
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="recommendations">
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-green-800">
              <CheckCircle className="h-5 w-5" />
              Nutrition Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {currentAssessment.recommendations.map((rec) => (
                <li
                  key={rec.toString()}
                  className="flex items-start gap-2 text-green-700"
                >
                  <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{rec}</span>
                </li>
              ))}
            </ul>

            {currentAssessment.followUpDate && (
              <div className="mt-6 rounded-lg border border-green-200 bg-green-100 p-4">
                <p className="flex items-center gap-2 text-green-800 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  Follow-up Assessment Recommended:{" "}
                  {format(
                    new Date(currentAssessment.followUpDate),
                    "MMM dd, yyyy",
                  )}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
