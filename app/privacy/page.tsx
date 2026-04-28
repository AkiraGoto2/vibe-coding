import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield } from "lucide-react";

export default function PrivacyPage() {
  const updated = "26 апреля 2026 г.";
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Button asChild variant="ghost" className="mb-8 gap-2 -ml-2">
          <Link href="/"><ArrowLeft className="w-4 h-4" />Назад</Link>
        </Button>
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Политика конфиденциальности</h1>
            <p className="text-sm text-muted-foreground">Обновлено: {updated}</p>
          </div>
        </div>
        <div className="space-y-8 text-foreground">
          <section>
            <h2 className="text-lg font-semibold mb-3">1. Оператор персональных данных</h2>
            <p className="text-muted-foreground leading-relaxed">Оператором персональных данных является владелец сервиса «Break Reminder». Настоящая политика разработана в соответствии с требованиями Федерального закона от 27.07.2006 № 152-ФЗ «О персональных данных».</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold mb-3">2. Какие данные мы собираем</h2>
            <ul className="text-muted-foreground space-y-2 list-disc list-inside">
              <li><strong className="text-foreground">Имя</strong> — указывается при регистрации, используется для обращения</li>
              <li><strong className="text-foreground">Email</strong> — для входа в аккаунт и отправки кода подтверждения</li>
              <li><strong className="text-foreground">Хешированный пароль</strong> — хранится в зашифрованном виде (bcrypt), оригинал не сохраняется</li>
              <li><strong className="text-foreground">Настройки таймера</strong> — длительность работы и перерывов, язык интерфейса</li>
              <li><strong className="text-foreground">Сообщения обратной связи</strong> — тема и текст, отправленные добровольно</li>
            </ul>
          </section>
          <section>
            <h2 className="text-lg font-semibold mb-3">3. Цели обработки</h2>
            <ul className="text-muted-foreground space-y-2 list-disc list-inside">
              <li>Идентификация пользователя и доступ к личному кабинету</li>
              <li>Синхронизация настроек между устройствами</li>
              <li>Ответ на обращения через форму обратной связи</li>
              <li>Обеспечение безопасности сервиса</li>
            </ul>
          </section>
          <section>
            <h2 className="text-lg font-semibold mb-3">4. Где хранятся данные</h2>
            <p className="text-muted-foreground leading-relaxed">Данные хранятся в базе данных PostgreSQL на серверах, расположенных на территории Российской Федерации, в соответствии с требованиями ч. 5 ст. 18 152-ФЗ.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold mb-3">5. Передача третьим лицам</h2>
            <p className="text-muted-foreground leading-relaxed">Персональные данные не продаются и не передаются третьим лицам. Передача возможна только по требованию уполномоченных государственных органов в порядке, установленном законодательством РФ.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold mb-3">6. Cookie-файлы</h2>
            <p className="text-muted-foreground leading-relaxed mb-2">Сайт использует только технически необходимые cookie:</p>
            <ul className="text-muted-foreground list-disc list-inside">
              <li><code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">break_reminder_session</code> — токен авторизации (HTTP-only, недоступен из JavaScript)</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-2">Маркетинговые, аналитические и рекламные cookie не используются. Google Analytics, Яндекс.Метрика и другая сторонняя аналитика не подключены.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold mb-3">7. Ваши права (ст. 14–17 152-ФЗ)</h2>
            <ul className="text-muted-foreground space-y-2 list-disc list-inside">
              <li>Получить информацию об обработке ваших персональных данных</li>
              <li>Потребовать исправления неточных данных</li>
              <li>Потребовать удаления данных («право на забвение»)</li>
              <li>Отозвать согласие на обработку</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-2">Для реализации прав — обратитесь через форму обратной связи в приложении.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold mb-3">8. Сроки хранения</h2>
            <ul className="text-muted-foreground space-y-2 list-disc list-inside">
              <li>Данные аккаунта — до удаления пользователем или по требованию</li>
              <li>Сессии — автоматически удаляются через 30 дней</li>
              <li>Коды подтверждения email — через 15 минут</li>
            </ul>
          </section>
          <section>
            <h2 className="text-lg font-semibold mb-3">9. Безопасность</h2>
            <ul className="text-muted-foreground space-y-2 list-disc list-inside">
              <li>Пароли хешируются алгоритмом bcrypt (cost factor 12)</li>
              <li>Токены хранятся в HTTP-only cookie (защита от XSS)</li>
              <li>Все соединения защищены протоколом HTTPS/TLS</li>
              <li>Rate limiting на auth-эндпоинтах (защита от брутфорса)</li>
            </ul>
          </section>
        </div>
        <div className="mt-12 pt-8 border-t border-border">
          <p className="text-xs text-muted-foreground">© Break Reminder · <Link href="/" className="hover:text-foreground underline underline-offset-4">На главную</Link></p>
        </div>
      </div>
    </div>
  );
}
