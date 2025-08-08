import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, PlayCircle, History, Star, Brain, Heart, User, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import heroImage from "@/assets/hero-family.jpg";
import { supabase } from "@/integrations/supabase/client";
import AnnouncementBanner, { Announcement } from "@/components/AnnouncementBanner";
import ReferenceBookCard, { ReferenceBook } from "@/components/ReferenceBookCard";

const Index = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, signOut } = useAuth();
  const { toast } = useToast();
  const [userStats] = useState({
    totalQuizzes: 12,
    averageScore: 85,
    bestScore: 95,
    streak: 5
  });

  // 新增：运营公告 & 推荐参考书籍
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [books, setBooks] = useState<ReferenceBook[]>([]);

  useEffect(() => {
    // 有效公告（RLS 已限制仅返回有效）
    supabase
      .from('announcements')
      .select('*')
      .order('starts_at', { ascending: false })
      .limit(3)
      .then(({ data, error }) => {
        if (error) {
          console.error('fetch announcements error:', error);
          return;
        }
        setAnnouncements((data || []) as any);
      });

    // 推荐参考书籍（is_active=true，由 RLS 控制）
    supabase
      .from('reference_books')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(6)
      .then(({ data, error }) => {
        if (error) {
          console.error('fetch books error:', error);
          return;
        }
        setBooks((data || []) as any);
      });
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "已退出登录",
        description: "感谢使用，期待你的下次访问！",
      });
    } catch (error) {
      toast({
        title: "退出失败",
        description: "请稍后重试",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-card">
        {/* Background Image */}
        <div 
          className="absolute inset-0 opacity-10 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="container mx-auto px-4 py-16 relative z-10">
          {/* User Status */}
          <div className="flex justify-end mb-4">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="w-4 h-4" />
                  <span>{user?.user_metadata?.display_name || user?.email}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSignOut}
                  className="flex items-center gap-1"
                >
                  <LogOut className="w-4 h-4" />
                  退出
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                onClick={() => navigate("/auth")}
                className="flex items-center gap-2"
              >
                <User className="w-4 h-4" />
                登录/注册
              </Button>
            )}
          </div>

          {/* 新增：运营公告横幅（最多3条） */}
          {announcements.length > 0 && (
            <div className="mb-6 space-y-3">
              {announcements.map((a) => (
                <AnnouncementBanner key={a.id} announcement={a} />
              ))}
            </div>
          )}

          <div className="text-center max-w-4xl mx-auto">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center shadow-float">
                  <Heart className="w-10 h-10 text-primary-foreground" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-accent rounded-full flex items-center justify-center">
                  <Star className="w-4 h-4 text-accent-foreground" />
                </div>
              </div>
            </div>
            
            <h1 className="text-5xl font-bold text-foreground mb-4 leading-tight">
              亲子教育知识
              <span className="text-primary block">智慧问答</span>
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              专为家长打造的趣味答题平台，在游戏中提升亲子教育技能
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button 
                variant="hero" 
                size="hero"
                onClick={() => navigate("/quiz")}
                className="group"
              >
                <PlayCircle className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                开始答题挑战
              </Button>
              
              <Button 
                variant="playful" 
                size="lg"
                onClick={() => navigate("/history")}
              >
                <History className="w-5 h-5" />
                查看答题记录
              </Button>
              
              {isAuthenticated && (
                <Button 
                  variant="outline" 
                  size="lg"
                  onClick={() => navigate("/admin")}
                >
                  管理后台
                </Button>
              )}
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <Card className="bg-gradient-card shadow-card border-0 hover:shadow-float transition-all">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-primary mb-1">{userStats.totalQuizzes}</div>
                  <div className="text-sm text-muted-foreground">总答题次数</div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-card shadow-card border-0 hover:shadow-float transition-all">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-primary mb-1">{userStats.averageScore}</div>
                  <div className="text-sm text-muted-foreground">平均分数</div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-card shadow-card border-0 hover:shadow-float transition-all">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-primary mb-1">{userStats.bestScore}</div>
                  <div className="text-sm text-muted-foreground">最高分数</div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-card shadow-card border-0 hover:shadow-float transition-all">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-primary mb-1">{userStats.streak}</div>
                  <div className="text-sm text-muted-foreground">连续答题</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">平台特色</h2>
        
        <div className="grid md:grid-cols-3 gap-8">
          <Card className="bg-gradient-card shadow-card border-0 hover:shadow-float transition-all group">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Brain className="w-8 h-8 text-primary-foreground" />
              </div>
              <CardTitle className="text-xl">专业题库</CardTitle>
              <CardDescription>
                基于权威亲子教育书籍，涵盖各年龄段育儿知识
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-gradient-card shadow-card border-0 hover:shadow-float transition-all group">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-gradient-accent rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Trophy className="w-8 h-8 text-accent-foreground" />
              </div>
              <CardTitle className="text-xl">趣味排名</CardTitle>
              <CardDescription>
                幽默有趣的称号系统，让学习变得更有意思
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-gradient-card shadow-card border-0 hover:shadow-float transition-all group">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Heart className="w-8 h-8 text-secondary-foreground" />
              </div>
              <CardTitle className="text-xl">个性建议</CardTitle>
              <CardDescription>
                根据答题情况提供针对性的学习建议和资源推荐
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>

      {/* 新增：推荐参考书籍 */}
      {books.length > 0 && (
        <div className="container mx-auto px-4 pb-16">
          <h2 className="text-3xl font-bold text-center mb-12">推荐参考书籍</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {books.map((b) => (
              <ReferenceBookCard key={b.id} book={b} />
            ))}
          </div>
        </div>
      )}

      {/* CTA Section */}
      <div className="bg-gradient-accent py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-accent-foreground mb-4">
            准备好开始学习了吗？
          </h2>
          <p className="text-lg text-accent-foreground/80 mb-8">
            每次8道精选题目，只需5分钟，提升你的育儿智慧
          </p>
          <Button 
            variant="hero" 
            size="hero"
            onClick={() => navigate("/quiz")}
            className="bg-primary hover:bg-primary/90"
          >
            <PlayCircle className="w-6 h-6" />
            立即开始答题
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
