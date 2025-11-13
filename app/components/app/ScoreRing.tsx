"use client";

import { TrendingUp } from "lucide-react";
import { RadialBar, RadialBarChart, PolarAngleAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { ChartConfig, ChartContainer } from "../../components/ui/chart";

type ScoreRingProps = {
  score: number;
};

export function ScoreRing({ score }: ScoreRingProps) {
  const chartData = [{ name: "Score", value: score, fill: `hsl(var(--primary))` }];

  const chartConfig = {
    score: {
      label: "Score",
    },
  } satisfies ChartConfig;

  const getScoreColor = (value: number) => {
    if (value >= 90) return "text-green-500";
    if (value >= 50) return "text-yellow-500";
    return "text-red-500";
  };

  return (
    <ChartContainer
      config={chartConfig}
      className="mx-auto aspect-square h-full max-h-[250px]"
    >
      <RadialBarChart
        data={chartData}
        startAngle={-270}
        endAngle={90}
        innerRadius="80%"
        outerRadius="100%"
        barSize={20}
        cy="50%"
      >
        <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
        <RadialBar
          dataKey="value"
          background={{ fill: "hsl(var(--muted))" }}
          cornerRadius={10}
        />
        <g className="translate-x-1/2 translate-y-1/2 transform">
          <text
            x="0"
            y="0"
            textAnchor="middle"
            dominantBaseline="middle"
            className={`fill-foreground text-5xl font-bold ${getScoreColor(score)}`}
          >
            {score.toFixed(0)}
          </text>
        </g>
      </RadialBarChart>
    </ChartContainer>
  );
}
