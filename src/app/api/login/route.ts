import { NextResponse } from 'next/server';
import users from '@/data/users.json';

export async function POST(request: Request) {
  try {
    const { id, password } = await request.json();
    
    const user = users.users.find(
      (u) => u.id === id && u.password === password
    );
    
    if (user) {
      const { password: _, ...userWithoutPassword } = user;
      return NextResponse.json({ 
        success: true, 
        user: userWithoutPassword 
      });
    }
    
    return NextResponse.json(
      { success: false, message: '아이디 또는 비밀번호가 올바르지 않습니다.' },
      { status: 401 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: '로그인 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
