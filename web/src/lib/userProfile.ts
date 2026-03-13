export interface UserProfilePrefs {
  avatarDataUrl: string | null;
}

const PROFILE_PREFIX = 'mv_profile';
const MAX_AVATAR_SIZE = 2 * 1024 * 1024;

const profileKey = (userId: string) => `${PROFILE_PREFIX}:${userId}`;

export function loadUserProfile(userId: string): UserProfilePrefs {
  if (!userId) return { avatarDataUrl: null };

  try {
    const raw = localStorage.getItem(profileKey(userId));
    if (!raw) return { avatarDataUrl: null };

    const parsed = JSON.parse(raw) as Partial<UserProfilePrefs>;
    return {
      avatarDataUrl: typeof parsed.avatarDataUrl === 'string' ? parsed.avatarDataUrl : null,
    };
  } catch {
    return { avatarDataUrl: null };
  }
}

export function saveUserAvatar(userId: string, avatarDataUrl: string): void {
  localStorage.setItem(profileKey(userId), JSON.stringify({ avatarDataUrl }));
}

export function clearUserAvatar(userId: string): void {
  localStorage.removeItem(profileKey(userId));
}

export async function fileToAvatarDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Поддерживаются только изображения');
  }
  if (file.size > MAX_AVATAR_SIZE) {
    throw new Error('Максимальный размер фото профиля: 2 МБ');
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Не удалось прочитать изображение'));
      }
    };
    reader.onerror = () => reject(new Error('Ошибка чтения файла'));
    reader.readAsDataURL(file);
  });
}
