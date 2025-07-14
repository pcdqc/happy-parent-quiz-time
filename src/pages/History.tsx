import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Calendar, Clock, Target, TrendingUp, ArrowLeft, User, CheckCircle, XCircle, Share2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface QuizResult {
  id: string;
  date: string;
  score: number;
  total_questions: number;
  title: string;
  answers: any;
}

const History = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [selectedRecord, setSelectedRecord] = useState<string | null>(null);
  const [historyData, setHistoryData] = useState<QuizResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchQuizHistory();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  const fetchQuizHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('quiz_results')
        .select('*')
        .eq('user_id', user?.id)
        .order('date', { ascending: false });

      if (error) throw error;

      setHistoryData(data || []);
    } catch (error: any) {
      console.error('Error fetching quiz history:', error);
      toast({
        title: "获取记录失败",
        description: "无法加载答题历史记录",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

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

  const totalQuizzes = historyData.length;
  const averageScore = totalQuizzes > 0 
    ? Math.round(historyData.reduce((sum, record) => sum + (record.score / record.total_questions * 100), 0) / totalQuizzes)
    : 0;
  const bestScore = totalQuizzes > 0 
    ? Math.max(...historyData.map(record => Math.round(record.score / record.total_questions * 100)))
    : 0;
  const recentTrend = historyData.slice(0, 3).map(r => Math.round(r.score / r.total_questions * 100));

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="container mx-auto px-4 max-w-2xl">
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

          <Card className="bg-gradient-card shadow-float border-0 text-center">
            <CardContent className="p-8">
              <User className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-bold mb-2">请先登录</h3>
              <p className="text-muted-foreground mb-6">
                登录后即可查看你的答题历史记录
              </p>
              <div className="flex gap-3 justify-center">
                <Button onClick={() => navigate("/auth")}>
                  登录/注册
                </Button>
                <Button variant="outline" onClick={() => navigate("/")}>
                  返回首页
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="container mx-auto px-4 max-w-6xl">
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
          <div className="text-center">
            <div className="text-lg text-muted-foreground">加载中...</div>
          </div>
        </div>
      </div>
    );
  }

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
            {historyData.length === 0 ? (
              <Card className="bg-gradient-card shadow-card border-0 text-center">
                <CardContent className="p-8">
                  <Trophy className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-bold mb-2">还没有答题记录</h3>
                  <p className="text-muted-foreground mb-6">
                    完成第一次答题挑战来建立你的学习档案
                  </p>
                  <Button onClick={() => navigate("/quiz")}>
                    开始第一次答题
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Records List */}
                <div className="space-y-4">
                  {historyData.map((record) => {
                    const percentage = Math.round((record.score / record.total_questions) * 100);
                    return (
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
                                </div>
                                <Badge variant="secondary">{record.title}</Badge>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className={`text-2xl font-bold ${getScoreColor(percentage)}`}>
                                {percentage}%
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {record.score}/{record.total_questions}
                              </div>
                            </div>
                          </div>
                        </CardHeader>

                        {selectedRecord === record.id && (
                          <CardContent className="pt-0">
                            <div className="border-t pt-4">
                              <h4 className="font-medium mb-2">答题详情：</h4>
                              <div className="space-y-2 max-h-60 overflow-y-auto">
                                {record.answers?.map((answer: any, index: number) => (
                                  <div key={index} className="text-sm p-3 bg-muted/50 rounded-lg">
                                    <div className="font-medium mb-1">
                                      第{index + 1}题: {answer.question}
                                    </div>
                                    <div className={`flex items-center gap-2 ${answer.is_correct ? 'text-green-600' : 'text-red-600'}`}>
                                      {answer.is_correct ? (
                                        <CheckCircle className="w-4 h-4" />
                                      ) : (
                                        <XCircle className="w-4 h-4" />
                                      )}
                                      <span>{answer.is_correct ? '正确' : '错误'}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </CardContent>
                        )}
                      </Card>
                    );
                  })}
                </div>
              </>
            )}

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