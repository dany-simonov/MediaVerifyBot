# Integration Test Results

> Заполняется вручную после прогона `pytest tests/integration/ -m integration`  
> с реальными API-ключами и тестовым датасетом.

## Условия тестирования

- **Дата:** _заполнить_
- **Окружение:** Python 3.11, реальные API-ключи
- **Датасет:** `media_samples/real/` и `media_samples/fake/`

---

## Изображения — SightEngine

| Файл | Ожидание | Факт (verdict) | Confidence | Latency |
|---|---|---|---|---|
| photo1.jpg | REAL | — | — | — |
| photo2.jpg | REAL | — | — | — |
| photo3.jpg | REAL | — | — | — |
| photo4.jpg | REAL | — | — | — |
| photo5.jpg | REAL | — | — | — |
| ai_generated1.jpg | FAKE | — | — | — |
| ai_generated2.jpg | FAKE | — | — | — |
| ai_generated3.jpg | FAKE | — | — | — |
| ai_generated4.jpg | FAKE | — | — | — |
| ai_generated5.jpg | FAKE | — | — | — |

**Точность:** _X/10_

---

## Изображения — HuggingFace (fallback)

| Файл | Ожидание | Факт (verdict) | Confidence | Latency |
|---|---|---|---|---|
| photo1.jpg | REAL | — | — | — |
| ai_generated1.jpg | FAKE | — | — | — |

---

## Аудио — Resemble Detect

| Файл | Ожидание | Факт (verdict) | Confidence | Latency |
|---|---|---|---|---|
| voice1.wav | REAL | — | — | — |
| voice2.wav | REAL | — | — | — |
| voice3.wav | REAL | — | — | — |
| voice4.wav | REAL | — | — | — |
| voice5.wav | REAL | — | — | — |
| tts1.wav | FAKE | — | — | — |
| tts2.wav | FAKE | — | — | — |
| tts3.wav | FAKE | — | — | — |
| tts4.wav | FAKE | — | — | — |
| tts5.wav | FAKE | — | — | — |

**Точность:** _X/10_

---

## Текст — Sapling AI

| Файл | Ожидание | Факт (verdict) | Confidence | Latency |
|---|---|---|---|---|
| article1.txt | REAL | — | — | — |
| article2.txt | REAL | — | — | — |
| article3.txt | REAL | — | — | — |
| article4.txt | REAL | — | — | — |
| article5.txt | REAL | — | — | — |
| ai_text1.txt | FAKE | — | — | — |
| ai_text2.txt | FAKE | — | — | — |
| ai_text3.txt | FAKE | — | — | — |
| ai_text4.txt | FAKE | — | — | — |
| ai_text5.txt | FAKE | — | — | — |

**Точность:** _X/10_

---

## Видео — Video Pipeline

| Файл | Ожидание | Факт (verdict) | Confidence | Frames | Latency |
|---|---|---|---|---|---|
| clip1.mp4 | REAL | — | — | — | — |
| clip2.mp4 | REAL | — | — | — | — |
| clip3.mp4 | REAL | — | — | — | — |
| deepfake1.mp4 | FAKE | — | — | — | — |
| deepfake2.mp4 | FAKE | — | — | — | — |
| deepfake3.mp4 | FAKE | — | — | — | — |

**Точность:** _X/6_

---

## Итог

| Тип медиа | Корректных | Всего | Точность |
|---|---|---|---|
| Изображения (SE) | — | 10 | — |
| Изображения (HF) | — | 2 | — |
| Аудио (Resemble) | — | 10 | — |
| Текст (Sapling) | — | 10 | — |
| Видео (Pipeline) | — | 6 | — |
| **Итого** | **—** | **38** | **—** |

---

## Примечания

_Добавить наблюдения: edge cases, ложные срабатывания, время холодного старта HF и т.д._
