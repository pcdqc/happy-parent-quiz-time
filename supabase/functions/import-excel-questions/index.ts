import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import * as XLSX from 'https://cdn.sheetjs.com/xlsx-0.19.3/package/xlsx.mjs'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { file, filename } = await req.json()
    
    if (!file) {
      throw new Error('未提供文件')
    }

    // 将base64或ArrayBuffer转换为Uint8Array
    const fileData = new Uint8Array(file)
    
    // 使用SheetJS解析Excel文件
    const workbook = XLSX.read(fileData, { type: 'array' })
    const firstSheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[firstSheetName]
    
    // 将工作表转换为JSON
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][]
    
    if (data.length < 2) {
      throw new Error('文件格式错误：至少需要标题行和数据行')
    }

    const headers = data[0]
    const expectedHeaders = [
      '题目内容', '选项A', '选项B', '选项C', '选项D', 
      '正确答案', '题目解析', '主题', '难度', '来源'
    ]

    // 验证标题行
    for (let i = 0; i < expectedHeaders.length; i++) {
      if (headers[i] !== expectedHeaders[i]) {
        throw new Error(`文件格式错误：第${i + 1}列应为"${expectedHeaders[i]}"，但实际为"${headers[i] || ''}"`)
      }
    }

    const questions = []
    const errors = []

    for (let i = 1; i < data.length; i++) {
      const row = data[i]
      if (row.length === 0 || row.every(cell => !cell?.toString().trim())) {
        continue // 跳过空行
      }

      try {
        const [
          title,
          optionA,
          optionB,
          optionC,
          optionD,
          correctAnswer,
          explanation,
          topic,
          difficulty,
          source
        ] = row

        // 验证必填字段
        if (!title?.trim()) {
          errors.push(`第${i + 1}行：题目内容不能为空`)
          continue
        }

        if (!optionA?.trim() || !optionB?.trim()) {
          errors.push(`第${i + 1}行：至少需要2个选项`)
          continue
        }

        const options = [optionA, optionB, optionC, optionD]
          .filter(opt => opt?.trim())
          .map(opt => opt.trim())

        if (options.length < 2) {
          errors.push(`第${i + 1}行：至少需要2个有效选项`)
          continue
        }

        // 验证正确答案
        let correctIndex = -1
        if (typeof correctAnswer === 'string') {
          const upperAnswer = correctAnswer.toUpperCase()
          if (upperAnswer >= 'A' && upperAnswer <= 'D') {
            correctIndex = upperAnswer.charCodeAt(0) - 'A'.charCodeAt(0)
          } else if (!isNaN(parseInt(correctAnswer))) {
            correctIndex = parseInt(correctAnswer)
          }
        } else if (typeof correctAnswer === 'number') {
          correctIndex = Math.floor(correctAnswer)
        }

        if (correctIndex < 0 || correctIndex >= options.length) {
          errors.push(`第${i + 1}行：正确答案必须是0-${options.length - 1}之间的整数或对应字母`)
          continue
        }

        // 验证难度
        const validDifficulties = ['easy', 'medium', 'hard']
        let normalizedDifficulty = difficulty?.toLowerCase().trim()
        if (normalizedDifficulty === '简单') normalizedDifficulty = 'easy'
        else if (normalizedDifficulty === '中等') normalizedDifficulty = 'medium'
        else if (normalizedDifficulty === '困难') normalizedDifficulty = 'hard'
        
        if (!validDifficulties.includes(normalizedDifficulty)) {
          normalizedDifficulty = 'medium' // 默认中等
        }

        // 验证主题
        if (!topic?.trim()) {
          errors.push(`第${i + 1}行：主题不能为空`)
          continue
        }

        questions.push({
          title: title.trim(),
          options: options,
          correct_answer: correctIndex,
          explanation: explanation?.trim() || '暂无解析',
          topic: topic.trim(),
          difficulty: normalizedDifficulty,
          source: source?.trim() || 'Excel导入',
          created_at: new Date().toISOString()
        })

      } catch (error) {
        errors.push(`第${i + 1}行：${error.message}`)
      }
    }

    if (questions.length === 0 && errors.length > 0) {
      throw new Error(`所有题目都验证失败：\n${errors.join('\n')}`)
    }

    return new Response(
      JSON.stringify({
        success: true,
        questions: questions,
        errors: errors.length > 0 ? errors : undefined,
        total: data.length - 1,
        valid: questions.length,
        invalid: errors.length
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Excel处理错误:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || '处理Excel文件时发生错误'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})