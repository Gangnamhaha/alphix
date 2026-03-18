import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function SettingsPage() {
  return (
    <Tabs defaultValue="profile" className="space-y-4">
      <TabsList>
        <TabsTrigger value="profile">프로필</TabsTrigger>
        <TabsTrigger value="broker">브로커</TabsTrigger>
        <TabsTrigger value="notifications">알림</TabsTrigger>
      </TabsList>

      <TabsContent value="profile" className="space-y-3">
        <h2 className="text-lg font-semibold">프로필 설정</h2>
        <Input placeholder="이름" defaultValue="김알파" />
        <Input placeholder="이메일" defaultValue="alpha@alphix.ai" />
        <Button>프로필 저장</Button>
      </TabsContent>

      <TabsContent value="broker" className="space-y-3">
        <h2 className="text-lg font-semibold">브로커 연결</h2>
        <Input placeholder="브로커 이름" defaultValue="한국투자증권" />
        <Input placeholder="API Key" defaultValue="pk_live_xxxxxxxxxxxxx" />
        <Input placeholder="API Secret" defaultValue="sk_live_xxxxxxxxxxxxx" />
        <Button>연결 테스트</Button>
      </TabsContent>

      <TabsContent value="notifications" className="space-y-3">
        <h2 className="text-lg font-semibold">알림 설정</h2>
        <Input placeholder="이메일 알림" defaultValue="활성화" />
        <Input placeholder="Slack Webhook" defaultValue="https://hooks.slack.com/services/T000/B000/XXXX" />
        <Input placeholder="손실 한도 알림 (%)" defaultValue="-3" />
        <Button>알림 저장</Button>
      </TabsContent>
    </Tabs>
  )
}
