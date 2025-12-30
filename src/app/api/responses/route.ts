import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const responsesFilePath = path.join(process.cwd(), 'src/data/responses.json');

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const role = searchParams.get('role');
    
    const fileContent = await fs.readFile(responsesFilePath, 'utf-8');
    const data = JSON.parse(fileContent);
    
    // 관리자는 모든 응답 조회 가능
    if (role === 'admin') {
      return NextResponse.json(data);
    }
    
    // 일반 사용자는 본인 응답만 조회
    const userResponses = data.responses.filter(
      (r: any) => r.userId === userId
    );
    
    return NextResponse.json({ responses: userResponses });
  } catch (error) {
    return NextResponse.json(
      { responses: [] },
      { status: 200 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const newResponse = await request.json();
    
    let data;
    try {
      const fileContent = await fs.readFile(responsesFilePath, 'utf-8');
      data = JSON.parse(fileContent);
    } catch {
      data = { responses: [] };
    }
    
    // 같은 날짜에 같은 사용자의 응답이 있는지 확인
    const existingIndex = data.responses.findIndex(
      (r: any) => r.userId === newResponse.userId && r.date === newResponse.date
    );
    
    if (existingIndex !== -1) {
      // 기존 응답 업데이트
      data.responses[existingIndex] = newResponse;
    } else {
      // 새 응답 추가
      data.responses.push(newResponse);
    }
    
    await fs.writeFile(responsesFilePath, JSON.stringify(data, null, 2));
    
    return NextResponse.json({ success: true, data: newResponse });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: '응답 저장 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
