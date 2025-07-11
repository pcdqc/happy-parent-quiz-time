import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, ArrowRight, ArrowLeft, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";

// 模拟题库数据
const sampleQuestions = [
  {
    id: 1,
    question: "当孩子发脾气时，最有效的处理方式是什么？",
    options: [
      "立即制止并严厉批评",
      "保持冷静，等孩子情绪稳定后再沟通",
      "不予理睬，让孩子自己冷静",
      "立即满足孩子的要求以平息情绪"
    ],
    correctAnswer: 1,
    explanation: "孩子发脾气时，保持冷静并在情绪稳定后沟通是最有效的方式。这样可以教会孩子情绪管理，同时维护亲子关系。"
  },
  {
    id: 2,
    question: "培养孩子阅读习惯的最佳时期是？",
    options: [
      "3-6岁学前期",
      "6-8岁识字期",
      "8-12岁小学期",
      "越早越好，从婴儿期开始"
    ],
    correctAnswer: 3,
    explanation: "阅读习惯的培养应该越早越好。从婴儿期开始接触书籍，可以培养孩子对阅读的兴趣和专注力。"
  },
  {
    id: 3,
    question: "孩子说谎时，家长应该？",
    options: [
      "立即揭穿并严厉惩罚",
      "假装不知道，避免冲突",
      "了解说谎原因，引导诚实表达",
      "警告下次不许说谎"
    ],
    correctAnswer: 2,
    explanation: "了解孩子说谎的原因很重要。通常孩子说谎是因为害怕、想要保护自己或获得认可。引导孩子诚实表达才是根本解决之道。"
  },
  {
    id: 4,
    question: "表扬孩子时，哪种方式更有效？",
    options: [
      "你真聪明！",
      "你很棒！",
      "你刚才认真思考的过程很棒！",
      "你是最好的孩子！"
    ],
    correctAnswer: 2,
    explanation: "具体的过程性表扬比笼统的结果性表扬更有效。这样可以让孩子明确知道什么行为是被认可的，培养成长型思维。"
  },
  {
    id: 5,
    question: "孩子不愿意分享玩具时，应该？",
    options: [
      "强制要求孩子分享",
      "批评孩子自私",
      "尊重孩子的所有权意识，引导分享的乐趣",
      "取走玩具作为惩罚"
    ],
    correctAnswer: 2,
    explanation: "2-3岁的孩子正在建立所有权意识，这是正常发展。应该尊重这个过程，同时通过游戏等方式让孩子体验分享的快乐。"
  },
  {
    id: 6,
    question: "孩子做错事后，最好的教育方式是？",
    options: [
      "立即指出错误并要求道歉",
      "让孩子承担自然后果，从中学习",
      "严厉批评以免再犯",
      "帮孩子解决问题"
    ],
    correctAnswer: 1,
    explanation: "让孩子承担行为的自然后果是最好的学习方式。这样孩子能够真正理解行为与结果的关系，培养责任感。"
  },
  {
    id: 7,
    question: "培养孩子独立性的关键是？",
    options: [
      "越早让孩子独立越好",
      "根据孩子发展水平逐步放手",
      "完全不干预孩子的事情",
      "只在孩子要求时才帮助"
    ],
    correctAnswer: 1,
    explanation: "培养独立性需要根据孩子的发展水平和能力逐步放手。既要给予支持，又要适度挑战，帮助孩子建立自信。"
  },
  {
    id: 8,
    question: "孩子专注力不足时，最有效的改善方法是？",
    options: [
      "增加学习时间",
      "减少分散注意力的环境因素",
      "严格要求孩子必须专心",
      "使用奖励和惩罚制度"
    ],
    correctAnswer: 1,
    explanation: "专注力需要适合的环境支持。减少分散注意力的因素，创造安静整洁的环境，比强制要求更有效。"
  }
];

const Quiz = () => {
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [startTime] = useState(Date.now());
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  const handleAnswerSelect = (answerIndex: number) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestion] = answerIndex;
    setSelectedAnswers(newAnswers);
  };

  const handleSubmitAnswer = () => {
    setShowExplanation(true);
  };

  const handleNextQuestion = () => {
    if (currentQuestion < sampleQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setShowExplanation(false);
    } else {
      setShowResult(true);
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      setShowExplanation(false);
    }
  };

  const calculateScore = () => {
    return selectedAnswers.reduce((score, answer, index) => {
      return score + (answer === sampleQuestions[index].correctAnswer ? 1 : 0);
    }, 0);
  };

  const getTitle = (score: number) => {
    if (score >= 7) return "社区育儿专家";
    if (score >= 5) return "合格的智慧家长";
    if (score >= 3) return "正在成长的父母";
    return "需要继续学习的家长";
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (showResult) {
    const score = calculateScore();
    const percentage = Math.round((score / sampleQuestions.length) * 100);
    
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
                  {score}/{sampleQuestions.length}
                </div>
                <div className="text-2xl text-muted-foreground mb-4">
                  正确率 {percentage}%
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
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const question = sampleQuestions[currentQuestion];
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
                第 {currentQuestion + 1} 题 / 共 {sampleQuestions.length} 题
              </Badge>
            </div>
          </div>
          <Progress 
            value={((currentQuestion + 1) / sampleQuestions.length) * 100} 
            className="h-2"
          />
        </div>

        {/* Question Card */}
        <Card className="bg-gradient-card shadow-card border-0 mb-6">
          <CardHeader>
            <CardTitle className="text-xl leading-relaxed">
              {question.question}
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-3">
            {question.options.map((option, index) => {
              const isSelected = selectedAnswer === index;
              const isCorrect = index === question.correctAnswer;
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
            onClick={handlePrevQuestion}
            disabled={currentQuestion === 0}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            上一题
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
                {currentQuestion === sampleQuestions.length - 1 ? '查看结果' : '下一题'}
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