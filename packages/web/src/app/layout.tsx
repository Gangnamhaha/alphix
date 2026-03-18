import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Alphix',
  description: '한국 주식 자동매매 플랫폼',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}
