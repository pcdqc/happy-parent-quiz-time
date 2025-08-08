import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Trophy, 
  Calendar, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Share2,
  ArrowLeft,
  Download,
  Heart
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import heroImage from "@/assets/hero-family.jpg";

interface SharedResult {
  id: string;
  title: string;
  score: number;
  total_questions: number;
  date: string;
  shareable_name: string;
  answers: {
    question: string;
    user_answer: number;
    correct_answer: number;
    is_correct: boolean;
    explanation: string;
  }[];
  likes_count?: number;
  views_count?: number;
}

const Share = () => {
  const { shareId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [result, setResult] = useState<SharedResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [likeCount, setLikeCount] = useState(0);
  const [viewsCount, setViewsCount] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);

  useEffect(() => {
    if (shareId) {
      fetchSharedResult();
    }
  }, [shareId]);

  const fetchSharedResult = async () => {
    try {
      const { data, error } = await supabase
        .from('quiz_results')
        .select('*')
        .eq('shareable_name', shareId)
        .single();

      if (error) {
        console.error('Error fetching shared result:', error);
        toast({
          title: "错误",
          description: "无法找到分享的答题记录",
          variant: "destructive",
        });
        return;
      }

      const mapped = {
        ...data,
        answers: Array.isArray(data.answers) ? data.answers.map((ans: any) => ({
          question: ans.question || '',
          user_answer: ans.user_answer || 0,
          correct_answer: ans.correct_answer || 0,
          is_correct: ans.is_correct || false,
          explanation: ans.explanation || ''
        })) : [],
        likes_count: data.likes_count ?? 0,
        views_count: data.views_count ?? 0,
      } as SharedResult;

      setResult(mapped);
      setLikeCount(mapped.likes_count || 0);
      setViewsCount(mapped.views_count || 0);

      // 初始化本地点赞状态
      const likedKey = `share_liked_${shareId}`;
      setHasLiked(localStorage.getItem(likedKey) === '1');
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "错误",
        description: "加载分享内容失败",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // 浏览量上报（同一浏览器仅一次）
  useEffect(() => {
    const viewedKey = `share_viewed_${shareId}`;
    if (shareId && result && !localStorage.getItem(viewedKey)) {
      supabase.rpc('increment_share_metric', { p_shareable_name: shareId, p_metric: 'view' })
        .then(({ error }) => {
          if (error) {
            console.error('increment view error:', error);
            return;
          }
          localStorage.setItem(viewedKey, '1');
          setViewsCount((v) => v + 1);
        });
    }
  }, [shareId, result]);

  const handleLike = () => {
    if (!shareId || hasLiked) return;
    supabase.rpc('increment_share_metric', { p_shareable_name: shareId, p_metric: 'like' })
      .then(({ error }) => {
        if (error) {
          console.error('increment like error:', error);
          return;
        }
        setLikeCount(prev => prev + 1);
        setHasLiked(true);
        localStorage.setItem(`share_liked_${shareId}`, '1');
        toast({
          title: "已点赞",
          description: "感谢你的支持！",
        });
      });
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${result?.shareable_name}的答题成绩`,
          text: `我在亲子教育测试中得了${result?.score}/${result?.total_questions}分！`,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: "链接已复制",
          description: "分享链接已复制到剪贴板",
        });
      }
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  const generateCertificate = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx || !result) return;

    canvas.width = 800;
    canvas.height = 600;

    // 背景渐变
    const gradient = ctx.createLinearGradient(0, 0, 800, 600);
    gradient.addColorStop(0, '#E8F5E8');
    gradient.addColorStop(1, '#F0F9FF');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 800, 600);

    // 边框
    ctx.strokeStyle = '#10B981';
    ctx.lineWidth = 8;
    ctx.strokeRect(20, 20, 760, 560);

    // 标题
    ctx.fillStyle = '#1F2937';
    ctx.font = 'bold 36px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('亲子教育学习证书', 400, 120);

    // 姓名
    ctx.font = 'bold 28px Arial';
    ctx.fillText(`${result.shareable_name}`, 400, 200);

    // 成绩
    ctx.font = '24px Arial';
    ctx.fillText(`在《${result.title}》测试中`, 400, 260);
    ctx.fillText(`获得 ${result.score}/${result.total_questions} 分`, 400, 300);

    // 正确率
    const accuracy = Math.round((result.score / result.total_questions) * 100);
    ctx.fillText(`正确率：${accuracy}%`, 400, 340);

    // 日期
    ctx.font = '18px Arial';
    ctx.fillText(`完成日期：${new Date(result.date).toLocaleDateString('zh-CN')}`, 400, 450);

    // 下载证书
    const link = document.createElement('a');
    link.download = `${result.shareable_name}-亲子教育证书.png`;
    link.href = canvas.toDataURL();
    link.click();

    toast({
      title: "证书已生成",
      description: "学习证书已下载到您的设备",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <XCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">未找到分享内容</h2>
            <p className="text-muted-foreground mb-4">该分享链接可能已失效或不存在</p>
            <Button onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回首页
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const accuracy = Math.round((result.score / result.total_questions) * 100);
  const getScoreColor = (accuracy: number) => {
    if (accuracy >= 90) return "text-green-600";
    if (accuracy >= 70) return "text-blue-600";
    if (accuracy >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBadge = (accuracy: number) => {
    if (accuracy >= 90) return { text: "优秀", variant: "default" as const };
    if (accuracy >= 70) return { text: "良好", variant: "secondary" as const };
    if (accuracy >= 60) return { text: "及格", variant: "outline" as const };
    return { text: "需要提高", variant: "destructive" as const };
  };

  const scoreBadge = getScoreBadge(accuracy);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
      <div className="relative h-64 bg-gradient-to-r from-green-600 to-blue-600 overflow-hidden">
        <img 
          src={heroImage} 
          alt="Family" 
          className="absolute inset-0 w-full h-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative z-10 container mx-auto px-4 h-full flex items-center">
          <div className="text-white">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/')}
              className="text-white hover:bg-white/20 mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回首页
            </Button>
            <h1 className="text-3xl font-bold mb-2">学习成果分享</h1>
            <p className="text-green-100">见证每一次成长与进步</p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 -mt-16 relative z-10">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* 成绩卡片 */}
          <Card className="shadow-lg border-0">
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src="" />
                  <AvatarFallback className="text-2xl bg-gradient-to-br from-green-500 to-blue-500 text-white">
                    {result.shareable_name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              </div>
              <CardTitle className="text-2xl">{result.shareable_name}</CardTitle>
              <p className="text-muted-foreground">完成了《{result.title}》测试</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="text-center">
                  <Trophy className={`h-8 w-8 mx-auto mb-2 ${getScoreColor(accuracy)}`} />
                  <div className="text-2xl font-bold mb-1">
                    <span className={getScoreColor(accuracy)}>
                      {result.score}/{result.total_questions}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">答对题数</p>
                </div>
                <div className="text-center">
                  <CheckCircle className={`h-8 w-8 mx-auto mb-2 ${getScoreColor(accuracy)}`} />
                  <div className="text-2xl font-bold mb-1">
                    <span className={getScoreColor(accuracy)}>{accuracy}%</span>
                  </div>
                  <p className="text-sm text-muted-foreground">正确率</p>
                </div>
                <div className="text-center">
                  <Calendar className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                  <div className="text-lg font-bold mb-1">
                    {new Date(result.date).toLocaleDateString('zh-CN')}
                  </div>
                  <p className="text-sm text-muted-foreground">完成日期</p>
                </div>
              </div>

              <div className="text-center mb-2">
                <div className="text-sm text-muted-foreground">
                  浏览 {viewsCount} 次 · 获得 {likeCount} 个点赞
                </div>
              </div>

              <div className="flex flex-wrap justify-center gap-4">
                <Button onClick={handleLike} variant="outline" disabled={hasLiked}>
                  <Heart className={`h-4 w-4 mr-2 ${hasLiked ? 'fill-red-500 text-red-500' : ''}`} />
                  点赞 {likeCount > 0 && `(${likeCount})`}
                </Button>
                <Button onClick={handleShare} variant="outline">
                  <Share2 className="h-4 w-4 mr-2" />
                  分享
                </Button>
                <Button onClick={generateCertificate} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  生成证书
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 答题详情 */}
          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                答题详情
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {result.answers.map((answer, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-semibold text-lg">
                      第{index + 1}题: {answer.question}
                    </h4>
                    {answer.is_correct ? (
                      <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0" />
                    ) : (
                      <XCircle className="h-6 w-6 text-red-600 flex-shrink-0" />
                    )}
                  </div>
                  
                  <div className="space-y-2 mb-3">
                    <div className={`p-2 rounded ${answer.is_correct ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} border`}>
                      <span className="text-sm font-medium">
                        {answer.is_correct ? '✓ 回答正确' : '✗ 回答错误'}
                      </span>
                    </div>
                    {!answer.is_correct && (
                      <div className="p-2 rounded bg-blue-50 border-blue-200 border">
                        <span className="text-sm font-medium text-blue-800">
                          正确答案：选项 {String.fromCharCode(65 + answer.correct_answer)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-sm font-medium mb-1">解析：</p>
                    <p className="text-sm text-gray-700">{answer.explanation}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 bg-gradient-to-r from-green-50 to-blue-50">
            <CardContent className="pt-6 text-center">
              <Trophy className="h-12 w-12 text-amber-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">学习永不止步</h3>
              <p className="text-muted-foreground mb-4">
                每一次练习都是成长的机会，继续加油！
              </p>
              <Button onClick={() => navigate('/quiz')}>
                开始新的挑战
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Share;
