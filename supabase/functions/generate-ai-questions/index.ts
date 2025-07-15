import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.5';

const openRouterApiKey = Deno.env.get('OPENROUTER_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenerateQuestionRequest {
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  count: number;
  style?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { topic, difficulty, count, style = "亲子教育" }: GenerateQuestionRequest = await req.json();

    if (!openRouterApiKey) {
      throw new Error('OpenRouter API key not configured');
    }

    const prompt = `作为专业的${style}专家，请生成${count}道关于"${topic}"的${difficulty === 'easy' ? '简单' : difficulty === 'medium' ? '中等' : '困难'}难度的选择题。

要求：
1. 每题有4个选项（A、B、C、D）
2. 只有一个正确答案
3. 提供详细的解释说明
4. 内容要符合中国家庭教育实际情况
5. 语言通俗易懂，贴近生活

请按照以下JSON格式返回，确保是有效的JSON数组：
[
  {
    "title": "题目内容",
    "options": ["选项A", "选项B", "选项C", "选项D"],
    "correct_answer": 0,
    "explanation": "详细解释为什么这个答案是正确的",
    "topic": "${topic}",
    "difficulty": "${difficulty}",
    "source": "AI生成"
  }
]`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://cfgeepsohzudlmsahlrt.supabase.co',
        'X-Title': 'Quiz App',
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-r1',
        messages: [
          { 
            role: 'system', 
            content: '你是一位专业的亲子教育专家，擅长创建高质量的教育测试题目。请严格按照要求的JSON格式返回，不要添加任何其他文字。' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedContent = data.choices[0].message.content;

    // 尝试解析JSON
    let questions;
    try {
      // 清理可能的markdown格式
      const cleanContent = generatedContent
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      
      questions = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      throw new Error('Failed to parse generated questions');
    }

    // 验证生成的题目格式
    if (!Array.isArray(questions)) {
      throw new Error('Generated content is not an array');
    }

    const validatedQuestions = questions.map((q, index) => {
      if (!q.title || !Array.isArray(q.options) || q.options.length !== 4 || 
          typeof q.correct_answer !== 'number' || !q.explanation) {
        throw new Error(`Invalid question format at index ${index}`);
      }
      
      return {
        title: q.title,
        options: q.options,
        correct_answer: q.correct_answer,
        explanation: q.explanation,
        topic: q.topic || topic,
        difficulty: q.difficulty || difficulty,
        source: q.source || 'AI生成'
      };
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        questions: validatedQuestions,
        count: validatedQuestions.length 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-ai-questions function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        details: 'Failed to generate questions'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});