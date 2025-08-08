import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Settings, 
  BookOpen, 
  Brain, 
  BarChart3,
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  Loader2,
  Upload,
  Eye,
  EyeOff
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Question {
  id: string;
  title: string;
  options: string[];
  correct_answer: number;
  explanation: string;
  topic: string;
  difficulty: string;
  source: string;
  is_active: boolean;
  created_at: string;
}

const Admin = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // AI generation state
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiFormData, setAiFormData] = useState({
    topic: "",
    difficulty: "medium" as "easy" | "medium" | "hard",
    count: 5,
    style: "亲子教育"
  });
  const [generatedQuestions, setGeneratedQuestions] = useState<any[]>([]);
  const [editingGeneratedQuestion, setEditingGeneratedQuestion] = useState<any>(null);
  const [selectedQuestions, setSelectedQuestions] = useState<Set<number>>(new Set());
  
  // Analytics state
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    options: ["", "", "", ""],
    correct_answer: 0,
    explanation: "",
    topic: "",
    difficulty: "medium",
    source: "",
  });

  useEffect(() => {
    checkAdminStatus();
  }, [user, isAuthenticated]);

  useEffect(() => {
    if (isAdmin) {
      fetchQuestions();
    }
  }, [isAdmin]);

  const checkAdminStatus = async () => {
    if (!isAuthenticated || !user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.rpc('is_admin', {
        user_id: user.id
      });

      if (error) throw error;
      setIsAdmin(data);
    } catch (error: any) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  const fetchQuestions = async () => {
    try {
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setQuestions((data || []).map(q => ({
        ...q,
        options: Array.isArray(q.options) ? q.options.map(String) : []
      })));
    } catch (error: any) {
      console.error('Error fetching questions:', error);
      toast({
        title: "获取题目失败",
        description: "无法加载题目列表",
        variant: "destructive",
      });
    }
  };

  const handleSaveQuestion = async () => {
    try {
      const questionData = {
        ...formData,
        options: formData.options.filter(opt => opt.trim() !== ""),
      };

      if (questionData.options.length < 2) {
        toast({
          title: "验证失败",
          description: "至少需要2个选项",
          variant: "destructive",
        });
        return;
      }

      if (editingQuestion) {
        const { error } = await supabase
          .from('questions')
          .update(questionData)
          .eq('id', editingQuestion.id);

        if (error) throw error;
        toast({
          title: "更新成功",
          description: "题目已成功更新",
        });
      } else {
        const { error } = await supabase
          .from('questions')
          .insert([questionData]);

        if (error) throw error;
        toast({
          title: "添加成功",
          description: "题目已成功添加",
        });
      }

      resetForm();
      fetchQuestions();
    } catch (error: any) {
      console.error('Error saving question:', error);
      toast({
        title: "保存失败",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!confirm("确定要删除这道题目吗？")) return;

    try {
      const { error } = await supabase
        .from('questions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "删除成功",
        description: "题目已成功删除",
      });
      fetchQuestions();
    } catch (error: any) {
      console.error('Error deleting question:', error);
      toast({
        title: "删除失败",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEditQuestion = (question: Question) => {
    setEditingQuestion(question);
    setFormData({
      title: question.title,
      options: [...question.options, "", "", "", ""].slice(0, 4),
      correct_answer: question.correct_answer,
      explanation: question.explanation,
      topic: question.topic,
      difficulty: question.difficulty,
      source: question.source,
    });
    setShowAddForm(true);
  };

  const resetForm = () => {
    setFormData({
      title: "",
      options: ["", "", "", ""],
      correct_answer: 0,
      explanation: "",
      topic: "",
      difficulty: "medium",
      source: "",
    });
    setEditingQuestion(null);
    setShowAddForm(false);
  };

  const toggleQuestionStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('questions')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "状态更新",
        description: `题目已${!currentStatus ? '启用' : '禁用'}`,
      });
      fetchQuestions();
    } catch (error: any) {
      console.error('Error updating question status:', error);
      toast({
        title: "更新失败",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // AI Generation functions
  const handleAiGenerate = async () => {
    if (!aiFormData.topic.trim()) {
      toast({
        title: "请输入主题",
        description: "AI生成需要指定题目主题",
        variant: "destructive",
      });
      return;
    }

    setAiGenerating(true);
    try {
      const response = await supabase.functions.invoke('generate-ai-questions', {
        body: {
          topic: aiFormData.topic,
          difficulty: aiFormData.difficulty,
          count: aiFormData.count,
          style: aiFormData.style
        }
      });

      if (response.error) {
        throw new Error(response.error.message || 'AI生成失败');
      }

      const { data } = response;
      if (!data.success) {
        throw new Error(data.error || 'AI生成失败');
      }

      // 将生成的题目添加到预览列表，而不是直接入库
      setGeneratedQuestions(data.questions.map((q: any, index: number) => ({
        ...q,
        tempId: index,
        created_by: user?.id
      })));
      setSelectedQuestions(new Set(data.questions.map((_: any, index: number) => index)));

      toast({
        title: "AI生成成功",
        description: `成功生成了 ${data.questions.length} 道题目，请检查后选择入库`,
      });

    } catch (error: any) {
      console.error('AI generation error:', error);
      toast({
        title: "AI生成失败",
        description: error.message || "生成过程中出现错误",
        variant: "destructive",
      });
    } finally {
      setAiGenerating(false);
    }
  };

  const handleEditGeneratedQuestion = (question: any) => {
    setEditingGeneratedQuestion(question);
  };

  const handleSaveGeneratedQuestion = (updatedQuestion: any) => {
    setGeneratedQuestions(prev => 
      prev.map(q => q.tempId === updatedQuestion.tempId ? updatedQuestion : q)
    );
    setEditingGeneratedQuestion(null);
    toast({
      title: "题目已更新",
      description: "题目修改已保存到预览列表",
    });
  };

  const handleToggleQuestionSelection = (tempId: number) => {
    setSelectedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(tempId)) {
        newSet.delete(tempId);
      } else {
        newSet.add(tempId);
      }
      return newSet;
    });
  };

  const handleBatchInsert = async () => {
    const questionsToInsert = generatedQuestions
      .filter(q => selectedQuestions.has(q.tempId))
      .map(({ tempId, ...q }) => q);

    if (questionsToInsert.length === 0) {
      toast({
        title: "请选择题目",
        description: "请至少选择一道题目进行入库",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('questions')
        .insert(questionsToInsert);

      if (error) throw error;

      toast({
        title: "入库成功",
        description: `成功添加了 ${questionsToInsert.length} 道题目`,
      });

      // 清空生成的题目列表
      setGeneratedQuestions([]);
      setSelectedQuestions(new Set());
      setAiFormData({
        topic: "",
        difficulty: "medium",
        count: 5,
        style: "亲子教育"
      });
      fetchQuestions();

    } catch (error: any) {
      console.error('Batch insert error:', error);
      toast({
        title: "入库失败",
        description: error.message || "批量入库过程中出现错误",
        variant: "destructive",
      });
    }
  };

  const handleSingleInsert = async (question: any) => {
    try {
      const { tempId, ...questionToInsert } = question;
      const { error } = await supabase
        .from('questions')
        .insert([questionToInsert]);

      if (error) throw error;

      toast({
        title: "入库成功",
        description: "题目已成功添加",
      });

      // 从生成列表中移除这道题目
      setGeneratedQuestions(prev => prev.filter(q => q.tempId !== tempId));
      setSelectedQuestions(prev => {
        const newSet = new Set(prev);
        newSet.delete(tempId);
        return newSet;
      });
      fetchQuestions();

    } catch (error: any) {
      console.error('Single insert error:', error);
      toast({
        title: "入库失败",
        description: error.message || "题目入库失败",
        variant: "destructive",
      });
    }
  };

  // Analytics functions
  const fetchAnalytics = async () => {
    setAnalyticsLoading(true);
    try {
      // 获取总题目数
      const { count: totalQuestions } = await supabase
        .from('questions')
        .select('*', { count: 'exact' });

      // 获取活跃题目数
      const { count: activeQuestions } = await supabase
        .from('questions')
        .select('*', { count: 'exact' })
        .eq('is_active', true);

      // 获取总答题记录数
      const { count: totalAttempts } = await supabase
        .from('quiz_results')
        .select('*', { count: 'exact' });

      // 获取最近7天的答题统计
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { data: recentResults, error: recentError } = await supabase
        .from('quiz_results')
        .select('date, score, total_questions')
        .gte('date', sevenDaysAgo.toISOString())
        .order('date', { ascending: true });

      if (recentError) throw recentError;

      // 按主题统计题目数量
      const { data: topicStats, error: topicError } = await supabase
        .from('questions')
        .select('topic')
        .eq('is_active', true);

      if (topicError) throw topicError;

      const topicCounts = topicStats?.reduce((acc: any, q: any) => {
        acc[q.topic] = (acc[q.topic] || 0) + 1;
        return acc;
      }, {}) || {};

      // 按难度统计题目数量
      const { data: difficultyStats, error: difficultyError } = await supabase
        .from('questions')
        .select('difficulty')
        .eq('is_active', true);

      if (difficultyError) throw difficultyError;

      const difficultyCounts = difficultyStats?.reduce((acc: any, q: any) => {
        acc[q.difficulty] = (acc[q.difficulty] || 0) + 1;
        return acc;
      }, {}) || {};

      // 计算平均分
      const averageScore = recentResults?.length > 0 
        ? recentResults.reduce((sum, r) => sum + (r.score / r.total_questions * 100), 0) / recentResults.length
        : 0;

      setAnalyticsData({
        totalQuestions: totalQuestions || 0,
        activeQuestions: activeQuestions || 0,
        totalAttempts: totalAttempts || 0,
        recentResults: recentResults || [],
        topicCounts,
        difficultyCounts,
        averageScore: Math.round(averageScore)
      });

    } catch (error: any) {
      console.error('Error fetching analytics:', error);
      toast({
        title: "数据加载失败",
        description: "无法获取统计数据",
        variant: "destructive",
      });
    } finally {
      setAnalyticsLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin && analyticsData === null) {
      fetchAnalytics();
    }
  }, [isAdmin]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
            <div className="text-lg text-muted-foreground">验证权限中...</div>
          </div>
        </div>
      </div>
    );
  }

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
            <h1 className="text-3xl font-bold">管理后台</h1>
          </div>

          <Card className="bg-gradient-card shadow-float border-0 text-center">
            <CardContent className="p-8">
              <AlertCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-bold mb-2">需要登录</h3>
              <p className="text-muted-foreground mb-6">
                请先登录后访问管理后台
              </p>
              <Button onClick={() => navigate("/auth")}>
                登录
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
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
            <h1 className="text-3xl font-bold">管理后台</h1>
          </div>

          <Card className="bg-gradient-card shadow-float border-0 text-center">
            <CardContent className="p-8">
              <AlertCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-bold mb-2">访问被拒绝</h3>
              <p className="text-muted-foreground mb-6">
                你没有管理员权限，无法访问此页面
              </p>
              <Button onClick={() => navigate("/")}>
                返回首页
              </Button>
            </CardContent>
          </Card>
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
          <h1 className="text-3xl font-bold">管理后台</h1>
          <Badge variant="secondary">管理员</Badge>
        </div>

        <Tabs defaultValue="questions" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="questions" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              题目管理
            </TabsTrigger>
            <TabsTrigger value="ai-generate" className="flex items-center gap-2">
              <Brain className="w-4 h-4" />
              AI生成
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              数据分析
            </TabsTrigger>
          </TabsList>

          <TabsContent value="questions" className="space-y-6">
            {/* Add Question Form */}
            {showAddForm && (
              <Card className="bg-gradient-card shadow-card border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="w-5 h-5" />
                    {editingQuestion ? "编辑题目" : "添加新题目"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">题目内容</Label>
                    <Textarea
                      id="title"
                      placeholder="请输入题目内容"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>选项</Label>
                    {formData.options.map((option, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <span className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                          {String.fromCharCode(65 + index)}
                        </span>
                        <Input
                          placeholder={`选项 ${String.fromCharCode(65 + index)}`}
                          value={option}
                          onChange={(e) => {
                            const newOptions = [...formData.options];
                            newOptions[index] = e.target.value;
                            setFormData({ ...formData, options: newOptions });
                          }}
                        />
                        {index === formData.correct_answer && (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <Label>正确答案</Label>
                    <Select
                      value={formData.correct_answer.toString()}
                      onValueChange={(value) => setFormData({ ...formData, correct_answer: parseInt(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {formData.options.map((option, index) => 
                          option.trim() && (
                            <SelectItem key={index} value={index.toString()}>
                              选项 {String.fromCharCode(65 + index)}: {option.slice(0, 30)}...
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="topic">主题</Label>
                      <Input
                        id="topic"
                        placeholder="如：情绪管理"
                        value={formData.topic}
                        onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>难度</Label>
                      <Select
                        value={formData.difficulty}
                        onValueChange={(value) => setFormData({ ...formData, difficulty: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="easy">简单</SelectItem>
                          <SelectItem value="medium">中等</SelectItem>
                          <SelectItem value="hard">困难</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="source">来源</Label>
                    <Input
                      id="source"
                      placeholder="如：《正面管教》第3章"
                      value={formData.source}
                      onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="explanation">题目解析</Label>
                    <Textarea
                      id="explanation"
                      placeholder="请输入题目解析和学习要点"
                      value={formData.explanation}
                      onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button onClick={handleSaveQuestion}>
                      {editingQuestion ? "更新题目" : "添加题目"}
                    </Button>
                    <Button variant="outline" onClick={resetForm}>
                      取消
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Questions List */}
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">题目列表 ({questions.length})</h2>
              <Button onClick={() => setShowAddForm(true)} disabled={showAddForm}>
                <Plus className="w-4 h-4 mr-2" />
                添加题目
              </Button>
            </div>

            <div className="space-y-4">
              {questions.map((question) => (
                <Card key={question.id} className="bg-gradient-card shadow-card border-0">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{question.title}</CardTitle>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline">{question.topic}</Badge>
                          <Badge variant="secondary">{question.difficulty}</Badge>
                          <Badge variant={question.is_active ? "default" : "destructive"}>
                            {question.is_active ? "启用" : "禁用"}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleQuestionStatus(question.id, question.is_active)}
                        >
                          {question.is_active ? "禁用" : "启用"}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditQuestion(question)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteQuestion(question.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">
                        正确答案: {String.fromCharCode(65 + question.correct_answer)} - {question.options[question.correct_answer]}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        来源: {question.source}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {questions.length === 0 && (
                <Card className="bg-gradient-card shadow-card border-0 text-center">
                  <CardContent className="p-8">
                    <BookOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-xl font-bold mb-2">暂无题目</h3>
                    <p className="text-muted-foreground mb-6">
                      开始添加第一道题目来建立题库
                    </p>
                    <Button onClick={() => setShowAddForm(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      添加题目
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="ai-generate" className="space-y-6">
            <Card className="bg-gradient-card shadow-card border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5" />
                  AI题目生成
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="ai-topic">题目主题</Label>
                    <Input
                      id="ai-topic"
                      placeholder="如：儿童情绪管理、学习习惯培养"
                      value={aiFormData.topic}
                      onChange={(e) => setAiFormData({ ...aiFormData, topic: e.target.value })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>题目难度</Label>
                    <Select
                      value={aiFormData.difficulty}
                      onValueChange={(value: "easy" | "medium" | "hard") => 
                        setAiFormData({ ...aiFormData, difficulty: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">简单</SelectItem>
                        <SelectItem value="medium">中等</SelectItem>
                        <SelectItem value="hard">困难</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="ai-count">生成数量</Label>
                    <Select
                      value={aiFormData.count.toString()}
                      onValueChange={(value) => setAiFormData({ ...aiFormData, count: parseInt(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3">3道题</SelectItem>
                        <SelectItem value="5">5道题</SelectItem>
                        <SelectItem value="10">10道题</SelectItem>
                        <SelectItem value="15">15道题</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="ai-style">生成风格</Label>
                    <Select
                      value={aiFormData.style}
                      onValueChange={(value) => setAiFormData({ ...aiFormData, style: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="亲子教育">亲子教育</SelectItem>
                        <SelectItem value="学前教育">学前教育</SelectItem>
                        <SelectItem value="青少年心理">青少年心理</SelectItem>
                        <SelectItem value="家庭教育">家庭教育</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="text-center">
                  <Button 
                    onClick={handleAiGenerate} 
                    disabled={aiGenerating || !aiFormData.topic.trim()}
                    size="lg"
                  >
                    {aiGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        AI生成中...
                      </>
                    ) : (
                      <>
                        <Brain className="w-4 h-4 mr-2" />
                        开始AI生成
                      </>
                    )}
                  </Button>
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    AI将根据您的设置生成高质量的亲子教育题目，生成后您可以预览、编辑并选择性入库。
                    请确保网络连接稳定，生成过程可能需要30-60秒。
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* Generated Questions Preview */}
            {generatedQuestions.length > 0 && (
              <Card className="bg-gradient-card shadow-card border-0">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Eye className="w-5 h-5" />
                      生成的题目预览 ({generatedQuestions.length})
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        已选择 {selectedQuestions.size} 道题目
                      </span>
                      <Button 
                        onClick={handleBatchInsert}
                        disabled={selectedQuestions.size === 0}
                        size="sm"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        批量入库 ({selectedQuestions.size})
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {generatedQuestions.map((question, index) => (
                    <Card key={question.tempId} className="border relative">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <input
                                type="checkbox"
                                checked={selectedQuestions.has(question.tempId)}
                                onChange={() => handleToggleQuestionSelection(question.tempId)}
                                className="w-4 h-4 rounded border-gray-300"
                              />
                              <span className="text-sm text-muted-foreground">题目 {index + 1}</span>
                              <Badge variant="outline">{question.topic}</Badge>
                              <Badge variant="secondary">{question.difficulty}</Badge>
                            </div>
                            <CardTitle className="text-base">{question.title}</CardTitle>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditGeneratedQuestion(question)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSingleInsert(question)}
                            >
                              <Upload className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {question.options.map((option: string, optIndex: number) => (
                              <div key={optIndex} className="flex items-center gap-2">
                                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${
                                  optIndex === question.correct_answer 
                                    ? 'bg-green-100 text-green-700 border-2 border-green-300' 
                                    : 'bg-gray-100 text-gray-600'
                                }`}>
                                  {String.fromCharCode(65 + optIndex)}
                                </span>
                                <span className={`text-sm ${optIndex === question.correct_answer ? 'font-medium text-green-700' : ''}`}>
                                  {option}
                                </span>
                                {optIndex === question.correct_answer && (
                                  <CheckCircle className="w-4 h-4 text-green-600" />
                                )}
                              </div>
                            ))}
                          </div>
                          <div className="border-t pt-3">
                            <div className="text-sm">
                              <span className="font-medium text-muted-foreground">解析：</span>
                              <span className="text-muted-foreground">{question.explanation}</span>
                            </div>
                            <div className="text-sm mt-1">
                              <span className="font-medium text-muted-foreground">来源：</span>
                              <span className="text-muted-foreground">{question.source}</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex items-center gap-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (selectedQuestions.size === generatedQuestions.length) {
                            setSelectedQuestions(new Set());
                          } else {
                            setSelectedQuestions(new Set(generatedQuestions.map(q => q.tempId)));
                          }
                        }}
                      >
                        {selectedQuestions.size === generatedQuestions.length ? (
                          <>
                            <EyeOff className="w-4 h-4 mr-2" />
                            取消全选
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            全选
                          </>
                        )}
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        共 {generatedQuestions.length} 道题目，已选择 {selectedQuestions.size} 道
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setGeneratedQuestions([]);
                          setSelectedQuestions(new Set());
                        }}
                      >
                        清空列表
                      </Button>
                      <Button 
                        onClick={handleBatchInsert}
                        disabled={selectedQuestions.size === 0}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        批量入库 ({selectedQuestions.size})
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Edit Generated Question Modal */}
            {editingGeneratedQuestion && (
              <Card className="bg-gradient-card shadow-card border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Edit className="w-5 h-5" />
                    编辑生成的题目
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-title">题目内容</Label>
                    <Textarea
                      id="edit-title"
                      value={editingGeneratedQuestion.title}
                      onChange={(e) => setEditingGeneratedQuestion({
                        ...editingGeneratedQuestion,
                        title: e.target.value
                      })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>选项</Label>
                    {editingGeneratedQuestion.options.map((option: string, index: number) => (
                      <div key={index} className="flex items-center gap-2">
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          index === editingGeneratedQuestion.correct_answer 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-primary text-primary-foreground'
                        }`}>
                          {String.fromCharCode(65 + index)}
                        </span>
                        <Input
                          value={option}
                          onChange={(e) => {
                            const newOptions = [...editingGeneratedQuestion.options];
                            newOptions[index] = e.target.value;
                            setEditingGeneratedQuestion({
                              ...editingGeneratedQuestion,
                              options: newOptions
                            });
                          }}
                        />
                        {index === editingGeneratedQuestion.correct_answer && (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <Label>正确答案</Label>
                    <Select
                      value={editingGeneratedQuestion.correct_answer.toString()}
                      onValueChange={(value) => setEditingGeneratedQuestion({
                        ...editingGeneratedQuestion,
                        correct_answer: parseInt(value)
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {editingGeneratedQuestion.options.map((option: string, index: number) => (
                          <SelectItem key={index} value={index.toString()}>
                            选项 {String.fromCharCode(65 + index)}: {option.slice(0, 30)}...
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-topic">主题</Label>
                      <Input
                        id="edit-topic"
                        value={editingGeneratedQuestion.topic}
                        onChange={(e) => setEditingGeneratedQuestion({
                          ...editingGeneratedQuestion,
                          topic: e.target.value
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>难度</Label>
                      <Select
                        value={editingGeneratedQuestion.difficulty}
                        onValueChange={(value) => setEditingGeneratedQuestion({
                          ...editingGeneratedQuestion,
                          difficulty: value
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="easy">简单</SelectItem>
                          <SelectItem value="medium">中等</SelectItem>
                          <SelectItem value="hard">困难</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-source">来源</Label>
                    <Input
                      id="edit-source"
                      value={editingGeneratedQuestion.source}
                      onChange={(e) => setEditingGeneratedQuestion({
                        ...editingGeneratedQuestion,
                        source: e.target.value
                      })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-explanation">题目解析</Label>
                    <Textarea
                      id="edit-explanation"
                      value={editingGeneratedQuestion.explanation}
                      onChange={(e) => setEditingGeneratedQuestion({
                        ...editingGeneratedQuestion,
                        explanation: e.target.value
                      })}
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button onClick={() => handleSaveGeneratedQuestion(editingGeneratedQuestion)}>
                      保存修改
                    </Button>
                    <Button variant="outline" onClick={() => setEditingGeneratedQuestion(null)}>
                      取消
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            {analyticsLoading ? (
              <Card className="bg-gradient-card shadow-card border-0">
                <CardContent className="p-8 text-center">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
                  <p className="text-muted-foreground">加载数据分析中...</p>
                </CardContent>
              </Card>
            ) : analyticsData ? (
              <>
                {/* 总览统计 */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <Card className="bg-gradient-card shadow-card border-0">
                    <CardContent className="p-6 text-center">
                      <BookOpen className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                      <div className="text-2xl font-bold mb-1">{analyticsData.totalQuestions}</div>
                      <div className="text-sm text-muted-foreground">总题目数</div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-gradient-card shadow-card border-0">
                    <CardContent className="p-6 text-center">
                      <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-600" />
                      <div className="text-2xl font-bold mb-1">{analyticsData.activeQuestions}</div>
                      <div className="text-sm text-muted-foreground">活跃题目</div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-gradient-card shadow-card border-0">
                    <CardContent className="p-6 text-center">
                      <BarChart3 className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                      <div className="text-2xl font-bold mb-1">{analyticsData.totalAttempts}</div>
                      <div className="text-sm text-muted-foreground">答题次数</div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-gradient-card shadow-card border-0">
                    <CardContent className="p-6 text-center">
                      <Badge className="w-8 h-8 mx-auto mb-2 text-amber-600" />
                      <div className="text-2xl font-bold mb-1">{analyticsData.averageScore}%</div>
                      <div className="text-sm text-muted-foreground">平均分</div>
                    </CardContent>
                  </Card>
                </div>

                {/* 主题分布 */}
                <Card className="bg-gradient-card shadow-card border-0">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5" />
                      主题分布
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Object.entries(analyticsData.topicCounts).map(([topic, count]: [string, any]) => (
                        <div key={topic} className="flex items-center justify-between">
                          <span className="font-medium">{topic}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-32 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full" 
                                style={{ 
                                  width: `${(count / analyticsData.activeQuestions) * 100}%` 
                                }}
                              ></div>
                            </div>
                            <span className="text-sm text-muted-foreground w-8">{count}</span>
                          </div>
                        </div>
                      ))}
                      {Object.keys(analyticsData.topicCounts).length === 0 && (
                        <p className="text-center text-muted-foreground">暂无主题数据</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* 难度分布 */}
                <Card className="bg-gradient-card shadow-card border-0">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="w-5 h-5" />
                      难度分布
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                      {Object.entries(analyticsData.difficultyCounts).map(([difficulty, count]: [string, any]) => (
                        <Card key={difficulty} className="border">
                          <CardContent className="p-4 text-center">
                            <div className="text-2xl font-bold mb-1">{count}</div>
                            <div className="text-sm text-muted-foreground">
                              {difficulty === 'easy' ? '简单' : 
                               difficulty === 'medium' ? '中等' : '困难'}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* 最近答题趋势 */}
                <Card className="bg-gradient-card shadow-card border-0">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5" />
                      最近7天答题趋势
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {analyticsData.recentResults.length > 0 ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-7 gap-2 text-xs text-center">
                          {analyticsData.recentResults.map((result: any, index: number) => (
                            <div key={index} className="space-y-1">
                              <div className="text-muted-foreground">
                                {new Date(result.date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
                              </div>
                              <div className="bg-blue-100 h-16 flex items-end justify-center rounded">
                                <div 
                                  className="bg-blue-600 w-full rounded-b"
                                  style={{ 
                                    height: `${(result.score / result.total_questions) * 100}%`,
                                    minHeight: '4px'
                                  }}
                                ></div>
                              </div>
                              <div className="text-xs font-medium">
                                {Math.round((result.score / result.total_questions) * 100)}%
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-center text-muted-foreground py-8">
                        最近7天暂无答题记录
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* 刷新按钮 */}
                <div className="text-center">
                  <Button onClick={fetchAnalytics} variant="outline">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    刷新数据
                  </Button>
                </div>
              </>
            ) : (
              <Card className="bg-gradient-card shadow-card border-0">
                <CardContent className="p-8 text-center">
                  <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">数据加载失败</h3>
                  <p className="text-muted-foreground mb-4">无法获取分析数据</p>
                  <Button onClick={fetchAnalytics}>
                    重试
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;