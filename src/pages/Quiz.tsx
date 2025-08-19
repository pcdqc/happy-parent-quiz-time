import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, ArrowRight, ArrowLeft, Clock, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuestions } from "@/hooks/useQuestions";


const Quiz = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const { questions, loading, error } = useQuestions(8);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [startTime] = useState(Date.now());
  const [timer, setTimer] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (showResult) return; // 答题结束后停止计时
    
    const interval = setInterval(() => {
      setTimer(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime, showResult]);

  const handleAnswerSelect = (answerIndex: number) => {
    // 如果已经显示了解析，不允许修改答案
    if (showExplanation) return;
    
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestion] = answerIndex;
    setSelectedAnswers(newAnswers);
  };

  const handleSubmitAnswer = () => {
    setShowExplanation(true);
  };

  const handleNextQuestion = async () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setShowExplanation(false);
    } else {
      setShowResult(true);
      // Save quiz result when quiz is completed
      const score = calculateScore();
      await saveQuizResult(score, selectedAnswers);
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      setShowExplanation(false);
    }
  };

  // 添加导航保护
  const handleExitQuiz = () => {
    if (currentQuestion > 0 && !showResult) {
      const confirmed = window.confirm('您确定要退出答题吗？您的进度将不会被保存。');
      if (confirmed) {
        navigate('/');
      }
    } else {
      navigate('/');
    }
  };

  const calculateScore = () => {
    return selectedAnswers.reduce((score, answer, index) => {
      return score + (answer === questions[index].correct_answer ? 1 : 0);
    }, 0);
  };

  const getTitle = (score: number) => {
    if (score >= 7) return "社区育儿专家";
    if (score >= 5) return "合格的智慧家长";
    if (score >= 3) return "正在成长的父母";
    return "需要继续学习的家长";
  };

  const saveQuizResult = async (score: number, answers: number[]) => {
    if (!isAuthenticated || !user) {
      toast({
        title: "提示",
        description: "登录后可保存答题记录",
      });
      return;
    }

    setIsSaving(true);
    try {
      const quizData = {
        user_id: user.id,
        score,
        total_questions: questions.length,
        title: getTitle(score),
        answers: answers.map((answer, index) => ({
          question_id: questions[index].id,
          question: questions[index].title,
          selected_answer: answer,
          correct_answer: questions[index].correct_answer,
          is_correct: answer === questions[index].correct_answer,
          explanation: questions[index].explanation,
        })),
        date: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('quiz_results')
        .insert([quizData]);

      if (error) throw error;

      toast({
        title: "记录已保存",
        description: "你的答题记录已成功保存",
      });
    } catch (error: any) {
      console.error('Error saving quiz result:', error);
      toast({
        title: "保存失败",
        description: "答题记录保存失败，请稍后重试",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-center">
            <div className="text-lg text-muted-foreground">正在获取题目...</div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || questions.length === 0) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="container mx-auto px-4 max-w-2xl">
          <Card className="bg-gradient-card shadow-float border-0 text-center">
            <CardContent className="p-8">
              <AlertCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-bold mb-2">暂无题目</h3>
              <p className="text-muted-foreground mb-6">
                {error || "暂无题目，请联系管理员录入题目"}
              </p>
              <div className="flex gap-3 justify-center">
                <Button onClick={() => navigate("/")}>
                  返回首页
                </Button>
                <Button variant="outline" onClick={() => window.location.reload()}>
                  重新加载
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (showResult) {
    const score = calculateScore();
    
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="container mx-auto px-4 max-w-2xl">
          <Card className="bg-gradient-card shadow-float border-0">
            <CardHeader className="text-center pb-6">
              <div className="w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-primary-foreground" />
              </div>
              <CardTitle className="text-3xl font-bold text-primary mb-2">
                恭喜完成答题！
              </CardTitle>
              <Badge variant="secondary" className="text-lg px-4 py-2">
                {getTitle(score)}
              </Badge>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="text-center">
                <div className="text-6xl font-bold text-primary mb-2">
                  {score}/{questions.length}
                </div>
                <div className="text-2xl text-muted-foreground mb-4">
                  正确率 {Math.round((score / questions.length) * 100)}%
                </div>
                <div className="flex justify-center items-center gap-4 text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    用时 {formatTime(timer)}
                  </div>
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <h3 className="font-semibold mb-2">学习建议：</h3>
                <p className="text-muted-foreground">
                  {score >= 7 
                    ? "您已经掌握了很好的亲子教育知识！建议继续关注更深层次的育儿话题。"
                    : score >= 5
                    ? "您有不错的基础，建议多阅读《正面管教》等经典育儿书籍。"
                    : "建议从《父母的语言》开始，系统学习亲子沟通技巧。"
                  }
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  variant="default" 
                  size="lg" 
                  onClick={() => window.location.reload()}
                  className="flex-1"
                >
                  再次挑战
                </Button>
                <Button 
                  variant="playful" 
                  size="lg"
                  onClick={() => navigate("/history")}
                  className="flex-1"
                >
                  查看详情
                </Button>
                <Button 
                  variant="secondary" 
                  size="lg"
                  onClick={() => navigate("/")}
                  className="flex-1"
                >
                  返回首页
                </Button>
              </div>
              <div className="flex gap-3 mt-4">
                <Button 
                  variant="outline" 
                  size="lg"
                  onClick={async () => {
                    const score = calculateScore();
                    await saveQuizResult(score, selectedAnswers);
                    navigate("/history");
                  }}
                  className="flex-1"
                >
                  保存并分享
                </Button>
                <Button 
                  variant="secondary" 
                  size="lg"
                  onClick={async () => {
                    const score = calculateScore();
                    await saveQuizResult(score, selectedAnswers);
                    const url = `${window.location.origin}/happy-parent-quiz-time/share/${user?.id || 'anonymous'}`;
                    await navigator.clipboard.writeText(url);
                    toast({
                      title: "分享链接已复制",
                      description: "可以将成绩分享给朋友了！",
                    });
                  }}
                  className="flex-1"
                >
                  一键分享
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const question = questions[currentQuestion];
  const selectedAnswer = selectedAnswers[currentQuestion];
  const isAnswered = selectedAnswer !== undefined;

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-3xl">
        {/* Progress Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold">亲子教育知识问答</h1>
            <div className="flex items-center gap-4 text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {formatTime(timer)}
              </div>
                <Badge variant="outline">
                  第 {currentQuestion + 1} 题 / 共 {questions.length} 题
                </Badge>
            </div>
          </div>
            <Progress 
              value={((currentQuestion + 1) / questions.length) * 100} 
              className="h-2"
            />
        </div>

        {/* Question Card */}
          <Card className="bg-gradient-card shadow-card border-0 mb-6">
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-xl leading-relaxed">
                  {question.title}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-destructive ml-4"
                  onClick={() => {
                    toast({
                      title: "举报功能",
                      description: "举报功能即将上线，请稍后再试",
                    });
                  }}
                >
                  <AlertCircle className="w-4 h-4 mr-1" />
                  举报
                </Button>
              </div>
            </CardHeader>
          
          <CardContent className="space-y-3">
              {question.options.map((option, index) => {
                const isSelected = selectedAnswer === index;
                const isCorrect = index === question.correct_answer;
              const isWrong = showExplanation && isSelected && !isCorrect;
              
              return (
                <Button
                  key={index}
                  variant={isSelected ? "default" : "outline"}
                  className={`
                    w-full justify-start text-left h-auto p-4 
                    ${showExplanation && isCorrect ? 'bg-green-100 border-green-500 text-green-800' : ''}
                    ${isWrong ? 'bg-red-100 border-red-500 text-red-800' : ''}
                    ${!showExplanation && isSelected ? 'bg-primary text-primary-foreground' : ''}
                  `}
                  onClick={() => !showExplanation && handleAnswerSelect(index)}
                  disabled={showExplanation}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full border-2 flex items-center justify-center text-sm font-bold">
                      {String.fromCharCode(65 + index)}
                    </div>
                    <span>{option}</span>
                    {showExplanation && isCorrect && (
                      <CheckCircle className="w-5 h-5 text-green-600 ml-auto" />
                    )}
                    {isWrong && (
                      <XCircle className="w-5 h-5 text-red-600 ml-auto" />
                    )}
                  </div>
                </Button>
              );
            })}
          </CardContent>
        </Card>

        {/* Explanation */}
        {showExplanation && (
          <Card className="bg-accent/50 border-accent shadow-card mb-6">
            <CardContent className="p-6">
              <h3 className="font-semibold text-accent-foreground mb-2">题目解析：</h3>
              <p className="text-accent-foreground/80">{question.explanation}</p>
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={currentQuestion === 0 ? handleExitQuiz : handlePrevQuestion}
            disabled={currentQuestion === 0 && showResult}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            {currentQuestion === 0 ? '退出' : '上一题'}
          </Button>

          <div className="flex gap-3">
            {!showExplanation ? (
              <Button
                onClick={handleSubmitAnswer}
                disabled={!isAnswered}
                size="lg"
              >
                提交答案
              </Button>
            ) : (
              <Button
                onClick={handleNextQuestion}
                size="lg"
                className="flex items-center gap-2"
              >
                {currentQuestion === questions.length - 1 ? '查看结果' : '下一题'}
                <ArrowRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Quiz;