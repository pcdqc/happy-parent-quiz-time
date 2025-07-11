import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Question {
  id: string;
  title: string;
  options: string[];
  correct_answer: number;
  explanation: string;
  topic: string;
  difficulty: string;
  source: string;
}

export const useQuestions = (count: number = 8) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchQuestions();
  }, [count]);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('questions')
        .select('*')
        .eq('is_active', true)
        .limit(count);

      if (fetchError) throw fetchError;

      if (!data || data.length === 0) {
        setError('暂无题目，请联系管理员录入题目');
        setQuestions([]);
        return;
      }

      // Randomly shuffle and select questions
      const shuffled = data.sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, Math.min(count, shuffled.length));
      
      setQuestions(selected as Question[]);
    } catch (error: any) {
      console.error('Error fetching questions:', error);
      setError('获取题目失败，请稍后重试');
      toast({
        title: "获取题目失败",
        description: "无法获取题目数据，请稍后重试",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const refetchQuestions = () => {
    fetchQuestions();
  };

  return {
    questions,
    loading,
    error,
    refetchQuestions,
  };
};