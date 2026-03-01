import WebApp from '@twa-dev/sdk'

export function useTelegramUser() {
  const user = WebApp.initDataUnsafe?.user

  return {
    id: user?.id,
    firstName: user?.first_name ?? 'Пользователь',
    username: user?.username,
    photoUrl: user?.photo_url,
  }
}
