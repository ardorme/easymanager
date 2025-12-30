import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Easy Manager - 일일 설문',
  description: '간편한 일일 설문 관리 시스템',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}
