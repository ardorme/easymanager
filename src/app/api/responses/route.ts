// src/app/api/responses/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const role = searchParams.get('role');
    
    let query = supabase
      .from('t_str_response')
      .select('*')
      .order('date', { ascending: false });
    
    // 일반 사용자는 본인 응답만 조회
    if (role !== 'admin' && userId) {
      query = query.eq('user_id', userId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Supabase GET error:', error);
      return NextResponse.json({ responses: [] });
    }
    
    // 데이터 변환 (DB 컬럼명 → 앱 형식)
    const responses = (data || []).map(row => ({
      userId: row.user_id,
      userName: row.user_name || '',
      date: row.date,
      scores: row.answers || [],  // answers → scores로 변환
      reflection: row.reflection || '',
      timestamp: row.created_at
    }));
    
    return NextResponse.json({ responses });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ responses: [] }, { status: 200 });
  }
}

export async function POST(request: Request) {
  try {
    const newResponse = await request.json();
    console.log('받은 데이터:', newResponse);
    
    const { userId, userName, date, scores, reflection, timestamp } = newResponse;
    
    // scores가 제대로 전달되었는지 확인
    if (!scores || scores.length === 0) {
      console.error('scores 데이터가 없습니다:', newResponse);
      return NextResponse.json(
        { success: false, message: '점수 데이터가 없습니다.' },
        { status: 400 }
      );
    }
    
    // UPSERT: 같은 userId와 date가 있으면 업데이트, 없으면 삽입
    const { data, error } = await supabase
      .from('t_str_response')
      .upsert(
        {
          user_id: userId,
          user_name: userName,
          date: date,
          answers: scores,  // scores를 answers에 저장
          reflection: reflection || '',
          created_at: timestamp,
          updated_at: new Date().toISOString()
        },
        {
          onConflict: 'user_id,date'
        }
      )
      .select();
    
    if (error) {
      console.error('Supabase POST error:', error);
      return NextResponse.json(
        { success: false, message: '응답 저장 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }
    
    console.log('저장 성공:', data);
    
    return NextResponse.json({ success: true, data: newResponse });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { success: false, message: '응답 저장 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
