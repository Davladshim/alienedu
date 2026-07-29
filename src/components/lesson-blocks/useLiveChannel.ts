'use client'
import { useEffect, useRef, useState } from 'react'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { getSupabase } from '@/lib/supabase'

export interface LiveChannelOptions {
  onBroadcast?: Record<string, (payload: Record<string, unknown>) => void>
  onPresenceSync?: (states: Record<string, unknown>[]) => void
}

export interface LiveChannel {
  ready: boolean
  broadcast: (event: string, payload: Record<string, unknown>) => void
  track: (state: Record<string, unknown>) => void
}

// Общий канал Supabase Realtime для живой трансляции прогресса урока и
// команд учителя (показать решение/доску) — используется и на странице
// ученика, и на странице наблюдения учителя. channelName приходит с сервера
// уже готовым (см. src/lib/liveChannelName.ts) — сам хук ничего не знает
// про id урока/ученика, просто подключается к каналу по имени.
//
// Обработчики передаются объектом options, а не отдельным `on()` — у
// supabase-js подписки на broadcast/presence обязательно должны быть
// зарегистрированы ДО вызова subscribe(), иначе он бросает исключение;
// options.onBroadcast читается один раз в момент создания канала, а свежие
// версии обработчиков подхватываются через ref, без пересоздания подписки
export function useLiveChannel(channelName: string | null, options: LiveChannelOptions = {}): LiveChannel {
  const channelRef = useRef<RealtimeChannel | null>(null)
  const [ready, setReady] = useState(false)
  const optionsRef = useRef(options)

  // Синхронизируем ref со свежими options ДО эффекта создания канала ниже —
  // эффекты одного компонента выполняются в порядке объявления, так что
  // даже на первом рендере канал увидит актуальные обработчики
  useEffect(() => {
    optionsRef.current = options
  })

  useEffect(() => {
    if (!channelName) return
    // Живое наблюдение — необязательная надстройка поверх урока: если
    // Supabase не сконфигурирован или недоступен, страница урока/наблюдения
    // всё равно должна открываться и работать, просто без живой синхронизации
    let cancelled = false
    let channel: RealtimeChannel | null = null

    getSupabase().then(supabase => {
      if (cancelled) return
      channel = supabase.channel(channelName)
      channelRef.current = channel

      for (const event of Object.keys(optionsRef.current.onBroadcast || {})) {
        channel.on('broadcast', { event }, ({ payload }) => {
          optionsRef.current.onBroadcast?.[event]?.(payload as Record<string, unknown>)
        })
      }
      if (optionsRef.current.onPresenceSync) {
        channel.on('presence', { event: 'sync' }, () => {
          const state = channel!.presenceState()
          optionsRef.current.onPresenceSync?.(Object.values(state).flat() as Record<string, unknown>[])
        })
      }

      channel.subscribe(status => {
        if (status === 'SUBSCRIBED') setReady(true)
      })
    }).catch(error => {
      console.error('Не удалось подключиться к живому каналу:', error)
    })

    return () => {
      cancelled = true
      if (channel) {
        const channelToRemove = channel
        getSupabase().then(supabase => supabase.removeChannel(channelToRemove)).catch(() => {})
      }
      channelRef.current = null
      setReady(false)
    }
    // channelName — единственная зависимость: набор событий (ключи onBroadcast)
    // должен быть статичным между рендерами одного компонента, а сами
    // обработчики читаются через optionsRef без пересоздания подписки
  }, [channelName])

  function broadcast(event: string, payload: Record<string, unknown>) {
    try {
      channelRef.current?.send({ type: 'broadcast', event, payload })
    } catch (error) {
      console.error('Не удалось отправить событие в живой канал:', error)
    }
  }

  function track(state: Record<string, unknown>) {
    try {
      channelRef.current?.track(state)
    } catch (error) {
      console.error('Не удалось обновить присутствие в живом канале:', error)
    }
  }

  return { ready, broadcast, track }
}
