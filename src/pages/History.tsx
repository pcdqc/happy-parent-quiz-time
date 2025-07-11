import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Calendar, Clock, Target, TrendingUp, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

// 模拟历史记录数据
const historyData = [
  {
    id: 1,
    date: "2024-01-15",
    score: 7,
    total: 8,
    percentage: 88,
    duration: 245, // 秒
    title: "社区育儿专家",
    topics: ["情绪管理", "阅读习惯", "独立性培养"]
  },
  {
    id: 2,
    date: "2024-01-12",
    score: 6,
    total: 8,
    percentage: 75,
    duration: 312,
    title: "合格的智慧家长",
    topics: ["沟通技巧", "行为引导", "专注力训练"]
  },
  {
    id: 3,
    date: "2024-01-10",
    score: 5,
    total: 8,
    percentage: 63,
    duration: 298,
    title: "合格的智慧家长",
    topics: ["分享意识", "表扬方式", "错误处理"]
  },
  {
    id: 4,
    date: "2024-01-08",
    score: 4,
    total: 8,
    percentage: 50,
    duration: 365,
    title: "正在成长的父母",
    topics: ["情绪控制", "习惯养成", "亲子互动"]
  },
  {
    id: 5,
    date: "2024-01-05",
    score: 6,
    total: 8,
    percentage: 75,
    duration: 280,
    title: "合格的智慧家长",
    topics: ["正面教育", "时间管理", "创造力培养"]
  }
];

const History = () => {
  const navigate = useNavigate();
  const [selectedRecord, setSelectedRecord] = useState<number | null>(null);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return "text-green-600";
    if (percentage >= 60) return "text-blue-600";
    if (percentage >= 40) return "text-yellow-600";
    return "text-red-600";
  };

  const averageScore = Math.round(
    historyData.reduce((sum, record) => sum + record.percentage, 0) / historyData.length
  );

  const bestScore = Math.max(...historyData.map(record => record.percentage));
  const totalQuizzes = historyData.length;
  const recentTrend = historyData.slice(0, 3).map(r => r.percentage);

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-3xl font-bold">答题历史记录</h1>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview">概览统计</TabsTrigger>
            <TabsTrigger value="records">详细记录</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-gradient-card shadow-card border-0">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">总答题次数</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">{totalQuizzes}</div>
                  <p className="text-xs text-muted-foreground">累计挑战次数</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-card shadow-card border-0">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">平均分数</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">{averageScore}%</div>
                  <p className="text-xs text-muted-foreground">整体表现水平</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-card shadow-card border-0">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">最高分数</CardTitle>
                  <Trophy className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">{bestScore}%</div>
                  <p className="text-xs text-muted-foreground">个人最佳成绩</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-card shadow-card border-0">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">最近趋势</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {recentTrend[0] > recentTrend[recentTrend.length - 1] ? '↗' : '↘'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {recentTrend[0] > recentTrend[recentTrend.length - 1] ? '持续提升' : '需要加油'}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Achievement Section */}
            <Card className="bg-gradient-accent shadow-card border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5" />
                  成就徽章
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-background/50 rounded-lg">
                    <div className="text-2xl mb-2">🏆</div>
                    <div className="text-sm font-medium">育儿专家</div>
                    <div className="text-xs text-muted-foreground">获得80%以上高分</div>
                  </div>
                  <div className="text-center p-4 bg-background/50 rounded-lg opacity-50">
                    <div className="text-2xl mb-2">🔥</div>
                    <div className="text-sm font-medium">连续挑战</div>
                    <div className="text-xs text-muted-foreground">连续7天答题</div>
                  </div>
                  <div className="text-center p-4 bg-background/50 rounded-lg">
                    <div className="text-2xl mb-2">📚</div>
                    <div className="text-sm font-medium">学习达人</div>
                    <div className="text-xs text-muted-foreground">完成10次答题</div>
                  </div>
                  <div className="text-center p-4 bg-background/50 rounded-lg opacity-50">
                    <div className="text-2xl mb-2">⚡</div>
                    <div className="text-sm font-medium">速度之星</div>
                    <div className="text-xs text-muted-foreground">3分钟内完成</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="records" className="space-y-6">
            {/* Records List */}
            <div className="space-y-4">
              {historyData.map((record) => (
                <Card 
                  key={record.id} 
                  className="bg-gradient-card shadow-card border-0 hover:shadow-float transition-all cursor-pointer"
                  onClick={() => setSelectedRecord(selectedRecord === record.id ? null : record.id)}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center">
                          <div className={`text-lg font-bold text-primary-foreground`}>
                            {record.score}
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              {formatDate(record.date)}
                            </span>
                            <Clock className="w-4 h-4 text-muted-foreground ml-2" />
                            <span className="text-sm text-muted-foreground">
                              {formatTime(record.duration)}
                            </span>
                          </div>
                          <Badge variant="secondary">{record.title}</Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-2xl font-bold ${getScoreColor(record.percentage)}`}>
                          {record.percentage}%
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {record.score}/{record.total}
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  {selectedRecord === record.id && (
                    <CardContent className="pt-0">
                      <div className="border-t pt-4">
                        <h4 className="font-medium mb-2">涉及主题：</h4>
                        <div className="flex flex-wrap gap-2">
                          {record.topics.map((topic, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {topic}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>

            {/* CTA */}
            <Card className="bg-gradient-primary shadow-card border-0 text-center">
              <CardContent className="p-8">
                <h3 className="text-xl font-bold text-primary-foreground mb-2">
                  准备开始新的挑战？
                </h3>
                <p className="text-primary-foreground/80 mb-4">
                  继续提升你的亲子教育知识，成为更优秀的家长
                </p>
                <Button 
                  variant="secondary" 
                  size="lg"
                  onClick={() => navigate("/quiz")}
                >
                  开始新的答题
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default History;