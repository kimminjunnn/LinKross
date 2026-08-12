import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { analyzeWorkDetail, generateSOWWithRAGAsync } from '@/lib/rag-translator';

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'EXP_5_Example_Scenario.txt');
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // Split by the separators (=====...)
    const chunks = content.split(/={10,}/);
    
    const results = [];
    
    for (let i = 0; i < chunks.length; i++) {
      const text = chunks[i].trim();
      if (!text) continue;
      
      const analysis = analyzeWorkDetail(text, "2026.08.12", "2026.12.31");
      const sow = await generateSOWWithRAGAsync(text, "2026.08.12", "2026.12.31", analysis.milestones);
      
      results.push({
        id: `Example_${i}`,
        original: text.substring(0, 200) + '...',
        fullOriginal: text,
        analysis,
        sow
      });
    }
    
    return NextResponse.json({ success: true, results });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
