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
  Loader2
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
        options: Array.isArray(q.options) ? q.options : []
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
            <Card className="bg-gradient-card shadow-card border-0 text-center">
              <CardContent className="p-8">
                <Brain className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-bold mb-2">AI题目生成功能</h3>
                <p className="text-muted-foreground mb-6">
                  此功能正在开发中，即将上线
                </p>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    未来将支持基于参考书籍自动生成高质量题目
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <Card className="bg-gradient-card shadow-card border-0 text-center">
              <CardContent className="p-8">
                <BarChart3 className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-bold mb-2">数据分析功能</h3>
                <p className="text-muted-foreground mb-6">
                  此功能正在开发中，即将上线
                </p>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    未来将提供用户答题统计、题目难度分析等功能
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;